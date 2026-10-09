'use client';

import React, { useEffect, useRef } from 'react';
import type { ScrollCaption } from '@/lib/scroll-captions';

/** Imperative driver: call with the host sequence progress (0..1) from its onUpdate. */
export type CaptionDriver = { current: ((progress: number) => void) | null };

const INK = '#0B0B0B';

interface Props {
  captions: ScrollCaption[];
  driverRef: CaptionDriver;
}

/**
 * Caption track. No React state: the active caption index is resolved per update and the
 * element styles (opacity + transform only) are written only when the index changes.
 */
export function ScrollCaptions({ captions, driverRef }: Props): React.ReactElement {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeRef = useRef(-2);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // `ref` = index boundary: items before it have exited upward, items after it wait below.
    const apply = (active: number, ref: number): void => {
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const on = i === active;
        const dy = reducedRef.current || on ? 0 : i < ref ? -12 : 14;
        el.style.opacity = on ? '1' : '0';
        el.style.transform = `translate3d(0,${dy}px,0)`;
      });
    };
    apply(-1, 0);
    activeRef.current = -1;

    driverRef.current = (p: number): void => {
      let next = -1;
      for (let i = 0; i < captions.length; i++) {
        if (p >= captions[i].start && p < captions[i].end) { next = i; break; }
      }
      if (next === activeRef.current) return;
      activeRef.current = next;
      let ref = next;
      if (next === -1) {
        ref = 0;
        while (ref < captions.length && captions[ref].end <= p) ref++;
      }
      apply(next, ref);
    };
    return () => { driverRef.current = null; };
  }, [captions, driverRef]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 z-40 pointer-events-none px-5 sm:px-8 md:px-12 lg:px-16"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
    >
      <div className="relative mx-auto w-full max-w-7xl h-[5.5rem] md:h-24">
        {captions.map((c, i) => (
          <div
            key={`${c.label}-${c.text}-${i}`}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="absolute left-0 bottom-0 max-w-[88%] md:max-w-md rounded-sm px-4 py-3 md:px-5 md:py-3.5 scroll-caption"
            style={{
              opacity: 0,
              willChange: 'transform, opacity',
              background: 'rgba(250,246,237,0.82)',
              border: '1px solid rgba(212,175,55,0.55)',
              color: INK,
            }}
          >
            <div
              className="text-[10px] md:text-[11px] font-body uppercase tracking-[0.28em] font-semibold"
              style={{ color: INK, fontVariant: 'small-caps' }}
            >
              {c.label}
            </div>
            <div
              className="mt-1 font-medium leading-tight text-xl md:text-2xl"
              style={{ fontFamily: 'var(--font-display)', color: INK }}
            >
              {c.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScrollCaptions;
