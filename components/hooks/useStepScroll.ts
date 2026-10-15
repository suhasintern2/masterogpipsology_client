'use client';

// ─── Stepped frame scrolling ──────────────────────────────────────────────────
// One wheel/touch/key gesture moves exactly one stop ("slab"); the page glides at a fixed frame rate and then holds.
// Frames, captions and slab texts keep reading scroll as before. Policy lives in lib/step-scroll.ts (pure, tested).

import { useEffect, useState } from 'react';
import type Lenis from 'lenis';
import type { VirtualScrollData } from 'lenis';
import { addScrollGate, useLenis } from '@/components/providers/LenisProvider';
import type { SequenceLayout } from '@/components/hooks/useFrameSequence';
import {
  AUTO_ADVANCE_MS,
  GLIDE_WATCHDOG_MS,
  HOLD_MIN_MS,
  KEY_ARROW_PX,
  KEY_PAGE_SHARE,
  MOMENTUM_WINDOW_MS,
  OVERFLOW_UNLOCK_MS,
  REST_SNAP_FRAMES,
  SETTLE_IDLE_MS,
  STEP_FPS,
  STOP_TOL_PX,
  SWIPE_MIN_PX,
  createWheelGesture,
  decideStep,
  feedWheel,
  glideEase,
  glideProfile,
  nearestStop,
  sectionProgressOf,
  stopAt,
  stopCoord,
  type FrameMap,
  type StepAction,
} from '@/lib/step-scroll';

export interface StepScrollOptions {
  /** Stop list indices, ascending (Crypto [0, 89, 110, 142]; Forex chain [0, 50, 88, 154, 217]). */
  stops: readonly number[];
  /** Frame list length (Crypto 192). */
  total: number;
  /** Scroll progress <-> frame position of the sequence (Crypto: knot map, Forex: linear map). */
  map: FrameMap;
  /** Cruise speed in list frames per second. Default STEP_FPS. */
  fps?: number;
  /** Extra last stop at a scroll offset (not a frame): Crypto = ForexFade end, Forex frame 1 opaque. Frame there is not snapped. */
  tail?: (l: Readonly<SequenceLayout>) => number;
  /** Virtual list frames for the tail segment (last frame stop -> tail), so a glide there follows the speed rule even though no
   *  frame moves (Forex: the video hand-off). */
  tailFrames?: number;
  /** ys index whose landing from a downward glide auto-glides on to the next stop after the hold (Forex: O3 -> video). */
  autoAdvance?: number;
}

interface TouchState {
  active: boolean;
  multi: boolean;
  x0: number;
  y0: number;
  engaged: boolean;   // started inside the zone or while busy: moves are cancelled unless released
  decided: boolean;   // first move evaluated
  released: boolean;  // native for the rest of this touch (exit or horizontal)
  committed: boolean; // this touch already stepped (or must never step)
  lastEnd: number;    // performance.now() of the last touchend
}

type Timer = ReturnType<typeof setTimeout> | null;

// Both step-scroll controllers live on one page and share the scroll offset Y0 (Crypto's last stop = Forex's first stop).
const registry = new Set<StepScrollController>();
let sharedHoldUntil = 0; // one landing hold for all controllers

export class StepScrollController {
  private readonly stops: readonly number[];
  private readonly total: number;
  private readonly map: FrameMap;
  private readonly fps: number;
  private readonly tail?: (l: Readonly<SequenceLayout>) => number;
  private readonly tailFrames?: number;
  private readonly autoAdvance?: number;

  private ys: number[] = [];
  private layout: SequenceLayout = { top: 0, height: 0, viewportH: 0 };
  private ready = false;
  private firstLayout = true;
  private lenis: Lenis | null = null;

  private gliding = false;
  private glideDeadline = 0;
  private restStop = -1;
  private restIdx = -1;

  private wheel = createWheelGesture();
  private acted: { id: number; kind: 'consume' | 'pass' } = { id: 0, kind: 'pass' }; // wheel ids >= 1, key ids <= -1
  private keySeq = 0;
  private touch: TouchState = {
    active: false, multi: false, x0: 0, y0: 0, engaged: false, decided: false, released: false, committed: false, lastEnd: -1e12,
  };

