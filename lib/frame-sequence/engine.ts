// FrameSequenceEngine: plain TypeScript (no React) frame-sequence loader and renderer.
//
//   fetch()  : compressed Blob cache for every frame, prioritised by distance to the
//              current frame plus a coarse-to-fine stride so a nearby fallback always exists.
//   decode() : createImageBitmap(blob, crop, resize) off the main thread, into a windowed,
//              memory-budgeted, direction-biased bitmap cache. Anything outside is close()d.
//   draw()   : nearest decoded frame, 1:1 blit when the bitmap matches the canvas backing.

import {
  bitmapBudget,
  computeBackingSize,
  coverCrop,
  coverDest,
  decodeWindow,
  nearestAvailable,
  pickNextDecode,
  pickNextFetch,
  type Rect,
  type Size,
} from './math';

export interface FrameSequenceEngineOptions {
  /** global index -> URL */
  urls: readonly string[];
  /** fetched first, never evicted */
  pinned: readonly number[];
  /** canvas clear colour */
  background: string;
  maxConcurrentFetches?: number;
  maxConcurrentDecodes?: number;
  nearWindow?: number;
}

const FETCH_IDLE = 0;
const FETCH_INFLIGHT = 1;
const FETCH_READY = 2;
const FETCH_FAILED = 3;

const RESIZE_DEBOUNCE_MS = 150;
const DEFAULT_SRC: Size = { w: 1920, h: 1080 };

export class FrameSequenceEngine {
  readonly total: number;

  private readonly urls: readonly string[];
  private readonly pinned: readonly number[];
  private readonly isPinned: Uint8Array;
  private readonly background: string;
  private readonly maxFetches: number;
  private readonly maxDecodes: number;
  private readonly nearWindow: number;

  private fetchState: Uint8Array;
  private retries: Uint8Array;
  private blobs: (Blob | null)[];
  private bitmaps: (ImageBitmap | null)[];
  private bitmapGen: Int32Array;
  private hasBitmap: Uint8Array;
  private decoding: Uint8Array;
  private needs: Uint8Array;

  private inflightFetches = 0;
  private inflightDecodes = 0;
  private current = 0;
  private dir = 1;
  private generation = 0;
  private src: Size | null = null;
  private probing = false;
  private backing: Size = { w: 1, h: 1 };
  private crop: Rect | null = null;
  private budget = 16;
  private fullFetch = false;
  private decodeEnabled = false;
  private started = false;
  private dirty = true;
  private lastDrawn: ImageBitmap | null = null;
  private drawnIdx = -1;
  private resizeSupported = true;
  private destroyed = false;
  private pumpQueued = false;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  private css: Size = { w: 0, h: 0 };
  private dpr = 1;

  private readonly abort = new AbortController();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(opts: FrameSequenceEngineOptions) {
    this.urls = opts.urls;
    this.total = opts.urls.length;
    this.pinned = opts.pinned.filter((p) => p >= 0 && p < opts.urls.length);
    this.background = opts.background;
    this.maxFetches = opts.maxConcurrentFetches ?? 6;
    const hc = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    this.maxDecodes = opts.maxConcurrentDecodes ?? Math.min(3, Math.max(1, Math.floor(hc / 2) - 1));
    this.nearWindow = opts.nearWindow ?? 12;

    const n = this.total;
    this.isPinned = new Uint8Array(n);
    for (const p of this.pinned) this.isPinned[p] = 1;
    this.fetchState = new Uint8Array(n);
    this.retries = new Uint8Array(n);
    this.blobs = new Array<Blob | null>(n).fill(null);
    this.bitmaps = new Array<ImageBitmap | null>(n).fill(null);
    this.bitmapGen = new Int32Array(n).fill(-1);
    this.hasBitmap = new Uint8Array(n);
    this.decoding = new Uint8Array(n);
    this.needs = new Uint8Array(n);
    this.budget = bitmapBudget(this.backing, undefined, n);
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.prepareContext();
  }

  /** Begin fetching pinned frames (call from an idle callback). */
  start(): void {
    if (this.destroyed || this.started) return;
    this.started = true;
    this.pump();
  }

  /** Once true stays true. */
  setFullFetch(on: boolean): void {
    if (on && !this.fullFetch) {
      this.fullFetch = true;
      this.schedulePump();
    }
  }

  setDecodeEnabled(on: boolean): void {
    if (this.destroyed || on === this.decodeEnabled) return;
    this.decodeEnabled = on;
    if (!on) {
      for (let i = 0; i < this.total; i++) {
        if (this.hasBitmap[i] && !this.isPinned[i]) this.releaseBitmap(i);
      }
    } else {
      this.dirty = true;
    }
    this.schedulePump();
  }

