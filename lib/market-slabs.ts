// Slab windows for the Forex and Stock texts (components/sections/MarketSlabs.tsx). Import-free.
// Coordinate x: the Forex stop coordinate s up to S1 (stock 32), then 4..5 over the stock frames.

export const MARKET_SLAB_WINDOWS = {
  forex: { inFrom: -0.6, inTo: -0.05, outFrom: 3.15, outTo: 3.5 }, // in during the hand-off fade (Crypto slab 3 is out by -0.72), held at stops 0-3, out in S1 before the cut (s 3.595)
  stock: { inFrom: 3.62, inTo: 3.95, outFrom: 4.85, outTo: 5.0 }, // in after the cut, held at S1 (s 4) and on native scroll, out before the stock->opportunity cut
} as const;

export const STOCK_S1_POS = 217; // chain index of stock_market 32 (stop S1)
export const STOCK_END_POS = 383; // chain index of the last stock frame

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Slab coordinate: the Forex stop coordinate up to S1, then 4..5 linear in chain pos 217..383. NaN s -> -1. */
export function marketSlabX(s: number, pos: number): number {
  if (Number.isNaN(s)) return -1;
  if (s <= 4) return s;
  return 4 + clamp01((pos - STOCK_S1_POS) / (STOCK_END_POS - STOCK_S1_POS));
}