  private prevY = 0;
  private inCatch = false;
  private locked = false;
  private settleTimer: Timer = null;
  private unlockTimer: Timer = null;
  private autoTimer: Timer = null;
  private glideDir: 1 | -1 = 1;

  constructor(options: StepScrollOptions) {
    this.stops = options.stops;
    this.total = options.total;
    this.map = options.map;
    this.fps = options.fps ?? STEP_FPS;
    this.tail = options.tail;
    this.tailFrames = options.tailFrames;
    this.autoAdvance = options.autoAdvance;
  }

  // ── Public API (called by the section) ──

  onLayout = (l: Readonly<SequenceLayout>): void => {
    this.layout = { top: l.top, height: l.height, viewportH: l.viewportH };
    const range = l.height - l.viewportH;
    const base = this.stops.map((i) => l.top + this.map.progress(i) * range);
    if (this.tail && base.length > 0) {
      const t = Math.min(l.top + range, this.tail(l));
      if (t > base[base.length - 1] + STOP_TOL_PX) base.push(t);
    }
    this.ys = base;
    this.ready = l.height > l.viewportH && this.ys.length > 0;
    if (!this.ready) return;
    if (!this.gliding) {
      const y = this.y();
      if (this.restStop >= 0 && Math.abs(y - this.ys[this.restStop]) > STOP_TOL_PX) {
        this.jump(this.ys[this.restStop]); // a resize moved the stop
      } else if (this.firstLayout && this.inZone(y) && stopAt(this.ys, y, STOP_TOL_PX) < 0) {
        this.jump(this.ys[nearestStop(this.ys, y)]); // reload restored mid-zone
      }
    }
    this.firstLayout = false;
    this.prevY = this.y();
    this.refreshRest();
  };

  /** Exact stop index while resting on it, else the computed position. */
  frameFor = (pos: number): number =>
    this.restIdx >= 0 && Math.abs(pos - this.restIdx) <= REST_SNAP_FRAMES ? this.restIdx : pos;

  /** Stop coordinate for a scroll offset (slab texts, rail). */
  coord = (scroll: number): number => {
    const n = this.ys.length;
    if (n === 0) return -1;
    const end = this.layout.top + (this.layout.height - this.layout.viewportH);
    const exit = this.ys.length > this.stops.length ? this.layout.viewportH : end - this.ys[n - 1]; // the hand-off fade
    return stopCoord(scroll, this.ys, this.layout.viewportH, exit);
  };

  attach(lenis: Lenis | null): () => void {
    this.lenis = lenis;
    registry.add(this);
    this.prevY = this.ready ? this.y() : 0;
    const offs: Array<() => void> = [];
    if (lenis) {
      offs.push(addScrollGate(this.onInput));
      offs.push(lenis.on('scroll', this.onScroll));
    } else {
      // Reduced motion (no Lenis): own non-passive listeners, same policy, instant jumps.
      const onWheel = (e: WheelEvent): void => {
        const m = e.deltaMode === 1 ? 100 / 6 : e.deltaMode === 2 ? window.innerHeight : 1; // same as Lenis VirtualScroll
        this.onInput({ deltaX: e.deltaX * m, deltaY: e.deltaY * m, event: e });
      };
      const onTouch = (e: TouchEvent): void => {
        this.onInput({ deltaX: 0, deltaY: 0, event: e });
      };
      const opt: AddEventListenerOptions = { passive: false };
      const onScroll = (): void => this.onScroll();
      window.addEventListener('wheel', onWheel, opt);
      window.addEventListener('touchstart', onTouch, opt);
      window.addEventListener('touchmove', onTouch, opt);
      window.addEventListener('touchend', onTouch, opt);
      window.addEventListener('scroll', onScroll, { passive: true });
      offs.push(() => {
        window.removeEventListener('wheel', onWheel, opt);
        window.removeEventListener('touchstart', onTouch, opt);
        window.removeEventListener('touchmove', onTouch, opt);
        window.removeEventListener('touchend', onTouch, opt);
        window.removeEventListener('scroll', onScroll);
      });
    }
    window.addEventListener('keydown', this.onKey);
    offs.push(() => window.removeEventListener('keydown', this.onKey));
    this.refreshRest();
    return () => {
      for (const off of offs) off();
      registry.delete(this);
      if (this.settleTimer) clearTimeout(this.settleTimer);
      if (this.unlockTimer) clearTimeout(this.unlockTimer);
      if (this.autoTimer) clearTimeout(this.autoTimer);
      this.settleTimer = this.unlockTimer = this.autoTimer = null;
      if (this.locked) {
        this.locked = false;
        document.documentElement.style.overflow = '';
      }
      this.gliding = false;
      this.lenis = null;
    };
  }

