// Scroll caption copy. Every string is derived from lib/content.ts (no new claims or numbers); the Crypto rail copy is CRYPTO_RAIL_LINES.
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  CRYPTO_RAIL_LINES,
  CURRICULUM_CHAPTERS,
  FINAL_CTA_HEADLINE,
  MARKETS,
  NAV_LINKS,
} from '@/lib/content';
import { spreadWindows, type FlowWindow } from '@/lib/caption-flow';
import { cryptoRailSpec } from '@/lib/crypto-slabs';

/** Fully shown while start <= progress <= end; the connector to the next step draws between end and the next start. */
export interface ScrollCaption extends FlowWindow {
  /** Small-caps label above the line. */
  label: string;
  /** Display serif line. */
  text: string;
}

export interface CaptionFlow {
  from: number;
  to: number;
  steps: ScrollCaption[];
}

const market = (id: string) => MARKETS.find((m) => m.id === id)!;
const chapter = (n: number) => CURRICULUM_CHAPTERS[n - 1];
const programme = NAV_LINKS[0].label;
const chapterLabel = (n: number) => `${programme} ${chapter(n).number}`;

/** Spread `lines` evenly over [from, to] with a small gap between each. */
function spread(lines: Array<[string, string]>, from: number, to: number): ScrollCaption[] {
  return spreadWindows(lines.length, from, to).map((w, i) => ({
    label: lines[i][0],
    text: lines[i][1],
    start: w.start,
    end: w.end,
  }));
}

const forex = market('forex');
const equities = market('equities');

// Crypto: driven by the stop coordinate (CryptoMarketScroll passes railU(s)): one hold per stop, transitions only between stops.
const cryptoRail = cryptoRailSpec();
export const CRYPTO_FLOW: CaptionFlow = {
  from: cryptoRail.from,
  to: cryptoRail.to,
  steps: CRYPTO_RAIL_LINES.map(([label, text], i) => ({ label, text, start: cryptoRail.steps[i].start, end: cryptoRail.steps[i].end })),
};

// Forex sequence: progress is the frame-scroll fraction 0..1 (forex, stock, opportunity thirds).
// Everything ends by 0.91 so captions are gone before the HUD fade and the Intelligence hand-off.
const T = 1 / 3;
export const FOREX_FLOW: CaptionFlow = {
  from: 0.01,
  to: 0.91,
  steps: [
  ...spread(
    [
      [forex.heading, forex.kicker],
      [forex.heading, forex.tags[0]],
      [forex.heading, forex.tags[1]],
      [forex.heading, forex.tags[2]],
      [chapterLabel(2), chapter(2).title],
    ],
    0.01,
    T,
  ),
  ...spread(
    [
      [equities.heading, equities.kicker],
      [equities.heading, equities.tags[0]],
      [equities.heading, equities.tags[1]],
      [equities.heading, equities.tags[2]],
      [chapterLabel(3), chapter(3).title],
    ],
    T,
    2 * T,
  ),
  ...spread(
    [
      [chapterLabel(4), chapter(4).title],
      [chapterLabel(5), chapter(5).title],
      [chapterLabel(6), chapter(6).title],
      [BRAND_NAME, BRAND_TAGLINE],
      [BRAND_NAME, FINAL_CTA_HEADLINE],
    ],
    2 * T,
    0.91,
  ),
  ],
};