  resize(cssW: number, cssH: number, dpr: number): void {
    if (this.destroyed || cssW <= 0 || cssH <= 0) return;
    this.css = { w: cssW, h: cssH };
    this.dpr = dpr;
    this.applyCanvasSize();
    if (this.resizeTimer !== null) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      if (this.destroyed) return;
      this.generation++;
      this.refreshTargets();
      this.dirty = true;
      this.schedulePump();
    }, RESIZE_DEBOUNCE_MS);
  }

  /** Returns the index actually shown, -1 if none. */
  update(frame: number): number {
    if (this.destroyed || this.total === 0) return -1;
    const f = Math.min(this.total - 1, Math.max(0, Math.round(frame)));
    if (f !== this.current) {
      this.dir = f > this.current ? 1 : -1;
      this.current = f;
      this.dirty = true;
    }
    if (this.dirty) {
      this.dirty = false;
      this.pump();
    }
    const shown = nearestAvailable(this.hasBitmap, f);
    if (shown >= 0) {
      const bmp = this.bitmaps[shown];
      // Never replace what is on screen with a frame that is further from the target.
      if (bmp && bmp !== this.lastDrawn && (this.drawnIdx < 0 || Math.abs(shown - f) <= Math.abs(this.drawnIdx - f))) {
        this.draw(bmp);
        this.lastDrawn = bmp;
        this.drawnIdx = shown;
      }
    }
    return shown;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    for (let i = 0; i < this.total; i++) {
      const b = this.bitmaps[i];
      if (b) b.close();
      this.bitmaps[i] = null;
      this.hasBitmap[i] = 0;
    }
    this.blobs.fill(null);
    this.lastDrawn = null;
    this.canvas = null;
    this.ctx = null;
  }

  // ── Canvas ────────────────────────────────────────────────────────────────

  private prepareContext(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this.backing.w, this.backing.h);
  }

  private applyCanvasSize(): void {
    const canvas = this.canvas;
    if (!canvas || this.css.w <= 0) return;
    const next = computeBackingSize(this.css, this.src ?? DEFAULT_SRC, this.dpr);
    if (next.w === this.backing.w && next.h === this.backing.h && canvas.width === next.w && canvas.height === next.h) {
      return;
    }
    this.backing = next;
    canvas.width = next.w;
    canvas.height = next.h;
    this.prepareContext();
    // Redraw immediately (cover-fit from whatever is decoded) so there is no flash.
    this.lastDrawn = null;
    this.drawnIdx = -1;
    const idx = nearestAvailable(this.hasBitmap, this.current);
    const bmp = idx >= 0 ? this.bitmaps[idx] : null;
    if (bmp) {
      this.draw(bmp);
      this.lastDrawn = bmp;
      this.drawnIdx = idx;
    }
  }

  private refreshTargets(): void {
    if (this.src) this.crop = coverCrop(this.src, this.backing);
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    this.budget = bitmapBudget(this.backing, mem, this.total);
  }

  private draw(bmp: ImageBitmap): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const b = this.backing;
    const d = coverDest({ w: bmp.width, h: bmp.height }, b);
    if (bmp.width === b.w && bmp.height === b.h && d.x === 0 && d.y === 0 && d.w === b.w && d.h === b.h) {
      ctx.drawImage(bmp, 0, 0);
    } else {
      ctx.drawImage(bmp, d.x, d.y, d.w, d.h);
    }
  }

  // ── Bitmap bookkeeping ────────────────────────────────────────────────────

  private releaseBitmap(i: number): void {
    const b = this.bitmaps[i];
    this.bitmaps[i] = null;
    this.hasBitmap[i] = 0;
    this.bitmapGen[i] = -1;
    if (b) {
      if (b === this.lastDrawn) {
        this.lastDrawn = null;
      }
      b.close();
    }
  }

  // ── Scheduling ────────────────────────────────────────────────────────────

  private schedulePump(): void {
    if (this.pumpQueued || this.destroyed) return;
    this.pumpQueued = true;
    queueMicrotask(() => {
      this.pumpQueued = false;
      this.pump();
    });
  }

  private pump(): void {
    if (this.destroyed) return;

    // 1. Fetches
    if (this.started) {
      while (this.inflightFetches < this.maxFetches) {
        const i = pickNextFetch(this.fetchState, this.pinned, this.current, this.dir, this.nearWindow, this.fullFetch);
        if (i < 0) break;
        this.startFetch(i);
      }
    }

    // 2. Decodes
    if (!this.src || !this.crop) return;

    let lo = 1;
    let hi = 0; // empty window unless decoding is enabled (pinned frames are still decoded)
    if (this.decodeEnabled) {
      const w = Math.max(8, this.budget - this.pinned.length);
      const ahead = Math.ceil(w * 0.65);
      const behind = w - ahead;
      [lo, hi] = decodeWindow(this.current, this.dir, this.total, ahead, behind);
      for (let i = 0; i < this.total; i++) {
        if (this.hasBitmap[i] && !this.isPinned[i] && (i < lo || i > hi)) this.releaseBitmap(i);
      }
    }

    const needs = this.needs;
    for (let i = 0; i < this.total; i++) {
      needs[i] = this.fetchState[i] === FETCH_READY && !this.decoding[i] && this.bitmapGen[i] !== this.generation ? 1 : 0;
    }
    while (this.inflightDecodes < this.maxDecodes) {
      const i = pickNextDecode(needs, this.pinned, this.current, this.dir, lo, hi);
      if (i < 0) break;
      needs[i] = 0;
      this.startDecode(i);
    }
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────

  private startFetch(i: number): void {
    this.fetchState[i] = FETCH_INFLIGHT;
    this.inflightFetches++;
    const high = this.isPinned[i] === 1 || Math.abs(i - this.current) <= this.nearWindow;
    const init = {
      signal: this.abort.signal,
      cache: 'force-cache',
      priority: high ? 'high' : 'low',
    } as RequestInit;

    fetch(this.urls[i], init)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (this.destroyed) return;
        this.blobs[i] = blob;
        this.fetchState[i] = FETCH_READY;
        if (!this.src && !this.probing) this.probe(blob, i);
      })
      .catch((err: unknown) => {
        if (this.destroyed || (err instanceof DOMException && err.name === 'AbortError')) return;
        if (this.retries[i] < 2) {
          this.retries[i]++;
          this.fetchState[i] = FETCH_IDLE;
        } else {
          this.fetchState[i] = FETCH_FAILED;
        }
      })
      .finally(() => {
        this.inflightFetches--;
        this.dirty = true;
        this.schedulePump();
      });
  }

  /** Decode the first blob at full size to learn the source resolution. */
  private probe(blob: Blob, i: number): void {
    this.probing = true;
    createImageBitmap(blob)
      .then((bmp) => {
        if (this.destroyed) {
          bmp.close();
          return;
        }
        this.src = { w: bmp.width, h: bmp.height };
        const old = this.bitmaps[i];
        this.bitmaps[i] = bmp;
        this.bitmapGen[i] = -2; // stale on purpose: drawn by cover now, re-decoded later
        this.hasBitmap[i] = 1;
        if (old) old.close();
        this.applyCanvasSize();
        this.refreshTargets();
        this.dirty = true;
        this.schedulePump();
      })
      .catch(() => {
        this.probing = false; // next arriving blob will retry the probe
        this.fetchState[i] = FETCH_FAILED;
      });
  }

  // ── Decode ────────────────────────────────────────────────────────────────

  private startDecode(i: number): void {
    const blob = this.blobs[i];
    const crop = this.crop;
    if (!blob || !crop) return;
    const gen = this.generation;
    const backing = this.backing;
    this.decoding[i] = 1;
    this.inflightDecodes++;

    const decode = (): Promise<ImageBitmap> => {
      if (this.resizeSupported) {
        return createImageBitmap(blob, crop.x, crop.y, crop.w, crop.h, {
          resizeWidth: backing.w,
          resizeHeight: backing.h,
          resizeQuality: 'high',
        }).catch((err: unknown) => {
          if (err instanceof TypeError) {
            this.resizeSupported = false;
            return createImageBitmap(blob, crop.x, crop.y, crop.w, crop.h);
          }
          throw err;
        });
      }
      return createImageBitmap(blob, crop.x, crop.y, crop.w, crop.h);
    };

    decode()
      .then((bmp) => {
        if (this.destroyed || (!this.decodeEnabled && !this.isPinned[i])) {
          bmp.close();
          return;
        }
        const old = this.bitmaps[i];
        this.bitmaps[i] = bmp;
        this.bitmapGen[i] = gen;
        this.hasBitmap[i] = 1;
        if (old) {
          if (old === this.lastDrawn) this.lastDrawn = null;
          old.close();
        }
      })
      .catch(() => {
        if (!this.destroyed) this.fetchState[i] = FETCH_FAILED;
      })
      .finally(() => {
        this.decoding[i] = 0;
        this.inflightDecodes--;
        this.dirty = true;
        this.schedulePump();
      });
  }
}