  // ── Helpers ──

  private y(): number {
    return this.lenis ? this.lenis.animatedScroll : window.scrollY;
  }

  private busy(): boolean {
    return this.gliding || performance.now() < sharedHoldUntil;
  }

  private inZone(y: number): boolean {
    const n = this.ys.length;
    return n > 0 && y >= this.ys[0] - STOP_TOL_PX && y <= this.ys[n - 1] + STOP_TOL_PX;
  }

  /** true if y lies inside another registered controller's stop zone. */
  private foreign(y: number): boolean {
    for (const c of registry) if (c !== this && c.ready && c.inZone(y)) return true;
    return false;
  }

  private posAt(y: number): number {
    return this.map.pos(sectionProgressOf(y, this.layout.top, this.layout.height, this.layout.viewportH));
  }

  private watchdog(): void {
    if (this.gliding && performance.now() > this.glideDeadline) {
      this.gliding = false;
      this.refreshRest();
    }
  }

  private refreshRest(): void {
    const L = this.lenis;
    const moving = this.gliding || (L !== null && L.isScrolling !== false);
    const k = moving || !this.ready ? -1 : stopAt(this.ys, this.y(), STOP_TOL_PX);
    if (k >= 0 && this.restStop < 0) sharedHoldUntil = Math.max(sharedHoldUntil, performance.now() + HOLD_MIN_MS); // landing: brief hold
    this.restStop = k;
    this.restIdx = k >= 0 && k < this.stops.length ? this.stops[k] : -1;
  }

  private jump(Y: number): void {
    if (this.lenis) this.lenis.scrollTo(Y, { immediate: true, force: true });
    else window.scrollTo({ top: Y, behavior: 'instant' });
    this.refreshRest();
  }

  /** The mobile menu, the gallery modal, or another locked glide such as Start journey take precedence. */
  private blocked(): boolean {
    const L = this.lenis;
    return !!L && (L.isStopped || (L.isLocked && !this.gliding));
  }

  // ── Motion ──

  private glideTo(k: number): void {
    const Y = this.ys[k];
    const L = this.lenis;
    this.restStop = -1;
    this.restIdx = -1;
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    const y0 = this.y();
    let frames = Math.abs(this.posAt(Y) - this.posAt(y0));
    const n = this.ys.length;
    if (this.tailFrames && n > this.stops.length) {
      const a = this.ys[n - 2];
      const b = this.ys[n - 1];
      const cl = (v: number): number => Math.min(b, Math.max(a, v));
      frames += (this.tailFrames * Math.abs(cl(Y) - cl(y0))) / (b - a);
    }
    this.glideDir = Y >= y0 ? 1 : -1;
    if (!L || frames < 1e-3) {
      this.jump(Y); // reduced motion (no Lenis): straight to the stop
      return;
    }
    const prof = glideProfile(frames, this.fps);
    this.gliding = true;
    this.glideDeadline = performance.now() + prof.duration * 1000 + GLIDE_WATCHDOG_MS;
    L.scrollTo(Y, {
      duration: prof.duration,
      easing: (t) => glideEase(t, prof),
      lock: true,
      force: true,
      onComplete: () => {
        this.gliding = false;
        if (Math.abs(this.y() - this.ys[k]) > STOP_TOL_PX) this.jump(this.ys[k]); // layout moved during the glide
        for (const c of registry) c.refreshRest();
        if (this.autoAdvance === k && this.glideDir > 0) this.armAuto(k);
      },
    });
  }

