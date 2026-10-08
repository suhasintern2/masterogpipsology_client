'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';

/** Low-tier stand-in for the 3D light sweep: a diagonal gold band crossing the hero (transform only). */
export function HeroSweep(): React.ReactElement {
  const band = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = band.current;
      if (!el) return;
      let tl: gsap.core.Timeline | null = null;
      const off = onIntroDone(() => {
        tl = gsap.timeline({ repeat: -1, repeatDelay: 9 - 2.4 });
        tl.fromTo(el, { xPercent: -120 }, { xPercent: 120, duration: 2.4, ease: 'power1.inOut' });
      });
      return () => {
        off();
        tl?.kill();
      };
    },
    { scope: band },
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        ref={band}
        className="absolute inset-0"
        style={{
          opacity: 0.25,
          transform: 'translateX(-120%)',
          background:
            'linear-gradient(105deg, transparent 42%, rgba(255,214,140,.55) 50%, transparent 58%)',
        }}
      />
    </div>
  );
}
