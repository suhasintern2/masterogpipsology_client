'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { SCULPTURE_HEIGHTS } from '@/lib/three/sculpture-layout';

interface SculptureFallbackProps {
  /** Scroll-animate (low tier). Static tier shows the assembled sculpture. */
  animate: boolean;
  trigger: React.RefObject<HTMLElement | null>;
}

const U = 60; // px per world unit in the SVG
const SPACING = 0.7 * U;
const BODY_W = 0.42 * U;
const BASE = 330;

/** Inline-SVG gold candlesticks. Low tier scrubs in and out; static tier is assembled. */
export function SculptureFallback({ animate, trigger }: SculptureFallbackProps): React.ReactElement {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const section = trigger.current;
      if (!animate || !section) return;
      const gs = gsap.utils.toArray<SVGGElement>('.sc-candle', root.current);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
      });
      tl.fromTo(gs, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05 }, 0)
        .to(gs, { y: -40, opacity: 0, duration: 0.4 }, 0.6);
    },
    { scope: root, dependencies: [animate] },
  );

  const n = SCULPTURE_HEIGHTS.length;
  const width = (n - 1) * SPACING + BODY_W + 40;
  return (
    <svg
      ref={root}
      viewBox={`0 0 ${width} 400`}
      className="absolute left-1/2 top-1/2 h-[60vh] max-h-[520px] w-auto max-w-[92vw] -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sc-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8c6d23" />
          <stop offset="0.5" stopColor="#f5d77f" />
          <stop offset="1" stopColor="#b38728" />
        </linearGradient>
      </defs>
      {SCULPTURE_HEIGHTS.map((h, i) => {
        const bh = h * U;
        const x = 20 + BODY_W / 2 + i * SPACING;
        const wick = bh * 0.35;
        return (
          <g key={i} className="sc-candle" fill="url(#sc-gold)">
            <rect x={x - 1.5} y={BASE - bh - wick} width={3} height={bh + wick * 2} rx={1} />
            <rect x={x - BODY_W / 2} y={BASE - bh} width={BODY_W} height={bh} rx={2} />
          </g>
        );
      })}
    </svg>
  );
}