  private armAuto(k: number): void {
    this.autoTimer = setTimeout(() => {
      this.autoTimer = null;
      if (!this.ready || this.gliding || this.blocked() || this.touch.active || stopAt(this.ys, this.y(), STOP_TOL_PX) !== k) return;
      this.glideTo(k + 1);
    }, AUTO_ADVANCE_MS);
  }

  /** Wheel and keys, entry: ease into an edge stop with Lenis's own lerp. */
  private catchTo(k: number): void {
    const Y = this.ys[k];
    const L = this.lenis;
    if (!L) {
      this.jump(Y);
      return;
    }
    if (L.targetScroll !== Y) L.scrollTo(Y, { programmatic: false, lerp: L.options.lerp, force: true });
  }

  /** true = let it through. */
  private apply(a: StepAction, e: Event, id: number): boolean {
    if (a.kind === 'pass') {
      this.acted = { id, kind: 'pass' };
      return true;
    }
    this.acted = { id, kind: 'consume' };
    if (e.cancelable) e.preventDefault();
    if (a.kind === 'glide') this.glideTo(a.stop);
    else if (a.kind === 'catch') this.catchTo(a.stop);
    return false;
  }

  // ── Input ──

  /** The Lenis gate; the native (no-Lenis) adapter calls it too. */
  private onInput = (data: VirtualScrollData): boolean => {
    const e = data.event;
    if (e.type === 'wheel') {
      const we = e as WheelEvent;
      if (we.ctrlKey || data.deltaY === 0) return true; // pinch-zoom / horizontal
      const fresh = feedWheel(this.wheel, we.timeStamp, data.deltaY); // always fed: keeps gesture timing exact
      if (!this.ready || this.blocked()) return true;
      this.watchdog();
      const y = this.y();
      const L = this.lenis;
      const id = this.wheel.id;
      return this.apply(
        decideStep(this.ys, STOP_TOL_PX, {
          y,
          target: (L ? L.targetScroll : y) + data.deltaY,
          dir: data.deltaY > 0 ? 1 : -1,
          fresh,
          acted: this.acted.id === id ? this.acted.kind : null,
          foreign: this.foreign(y),
          busy: this.busy(),
        }),
        we,
        id,
      );
    }
    if (!this.ready || this.blocked()) return true;
    this.watchdog();
    return this.onTouch(e as TouchEvent);
  };

  private onTouch(e: TouchEvent): boolean {
    const t = this.touch;
    if (e.type === 'touchstart') {
      if (e.touches.length > 1) {
        t.multi = true;
        return true;
      }
      t.active = true;
      t.multi = false;
      t.x0 = e.touches[0].clientX;
      t.y0 = e.touches[0].clientY;
      t.decided = false;
      t.released = false;
      t.engaged = this.busy() || this.inZone(this.y());
      t.committed = this.busy();
      return true; // never cancel a touchstart: taps and links must work
    }
    if (e.type === 'touchmove') {
      if (!t.active || t.multi || e.touches.length > 1) {
        t.multi = true;
        return true;
      }
      if (t.released || !t.engaged) return true; // native scroll is fine; the entry catch happens in onScroll
      const dx = e.touches[0].clientX - t.x0;
      const up = t.y0 - e.touches[0].clientY; // positive = scroll down
      const y = this.y();
      if (!t.decided) {
        t.decided = true;
        if (Math.abs(dx) > Math.abs(up)) {
          t.released = true; // horizontal
          return true;
        }
        if (
          !this.busy() &&
          !t.committed &&
          decideStep(this.ys, STOP_TOL_PX, { y, target: y + up, dir: up >= 0 ? 1 : -1, fresh: true, acted: null, foreign: this.foreign(y), busy: false }).kind === 'pass'
        ) {
          t.released = true; // exit at stop 0 up or stop 3 down: native scroll and momentum work
          return true;
        }
      }
      if (e.cancelable) e.preventDefault();
      if (!t.committed && !this.busy() && Math.abs(up) >= SWIPE_MIN_PX) {
        t.committed = true;
        const a = decideStep(this.ys, STOP_TOL_PX, { y, target: y + up, dir: up > 0 ? 1 : -1, fresh: true, acted: null, foreign: this.foreign(y), busy: false });
        if (a.kind === 'glide') this.glideTo(a.stop);
        else if (a.kind === 'catch') this.catchTo(a.stop);
        // pass = the finger reversed into an exit: do nothing
      }
      return false;
    }
    if (e.type === 'touchend') {
      t.active = false;
      t.lastEnd = performance.now();
      if (e.touches.length === 0) t.multi = false;
      if (this.locked) this.unlockSoon();
    }
    return true;
  }

