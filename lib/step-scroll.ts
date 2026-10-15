// Pure math for stepped frame scrolling (components/hooks/useStepScroll.ts). Import-free: node --test loads it.

/** Crypto stops picked by the owner with the HUD (unique mode): raw file numbers (ezgif-frame-NNN / NNN.webp), 1-based. */
export const CRYPTO_STOPS_RAW: readonly number[] = [1, 112, 139, 179];

/** Forex and Stock stops picked with the HUD (unique mode): raw 1-based file numbers. */
export const FOREX_STOPS_RAW: readonly number[] = [1, 64, 111, 194];
export const STOCK_STOPS_RAW: readonly number[] = [32, 189];
export const OPPORTUNITY_STOPS_RAW: readonly number[] = [97, 216, 240];

export const STEP_FPS = 48;              // cruise speed, list (unique) frames per second: 2x the 24 fps source motion
export const STEP_EASE_IN_S = 0.4;       // smoothstep velocity ramp 0 -> STEP_FPS at the start of a glide (9.6 frames)
export const STEP_DECEL_S = 1.0;         // momentum release into every stop: v = V (1 - u)^STEP_DECEL_POW (16 frames)
export const STEP_DECEL_POW = 2;
export const STEP_MIN_S = 0.8;           // floor for very short steps (21-frame slab 2 = 0.84 s stays unclamped)
export const HOLD_MIN_MS = 700;          // every landing holds at least this long (hook reading time); input inside it is swallowed
export const AUTO_ADVANCE_MS = 450;      // autoAdvance stop (Forex O3) -> next stop after this still (video hand-off timing)
export const STOP_TOL_PX = 2;            // "at a stop": Lenis rests on window.scrollY (device-pixel rounded)
export const REST_SNAP_FRAMES = 0.5;     // at rest, a frame position this close to the stop index shows the stop frame exactly
export const GESTURE_GAP_MS = 180;       // wheel silence that ends a gesture
export const GESTURE_LEVEL_TAU_MS = 240; // decay of the wheel level between events
export const GESTURE_RISE = 1.8;         // |delta| above level x this ...
export const GESTURE_RISE_MIN = 12;      // ... and at least this many px = a fresh push inside an inertia tail
export const SWIPE_MIN_PX = 24;          // touch travel that commits one step
export const SETTLE_IDLE_MS = 220;       // after native movement (scrollbar, find) stops inside the zone, glide to the nearest stop
export const MOMENTUM_WINDOW_MS = 2500;  // native scroll this soon after a touch counts as touch momentum (entry catch applies)
export const OVERFLOW_UNLOCK_MS = 120;   // root overflow lock (touch catch) is released this long after the finger is up
export const KEY_ARROW_PX = 80;          // assumed native distance of an arrow key (catch test)
export const KEY_PAGE_SHARE = 0.9;       // PageDown / Space distance as a share of the viewport
export const GLIDE_WATCHDOG_MS = 400;    // a glide not completed by duration + this is dead (lenis.stop(), overrides)

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Raw 1-based file number -> list index: the largest i with locals[i] <= raw - 1 (a pulldown repeat maps to its twin). */
export function stopListIndex(raw1: number, locals: ArrayLike<number>): number {
  const want = Math.round(raw1) - 1;
  let k = 0;
  for (let j = 0; j < locals.length; j++) {
    if (locals[j] <= want) k = j;
    else break;
  }
  return k;
}

/** Progress where the hand-off fade starts: (seq - overlap) / seq. Crypto: (350 - 100) / 350 = 5/7. */
export function knotProgress(seqScrollVh: number, overlapVh: number): number {
  return seqScrollVh > 0 ? clamp((seqScrollVh - overlapVh) / seqScrollVh, 0, 1) : 1;
}

/** Same as lib/frame-sequence/math.ts sectionProgress (duplicated: this file is import-free). */
export function sectionProgressOf(scroll: number, top: number, height: number, viewportH: number): number {
  const range = height - viewportH;
  if (!(range > 0)) return 0;
  return clamp((scroll - top) / range, 0, 1);
}

/** Piecewise-linear frame position: list 0..knotIdx over p in [0, knotP], knotIdx..total-1 over [knotP, 1]. */
export function framePos(p: number, total: number, knotIdx: number, knotP: number): number {
  const last = total - 1;
  if (!(last > 0)) return 0;
  const x = clamp(Number.isNaN(p) ? 0 : p, 0, 1);
  const kp = clamp(knotP, 0, 1);
  const ki = clamp(knotIdx, 0, last);
  if (x <= kp) return kp > 0 ? (x / kp) * ki : ki;
  return kp < 1 ? ki + ((x - kp) / (1 - kp)) * (last - ki) : ki;
}

/** Inverse of framePos: progress at which a frame position is shown. */
export function progressAt(pos: number, total: number, knotIdx: number, knotP: number): number {
  const last = total - 1;
  if (!(last > 0)) return 0;
  const q = clamp(Number.isNaN(pos) ? 0 : pos, 0, last);
  const kp = clamp(knotP, 0, 1);
  const ki = clamp(knotIdx, 0, last);
  if (q <= ki) return ki > 0 ? (q / ki) * kp : 0;
  return last > ki ? kp + ((q - ki) / (last - ki)) * (1 - kp) : kp;
}

