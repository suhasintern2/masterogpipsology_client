// Pure, dependency-free helpers for the scroll-driven frame sequence engine.
// No `@/` imports and only erasable TypeScript syntax so `node --test` can load it.

export interface Size { w: number; h: number }
export interface Rect { x: number; y: number; w: number; h: number }

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

/** 0..1 progress of a sticky section. range = sectionH - viewportH; returns 0 if range <= 0. */
export function sectionProgress(scroll: number, top: number, sectionH: number, viewportH: number): number {
  const range = sectionH - viewportH;
  if (!(range > 0)) return 0;
  return clamp01((scroll - top) / range);
}

/** Frame-rate independent exponential damping. rate <= 0 returns target. Snaps when |target-next| < 1e-5. */
export function damp(current: number, target: number, rate: number, dtSec: number): number {
  if (!(rate > 0)) return target;
  const next = current + (target - current) * (1 - Math.exp(-dtSec * rate));
  return Math.abs(target - next) < 1e-5 ? target : next;
}

/**
 * Canvas backing size: DPR-aware but never more pixels than the cover-fitted source can supply.
 */
export function computeBackingSize(css: Size, src: Size, dpr: number, dprCap: number = 2): Size {
  const cover = Math.max(css.w / src.w, css.h / src.h);
  const useful = cover > 0 ? 1 / cover : 1;
  const scale = Math.max(1, Math.min(Math.min(dpr || 1, dprCap), useful));
  return {
    w: Math.max(1, Math.round(css.w * scale)),
    h: Math.max(1, Math.round(css.h * scale)),
  };
}

/** Integer, centred source crop that a cover-fit to `dest` shows. */
export function coverCrop(src: Size, dest: Size): Rect {
  const scale = Math.max(dest.w / src.w, dest.h / src.h);
  const w = clamp(Math.round(dest.w / scale), 1, src.w);
  const h = clamp(Math.round(dest.h / scale), 1, src.h);
  const x = Math.max(0, Math.floor((src.w - w) / 2));
  const y = Math.max(0, Math.floor((src.h - h) / 2));
  return { x, y, w, h };
}

/** Integer dest rect to draw an image of size `img` so it covers `dest` (centred). */
export function coverDest(img: Size, dest: Size): Rect {
  const ratio = Math.max(dest.w / img.w, dest.h / img.h);
  const w = Math.round(img.w * ratio);
  const h = Math.round(img.h * ratio);
  return { x: Math.round((dest.w - w) / 2), y: Math.round((dest.h - h) / 2), w, h };
}

/** Nearest index i with flags[i] truthy, searching idx, idx-1, idx+1, idx-2, idx+2... -1 if none. */
export function nearestAvailable(flags: ArrayLike<number>, idx: number): number {
  const n = flags.length;
  if (n === 0) return -1;
  const start = clamp(idx, 0, n - 1);
  if (flags[start]) return start;
  for (let d = 1; d < n; d++) {
    const back = start - d;
    if (back >= 0 && flags[back]) return back;
    const fwd = start + d;
    if (fwd < n && flags[fwd]) return fwd;
    if (back < 0 && fwd >= n) break;
  }
  return -1;
}

export const FETCH_STRIDES: readonly number[] = [16, 8, 4, 2, 1];

/**
 * Lower = sooner. Frames within nearWindow of current: score = dist. Otherwise
 * (strideLevel+1)*1_000_000 + dist. dist = |i-current|, doubled when behind the scroll direction.
 */
export function fetchScore(i: number, current: number, dir: number, nearWindow: number): number {
  const delta = i - current;
  const raw = Math.abs(delta);
  const dist = delta * (dir >= 0 ? 1 : -1) < 0 ? raw * 2 : raw;
  if (raw <= nearWindow) return dist;
  let level = FETCH_STRIDES.length - 1;
  for (let k = 0; k < FETCH_STRIDES.length; k++) {
    if (i % FETCH_STRIDES[k] === 0) { level = k; break; }
  }
  return (level + 1) * 1_000_000 + dist;
}

/**
 * state: 0 idle, 1 in flight, 2 ready, 3 failed. Pinned idle frames first (in given order);
 * if !full only pinned are eligible; else min fetchScore among idle. -1 if none.
 */
export function pickNextFetch(
  state: ArrayLike<number>,
  pinned: readonly number[],
  current: number,
  dir: number,
  nearWindow: number,
  full: boolean,
): number {
  for (let k = 0; k < pinned.length; k++) {
    const p = pinned[k];
    if (p >= 0 && p < state.length && state[p] === 0) return p;
  }
  if (!full) return -1;
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < state.length; i++) {
    if (state[i] !== 0) continue;
    const s = fetchScore(i, current, dir, nearWindow);
    if (s < bestScore) { bestScore = s; best = i; }
  }
  return best;
}

/** Inclusive [lo, hi] decode window, `ahead` frames in scroll direction and `behind` the other way. */
export function decodeWindow(current: number, dir: number, total: number, ahead: number, behind: number): [number, number] {
  const fwd = dir >= 0;
  const lo = current - (fwd ? behind : ahead);
  const hi = current + (fwd ? ahead : behind);
  return [Math.max(0, lo), Math.min(total - 1, hi)];
}

/**
 * needs[i] truthy = blob ready, not in flight, bitmap missing or stale. Pinned needing decode first;
 * else nearest to current within [lo,hi], ahead-of-direction wins ties. -1 if none.
 */
export function pickNextDecode(
  needs: ArrayLike<number>,
  pinned: readonly number[],
  current: number,
  dir: number,
  lo: number,
  hi: number,
): number {
  for (let k = 0; k < pinned.length; k++) {
    const p = pinned[k];
    if (p >= 0 && p < needs.length && needs[p]) return p;
  }
  if (lo > hi) return -1;
  const step = dir >= 0 ? 1 : -1;
  const maxD = Math.max(Math.abs(hi - current), Math.abs(current - lo));
  for (let d = 0; d <= maxD; d++) {
    const ahead = current + step * d;
    if (ahead >= lo && ahead <= hi && ahead >= 0 && ahead < needs.length && needs[ahead]) return ahead;
    if (d === 0) continue;
    const behind = current - step * d;
    if (behind >= lo && behind <= hi && behind >= 0 && behind < needs.length && needs[behind]) return behind;
  }
  return -1;
}

const MB = 1024 * 1024;

/** Max decoded frames for this canvas (see plan A3). */
export function bitmapBudget(backing: Size, deviceMemoryGB: number | undefined, total: number): number {
  const mem = deviceMemoryGB === undefined ? 4 : deviceMemoryGB;
  const budget = (mem >= 8 ? 384 : mem >= 4 ? 256 : 128) * MB;
  const bytes = Math.max(1, backing.w * backing.h * 4);
  const hi = Math.min(total, 240);
  return Math.min(hi, Math.max(16, Math.floor(budget / bytes)));
}
