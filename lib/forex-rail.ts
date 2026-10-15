// Forex caption rail timing. Import-free: node --test loads it directly.
// Stop coordinate s from the Forex step controller: -1 at crypto 179 (one viewport above Y0), 0 = Y0 (forex 1, the Crypto slab 4
// landing), 1 = F1, 2 = F2, 3 = F3, 4 = S1 (stock 32). After S1 the rail follows the frame fraction f = progress / FRAME_SCROLL_PORTION.

export const FOREX_CHAIN_STOPS: readonly number[] = [0, 50, 88, 154, 217]; // = chainStopIndices([FOREX_STOPS_RAW, STOCK_STOPS_RAW], UNIQUE_LOCAL) (test-locked)
export const FOREX_CHAIN_LAST = 575;
export const FOREX_S1_F = 217 / 575; // frame fraction at S1
export const FOREX_RAIL_SPLIT = 0.4; // rail u at S1: share of the axis for the stepped part
export const FOREX_S_MIN = -1;
export const FOREX_S_MAX = 4;
export const FOREX_RAIL_HOLD_HALF = 0.1; // same as CRYPTO_RAIL_HOLD_HALF
export const FOREX_RAIL_FROM_S = -0.5; // rail enters in the 2nd half of the hand-off fade
export const STOCK_END_F = 2 / 3;
export const FOREX_FLOW_TO_F = 0.91; // gone before the HUD fade
const SHARE = 0.4; // = caption-flow FLOW_TRANSITION_SHARE (duplicated: import-free, test-locked)

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Same maths as caption-flow spreadWindows. */
export function spreadEven(count: number, from: number, to: number): { start: number; end: number }[] {
  if (count <= 0) return [];
  const step = (to - from) / count;
  const gap = step * SHARE;
  const out: { start: number; end: number }[] = [];
  for (let i = 0; i < count; i++) out.push({ start: from + i * step + gap / 2, end: from + (i + 1) * step - gap / 2 });
  return out;
}

export function forexRailStopU(s: number): number {
  const c = s < FOREX_S_MIN ? FOREX_S_MIN : s > FOREX_S_MAX ? FOREX_S_MAX : s;
  return (FOREX_RAIL_SPLIT * (c - FOREX_S_MIN)) / (FOREX_S_MAX - FOREX_S_MIN);
}

export function forexRailFrameU(f: number, fS1: number = FOREX_S1_F): number {
  return FOREX_RAIL_SPLIT + (1 - FOREX_RAIL_SPLIT) * clamp01((f - fS1) / (1 - fS1));
}

export function forexRailU(s: number, f: number): number {
  if (Number.isNaN(s)) return 0;
  return s <= FOREX_S_MAX ? forexRailStopU(s) : forexRailFrameU(f);
}

export function forexRailSpec(): { from: number; to: number; steps: { start: number; end: number }[] } {
  const U = forexRailStopU;
  const P = forexRailFrameU;
  const h = FOREX_RAIL_HOLD_HALF;
  const steps: { start: number; end: number }[] = [];
  for (let k = 0; k < 4; k++) steps.push({ start: U(k - h), end: U(k + h) });
  const a = spreadEven(6, FOREX_S1_F, STOCK_END_F);
  const b = spreadEven(5, STOCK_END_F, FOREX_FLOW_TO_F);
  steps.push({ start: U(FOREX_S_MAX - h), end: P(a[0].end) });
  for (let i = 1; i < a.length; i++) steps.push({ start: P(a[i].start), end: P(a[i].end) });
  for (const w of b) steps.push({ start: P(w.start), end: P(w.end) });
  return { from: U(FOREX_RAIL_FROM_S), to: P(FOREX_FLOW_TO_F), steps };
}