/** Scroll progress <-> fractional list position for one sequence. */
export interface FrameMap { pos: (p: number) => number; progress: (pos: number) => number }

export function knotFrameMap(total: number, knotIdx: number, knotP: number): FrameMap {
  return {
    pos: (p) => framePos(p, total, knotIdx, knotP),
    progress: (q) => progressAt(q, total, knotIdx, knotP),
  };
}

/** Frames spread linearly over the first `portion` of the progress range, then held at the last frame. */
export function linearFrameMap(total: number, portion: number): FrameMap {
  const last = total - 1;
  if (!(last > 0)) return { pos: () => 0, progress: () => 0 };
  return {
    pos: (p) => (Number.isNaN(p) ? 0 : p < portion ? clamp((p / portion) * last, 0, last) : last),
    progress: (q) => (clamp(Number.isNaN(q) ? 0 : q, 0, last) / last) * portion,
  };
}

/** Chain stop indices: folder f, raw r -> f * locals.length + stopListIndex(r, locals). Folders in chain order. */
export function chainStopIndices(folders: readonly (readonly number[])[], locals: ArrayLike<number>): number[] {
  const out: number[] = [];
  folders.forEach((raws, f) => {
    for (const r of raws) out.push(f * locals.length + stopListIndex(r, locals));
  });
  return out;
}

/** Scroll offset (px) of a stop. range = section height - viewport height (the frame hook's measured layout). */
export function stopScrollY(idx: number, total: number, knotIdx: number, knotP: number, top: number, range: number): number {
  return top + progressAt(idx, total, knotIdx, knotP) * range;
}

/**
 * Scroll offset where ForexFade completes = the Forex section top (Forex marginTop -overlap vh; Crypto height (seq + 100) vh).
 * Desktop (L = D) this equals Crypto progress 1; on mobile it is (L - D) px earlier. Forex shows list 0 at opacity 1 here.
 */
export function handoffEndY(top: number, height: number, seqScrollVh: number, overlapVh: number): number {
  const total = seqScrollVh + 100;
  return total > 0 ? top + (height * (total - overlapVh)) / total : top;
}

export interface GlideProfile { frames: number; v: number; tIn: number; tCruise: number; tOut: number; duration: number }

/** Velocity profile for a glide of |frames| list frames: smoothstep in, cruise at fps, power-law decel (plan 9.2). */
export function glideProfile(frames: number, fps: number = STEP_FPS, tIn: number = STEP_EASE_IN_S, tOut: number = STEP_DECEL_S,
  pow: number = STEP_DECEL_POW, min: number = STEP_MIN_S): GlideProfile {
  const D = Math.abs(Number.isFinite(frames) ? frames : 0);
  let v = fps > 0 ? fps : STEP_FPS;
  let ti = tIn;
  let to = tOut;
  let tc = 0;
  const dMin = v * (ti / 2 + to / (pow + 1));
  if (D >= dMin) tc = (D - dMin) / v;
  else { const k = dMin > 0 ? D / dMin : 0; ti *= k; to *= k; }
  let d = ti + tc + to;
  if (d < min) {
    if (d > 0) { const m = min / d; ti *= m; tc *= m; to *= m; v /= m; }
    else { ti = 0; tc = 0; to = min; v = 0; } // zero-length glide: hold still for `min`
    d = min;
  }
  return { frames: D, v, tIn: ti, tCruise: tc, tOut: to, duration: d };
}

/** Position 0..1 at time t 0..1 of a glide with profile p (Lenis scrollTo easing). Exact 0 and 1 at the ends. */
export function glideEase(t: number, p: GlideProfile, pow: number = STEP_DECEL_POW): number {
  if (!(p.frames > 0)) return t >= 1 ? 1 : 0;
  const x = Number.isNaN(t) ? 0 : t < 0 ? 0 : t > 1 ? 1 : t;
  if (x >= 1) return 1;
  let tau = x * p.duration;
  const S = (u: number): number => u * u * u - (u * u * u * u) / 2; // integral of smoothstep, S(1) = 1/2
  let pos: number;
  if (tau < p.tIn) pos = p.v * p.tIn * S(tau / p.tIn);
  else {
    pos = (p.v * p.tIn) / 2;
    tau -= p.tIn;
    if (tau < p.tCruise) pos += p.v * tau;
    else {
      pos += p.v * p.tCruise;
      tau -= p.tCruise;
      const u = p.tOut > 0 ? Math.min(1, tau / p.tOut) : 1;
      pos += (p.v * p.tOut * (1 - Math.pow(1 - u, pow + 1))) / (pow + 1);
    }
  }
  const e = pos / p.frames;
  return e < 0 ? 0 : e > 1 ? 1 : e;
}

