'use client';
import React, { useRef } from 'react';

// ─── Fog fade between Crypto and Forex ────────────────────────────────────────
// Zero-height sibling at the section boundary. A 200vh band straddles it: warm
// fog layers (static gradients, no CSS filter) drift and thicken over the end of
// Crypto, fully veil it, then thin out as Forex appears. Scroll-scrubbed with
// GSAP (shared ticker); transform/opacity only. Reduced motion: opacity only.

import { gsap, useGSAP } from '@/lib/gsap';

export function FogTransition(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: q('.fog__band')[0], start: 'top bottom', end: 'bottom top', scrub: true },
      });
      // p=0.33: Crypto starts leaving; p=0.67: Forex fills the viewport.
      tl.fromTo(q('.fog__veil'), { opacity: 0 }, { opacity: 1, duration: 0.27 }, 0.05)
        .to(q('.fog__veil'), { opacity: 1, duration: 0.06 }, 0.32)
        .to(q('.fog__veil'), { opacity: 0, duration: 0.29 }, 0.38);
      if (reduced) {
        gsap.set(q('.fog__mist'), { display: 'none' });
        return;
      }
      tl.fromTo(q('.fog__mist--a'), { xPercent: -22, opacity: 0 }, { xPercent: 12, duration: 1 }, 0)
        .fromTo(q('.fog__mist--b'), { xPercent: 22, opacity: 0 }, { xPercent: -12, duration: 1 }, 0)
        .to(q('.fog__mist'), { opacity: 1, duration: 0.3 }, 0.05)
        .to(q('.fog__mist'), { opacity: 0, duration: 0.3 }, 0.4);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="fog" aria-hidden="true">
      <div className="fog__band">
        <div className="fog__veil" />
        <div className="fog__mist fog__mist--a" />
        <div className="fog__mist fog__mist--b" />
      </div>
    </div>
  );
}
