'use client';

import { useEffect, useRef } from 'react';
import { onEveryFrame } from '@/lib/frame-loop';
import type { Tier } from '@/lib/device-tier';
import { CANDLES } from '@/lib/three/hero-candles';
import { useDocumentVisible, useInViewActive } from '@/components/three/useInViewActive';
import {
  formingCandle,
  liveClock,
  liveRing,
  ringRange,
  type Candle,
} from '@/lib/live-candles';

const N = 16;
const SLOT = 8; // px
const H = 26; // px
const RING = liveRing(CANDLES);
const R = ringRange(RING);

const y = (v: number): number => ((v - R.min) / (R.max - R.min)) * H;

function wickTf(c: Candle): string {
  const lo = y(c[3]);
  const hi = y(c[2]);
  return `translateY(${(-lo).toFixed(2)}px) scaleY(${((hi - lo) / H).toFixed(4)})`;
}
function bodyTf(c: Candle): string {
  const a = y(Math.min(c[0], c[1]));
  const b = y(Math.max(c[0], c[1]));
  return `translateY(${(-a).toFixed(2)}px) scaleY(${(Math.max(1.5, b - a) / H).toFixed(4)})`;
}
const upOf = (c: Candle): string => (c[1] >= c[0] ? '1' : '0');

/** Candle for entry i at (start, phase): the entry at N is the forming one. */
function entry(start: number, i: number, phase: number): Candle {
  const c = RING[(start + i) % RING.length];
  return i === N ? formingCandle(c, phase) : c;
}

export function HeroLiveTicker({ tier }: { tier: Tier }): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const inView = useInViewActive(root);
  const docVisible = useDocumentVisible();
  const active = inView && docVisible;

  useEffect(() => {
    if (!active || tier === 'static') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = strip.current;
    if (!el) return;
    const cells = Array.from(el.children) as HTMLElement[];
    const wicks = cells.map((c) => c.children[0] as HTMLElement);
    const bodies = cells.map((c) => c.children[1] as HTMLElement);
    const cache = new Map<string, string>();
    const put = (k: string, v: string, fn: (v: string) => void): void => {
      if (cache.get(k) === v) return;
      cache.set(k, v);
      fn(v);
    };
    let lastStart = -1;

    const writeCell = (i: number, c: Candle): void => {
      put(`w${i}`, wickTf(c), (v) => { wicks[i].style.transform = v; });
      put(`b${i}`, bodyTf(c), (v) => { bodies[i].style.transform = v; });
      put(`u${i}`, upOf(c), (v) => { cells[i].dataset.up = v; });
    };

    const tick = (t: number): void => {
      const { start, phase, f } = liveClock(t);
      put('x', `translate3d(${(-f * SLOT).toFixed(2)}px,0,0)`, (v) => { el.style.transform = v; });
      if (start !== lastStart) {
        lastStart = start;
        for (let i = 0; i <= N; i++) writeCell(i, entry(start, i, phase));
      } else {
        writeCell(N, entry(start, N, phase));
      }
      put('o0', (1 - f).toFixed(3), (v) => { cells[0].style.opacity = v; });
      put('oN', f.toFixed(3), (v) => { cells[N].style.opacity = v; });
    };

    return onEveryFrame((ts) => tick(ts / 1000), 'update');
  }, [active, tier]);

  return (
    <div ref={root} className="hero-live" aria-hidden="true">
      <span className="hero-live__dot pulse-dot" />
      <div className="hero-live__plot">
        <div ref={strip} className="hero-live__strip">
          {Array.from({ length: N + 1 }, (_, i) => {
            const c = entry(0, i, 0);
            return (
              <i
                key={i}
                className="hl-c"
                style={{ left: i * SLOT, opacity: i === N ? 0 : 1 }}
                data-up={upOf(c)}
              >
                <b className="hl-w" style={{ transform: wickTf(c) }} />
                <b className="hl-b" style={{ transform: bodyTf(c) }} />
              </i>
            );
          })}
        </div>
      </div>
    </div>
  );
}