export interface WheelGesture { id: number; lastT: number; sign: number; level: number }
export function createWheelGesture(): WheelGesture {
  return { id: 0, lastT: -1e12, sign: 0, level: 0 };
}
/** Feeds one wheel delta (px, Lenis-normalised) at time t (ms). Returns true if it starts a new gesture (g.id is then incremented). */
export function feedWheel(g: WheelGesture, t: number, delta: number): boolean {
  const a = Math.abs(delta);
  const sign = delta > 0 ? 1 : delta < 0 ? -1 : 0;
  const gap = t - g.lastT;
  const decayed = g.level * Math.exp(-Math.max(0, gap) / GESTURE_LEVEL_TAU_MS);
  const fresh = gap > GESTURE_GAP_MS || sign !== g.sign || (a >= GESTURE_RISE_MIN && a > decayed * GESTURE_RISE);
  if (fresh) g.id += 1;
  g.lastT = t;
  g.sign = sign;
  g.level = fresh ? a : Math.max(a, decayed);
  return fresh;
}

/** Index of the stop within tol of y (nearest), else -1. */
export function stopAt(ys: ArrayLike<number>, y: number, tol: number): number {
  let best = -1;
  let bestD = Infinity;
  for (let k = 0; k < ys.length; k++) {
    const d = Math.abs(y - ys[k]);
    if (d <= tol && d < bestD) { best = k; bestD = d; }
  }
  return best;
}

/** Index of the nearest stop (-1 if none). */
export function nearestStop(ys: ArrayLike<number>, y: number): number {
  let best = -1;
  let bestD = Infinity;
  for (let k = 0; k < ys.length; k++) {
    const d = Math.abs(y - ys[k]);
    if (d < bestD) { best = k; bestD = d; }
  }
  return best;
}

export type StepAction =
  | { kind: 'pass' }                  // let Lenis / the browser scroll normally
  | { kind: 'swallow' }               // preventDefault, nothing else
  | { kind: 'glide'; stop: number }   // preventDefault, glide to the stop at STEP_FPS
  | { kind: 'catch'; stop: number };  // preventDefault, ease into an edge stop (entry)

export interface StepInput {
  y: number;                          // current scroll (Lenis animatedScroll or scrollY)
  target: number;                     // where the scroll heads if this input passes (Lenis targetScroll + delta; y + key distance)
  dir: 1 | -1;
  fresh: boolean;                     // first event of a new gesture
  acted: 'consume' | 'pass' | null;   // what was already done for this gesture, if anything
  foreign?: boolean;                  // y lies inside another controller's stop zone
  busy: boolean;                      // a glide is running or the landing hold (HOLD_MIN_MS) is active
}

const PASS: StepAction = { kind: 'pass' };
const SWALLOW: StepAction = { kind: 'swallow' };

/** The whole step policy for one input. ys = stop scroll offsets, ascending. */
export function decideStep(ys: ArrayLike<number>, tol: number, i: StepInput): StepAction {
  const n = ys.length;
  if (n === 0) return PASS;
  if (i.busy || i.acted === 'consume') return SWALLOW;
  const first = ys[0];
  const last = ys[n - 1];
  if (i.y < first - tol) return i.dir > 0 && !i.foreign && i.target >= first - tol ? { kind: 'catch', stop: 0 } : PASS;
  if (i.y > last + tol) return i.dir < 0 && !i.foreign && i.target <= last + tol ? { kind: 'catch', stop: n - 1 } : PASS;
  if (i.acted === 'pass') return PASS; // an exit gesture still within tol of the edge stop
  const k = stopAt(ys, i.y, tol);
  if (k >= 0) {
    const next = k + i.dir;
    if (next < 0 || next >= n) return i.fresh ? PASS : SWALLOW; // exits need a new gesture
    return i.fresh ? { kind: 'glide', stop: next } : SWALLOW;
  }
  // Between stops (after a scrollbar drag or an interrupted glide): continue to the next stop in the input direction.
  if (i.dir > 0) { for (let j = 0; j < n; j++) if (ys[j] > i.y) return { kind: 'glide', stop: j }; return { kind: 'glide', stop: n - 1 }; }
  for (let j = n - 1; j >= 0; j--) if (ys[j] < i.y) return { kind: 'glide', stop: j };
  return { kind: 'glide', stop: 0 };
}

/**
 * Continuous stop coordinate: k at stop k, linear in scroll between stops; before stop 0 it is (scroll - ys[0]) / approach
 * (>= -1), after the last stop it is n - 1 + (scroll - ys[n-1]) / exit (<= n).
 */
export function stopCoord(scroll: number, ys: ArrayLike<number>, approach: number, exit: number): number {
  const n = ys.length;
  if (n === 0 || Number.isNaN(scroll)) return 0;
  if (scroll <= ys[0]) return approach > 0 ? Math.max(-1, (scroll - ys[0]) / approach) : 0;
  if (scroll >= ys[n - 1]) return exit > 0 ? Math.min(n, n - 1 + (scroll - ys[n - 1]) / exit) : n - 1;
  let k = 0;
  while (k < n - 2 && scroll >= ys[k + 1]) k++;
  const span = ys[k + 1] - ys[k];
  return span > 0 ? k + (scroll - ys[k]) / span : k;
}
