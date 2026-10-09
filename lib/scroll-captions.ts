// Scroll caption copy. Every string is derived from lib/content.ts (no new claims or numbers).
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  CURRICULUM_CHAPTERS,
  FINAL_CTA_HEADLINE,
  MARKETS,
  MARQUEE_ITEMS,
  NAV_LINKS,
} from '@/lib/content';

export interface ScrollCaption {
  /** Small-caps label above the line. */
  label: string;
  /** Display serif line. */
  text: string;
  /** Active while start <= progress < end (progress of the host sequence, 0..1). */
  start: number;
  end: number;
}

const market = (id: string) => MARKETS.find((m) => m.id === id)!;
const chapter = (n: number) => CURRICULUM_CHAPTERS[n - 1];
const programme = NAV_LINKS[0].label;
const chapterLabel = (n: number) => `${programme} ${chapter(n).number}`;

/** Spread `lines` evenly over [from, to] with a small gap between each. */
function spread(lines: Array<[string, string]>, from: number, to: number): ScrollCaption[] {
  const step = (to - from) / lines.length;
  const gap = step * 0.14;
  return lines.map(([label, text], i) => ({
    label,
    text,
    start: from + i * step + gap / 2,
    end: from + (i + 1) * step - gap / 2,
  }));
}

const crypto = market('crypto');
const forex = market('forex');
const equities = market('equities');

// Crypto: progress 0..1 of the section.
export const CRYPTO_CAPTIONS: ScrollCaption[] = spread(
  [
    [crypto.heading, crypto.body.split(' exhibit')[0]], // "Crypto markets run 24/7"
    [crypto.heading, crypto.kicker],
    [crypto.heading, crypto.tags[0]],
    [crypto.heading, crypto.tags[1]],
    [chapterLabel(1), MARQUEE_ITEMS[4]],
    [crypto.heading, crypto.tags[2]],
  ],
  0.04,
  0.94,
);

// Forex sequence: progress is the frame-scroll fraction 0..1 (forex, stock, opportunity thirds).
// Everything ends by 0.91 so captions are gone before the HUD fade and the Intelligence hand-off.
const T = 1 / 3;
export const FOREX_CAPTIONS: ScrollCaption[] = [
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
];