  private onKey = (e: KeyboardEvent): void => {
    if (!this.ready || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || this.blocked()) return;
    let dir: 1 | -1;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
    else return; // Home and End included
    const el = e.target instanceof HTMLElement ? e.target : null;
    if (el) {
      if (el.isContentEditable || el.closest('input, textarea, select')) return;
      if (e.key === ' ' && el.closest('button, a[href], summary, [role="button"]')) return;
    }
    this.watchdog();
    if (!e.repeat) this.keySeq -= 1;
    const id = this.keySeq;
    const step = e.key.startsWith('Arrow') ? KEY_ARROW_PX : KEY_PAGE_SHARE * this.layout.viewportH;
    const y = this.y();
    this.apply(
      decideStep(this.ys, STOP_TOL_PX, {
        y,
        target: y + dir * step,
        dir,
        fresh: !e.repeat,
        acted: this.acted.id === id ? this.acted.kind : null,
        foreign: this.foreign(y),
        busy: this.busy(),
      }),
      e,
      id,
    );
  };

  /** Lenis 'scroll' event, or window scroll when there is no Lenis. */
  private onScroll = (): void => {
    if (!this.ready || this.inCatch) return;
    this.watchdog();
    const y = this.y();
    const L = this.lenis;
    const native = !L || L.isScrolling === 'native';
    if (native && !this.gliding) {
      const n = this.ys.length;
      const first = this.ys[0];
      const last = this.ys[n - 1];
      const touchy = this.touch.active || performance.now() - this.touch.lastEnd < MOMENTUM_WINDOW_MS;
      if (touchy) {
        if (this.prevY < first - STOP_TOL_PX && y >= first - STOP_TOL_PX) { if (!this.foreign(this.prevY)) { this.touchCatch(0); return; } }
        if (this.prevY > last + STOP_TOL_PX && y <= last + STOP_TOL_PX) { if (!this.foreign(this.prevY)) { this.touchCatch(n - 1); return; } }
      } else if (y > first + STOP_TOL_PX && y < last - STOP_TOL_PX) {
        this.armSettle();
      }
    }
    this.prevY = y;
    this.refreshRest();
  };

  private touchCatch(k: number): void {
    this.inCatch = true;
    if (!this.locked) {
      this.locked = true;
      document.documentElement.style.overflow = 'hidden';
    }
    this.prevY = this.ys[k];
    this.jump(this.ys[k]);
    this.inCatch = false;
    const t = this.touch;
    t.engaged = true;
    t.decided = true;
    t.released = false;
    t.committed = true;
    if (!t.active) this.unlockSoon();
  }

  private unlockSoon(): void {
    if (this.unlockTimer) clearTimeout(this.unlockTimer);
    this.unlockTimer = setTimeout(() => {
      this.unlockTimer = null;
      if (this.touch.active) return;
      this.locked = false;
      document.documentElement.style.overflow = '';
    }, OVERFLOW_UNLOCK_MS);
  }

  private armSettle(): void {
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(this.settle, SETTLE_IDLE_MS);
  }

  private settle = (): void => {
    this.settleTimer = null;
    if (!this.ready || this.gliding || this.touch.active || this.blocked()) return;
    const y = this.y();
    if (this.inZone(y) && stopAt(this.ys, y, STOP_TOL_PX) < 0) this.glideTo(nearestStop(this.ys, y));
  };
}

export function useStepScroll(options: StepScrollOptions): StepScrollController {
  const [ctl] = useState(() => new StepScrollController(options));
  const lenis = useLenis();
  useEffect(() => ctl.attach(lenis), [ctl, lenis]);
  return ctl;
}
