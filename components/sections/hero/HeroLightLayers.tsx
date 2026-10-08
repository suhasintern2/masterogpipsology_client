'use client';
import React, { useRef } from 'react';

// Decorative hero light play. Plain divs, no filter blur: softness comes from the
// gradient stops. All motion is transform/opacity driven by ONE scrubbed GSAP timeline.

import { gsap, useGSAP } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll-store';

interface HeroLightLayersProps {
  /** Hero content wrapper that drifts up (0 to -12%) inside the same timeline. */
  contentRef: React.RefObject<HTMLElement | null>;
}

const S1 = 'clamp(400px, 65vw, 900px)';
const S2 = 'clamp(300px, 50vw, 700px)';
const S3 = 'clamp(250px, 40vw, 600px)';

type Kf = { t: number; v: number | (() => number) };

/** Adds sequential linear tweens for keyframes (t in 0..1) onto the timeline. */
function keyframes(tl: gsap.core.Timeline, el: Element, prop: string, kfs: Kf[]): void {
  for (let i = 1; i < kfs.length; i++) {
    tl.fromTo(
      el,
      { [prop]: kfs[i - 1].v },
      { [prop]: kfs[i].v, duration: kfs[i].t - kfs[i - 1].t, ease: 'none', immediateRender: i === 1 },
      kfs[i - 1].t,
    );
  }
}

export function HeroLightLayers({ contentRef }: HeroLightLayersProps): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);
  const orb3 = useRef<HTMLDivElement>(null);
  const shaft = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const hero = document.getElementById('hero');
      const o1 = orb1.current, o2 = orb2.current, o3 = orb3.current;
      const sh = shaft.current, sc = scrim.current, fd = fade.current;
      if (!hero || !o1 || !o2 || !o3 || !sh || !sc || !fd) return;

      // Parent-relative deltas, re-evaluated on every ScrollTrigger refresh.
      const W = (f: number) => () => f * hero.clientWidth;
      const H = (f: number) => () => f * hero.clientHeight;

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scrollStore.heroProgress = self.progress;
          },
        },
      });

      // Orb 1: sun drifts up-left and grows
      tl.fromTo(o1, { x: 0, y: 0, scale: 1 }, { x: W(-0.16), y: H(-0.26), scale: 1.35, duration: 1 }, 0);
      keyframes(tl, o1, 'opacity', [
        { t: 0, v: 0.55 }, { t: 0.3, v: 0.72 }, { t: 0.8, v: 0.4 }, { t: 1, v: 0.2 },
      ]);
      // Orb 2: lower-left fill rises up-right
      tl.fromTo(o2, { x: 0, y: 0 }, { x: W(0.22), y: H(-0.5), duration: 1 }, 0);
      keyframes(tl, o2, 'opacity', [{ t: 0, v: 0 }, { t: 0.4, v: 0.38 }, { t: 1, v: 0.18 }]);
      // Orb 3: cool rim sweeps in from the right
      keyframes(tl, o3, 'x', [{ t: 0, v: 0 }, { t: 0.3, v: W(-0.25) }, { t: 1, v: W(-0.5) }]);
      keyframes(tl, o3, 'opacity', [
        { t: 0, v: 0 }, { t: 0.25, v: 0.28 }, { t: 0.7, v: 0.42 }, { t: 1, v: 0.18 },
      ]);
      // Shaft: wrapper rotation 105 -> 84 degrees (relative -21)
      tl.fromTo(sh, { rotation: 0 }, { rotation: -21, duration: 1 }, 0);
      keyframes(tl, sh, 'opacity', [
        { t: 0, v: 0 }, { t: 0.15, v: 0.18 }, { t: 0.6, v: 0.28 }, { t: 1, v: 0.08 },
      ]);
      // Scrim + bottom fade
      keyframes(tl, sc, 'opacity', [{ t: 0, v: 1 }, { t: 0.5, v: 0.8 }, { t: 1, v: 0.45 }]);
      keyframes(tl, fd, 'opacity', [{ t: 0, v: 1 }, { t: 0.7, v: 0.6 }, { t: 1, v: 0.3 }]);
      // Hero content drift
      if (contentRef.current) tl.fromTo(contentRef.current, { yPercent: 0 }, { yPercent: -12, duration: 1 }, 0);

      return () => {
        scrollStore.heroProgress = 0;
      };
    },
    { scope: root, dependencies: [] },
  );

  const orb = (
    ref: React.RefObject<HTMLDivElement | null>,
    size: string,
    left: string,
    top: string,
    gradient: string,
    opacity: number,
    blend?: React.CSSProperties['mixBlendMode'],
  ) => (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: `calc(${top} - ${size} / 2)`,
        left: `calc(${left} - ${size} / 2)`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient,
        opacity,
        mixBlendMode: blend,
        willChange: 'transform, opacity',
        pointerEvents: 'none',
      }}
    />
  );

  return (
    <div ref={root} className="absolute inset-0" aria-hidden="true">
      {orb(
        orb1, S1, '68%', '8%',
        `radial-gradient(circle,
          rgba(255, 220, 140, 0.70) 0%,
          rgba(245, 190, 90, 0.45) 20%,
          rgba(235, 170, 70, 0.25) 40%,
          rgba(220, 150, 60, 0.10) 62%,
          transparent 85%)`,
        0.55, 'screen',
      )}
      {orb(
        orb2, S2, '10%', '70%',
        `radial-gradient(circle,
          rgba(240, 200, 120, 0.60) 0%,
          rgba(230, 175, 90, 0.30) 35%,
          rgba(215, 155, 65, 0.10) 62%,
          transparent 85%)`,
        0,
      )}
      {orb(
        orb3, S3, '110%', '30%',
        `radial-gradient(circle,
          rgba(200, 215, 240, 0.55) 0%,
          rgba(190, 205, 230, 0.28) 35%,
          rgba(175, 190, 215, 0.10) 62%,
          transparent 85%)`,
        0,
      )}

      {/* Golden light shaft: fixed gradient angle, wrapper rotates */}
      <div
        ref={shaft}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '35%',
          width: '180%',
          height: '180%',
          background: `linear-gradient(105deg,
            transparent 30%,
            rgba(255, 225, 130, 0.18) 45%,
            rgba(255, 225, 130, 0.28) 50%,
            rgba(255, 225, 130, 0.18) 55%,
            transparent 70%)`,
          opacity: 0,
          transformOrigin: '0% 0%',
          willChange: 'transform, opacity',
          pointerEvents: 'none',
        }}
      />

      {/* Left-side dark scrim: text legibility, lifts on scroll */}
      <div
        ref={scrim}
        className="absolute inset-0"
        style={{
          opacity: 1,
          background:
            'linear-gradient(108deg, rgba(14,14,18,0.68) 0%, rgba(14,14,18,0.44) 38%, rgba(14,14,18,0.10) 62%, transparent 80%)',
        }}
      />

      {/* Bottom fade: hero blends into beige */}
      <div
        ref={fade}
        className="absolute inset-x-0 bottom-0 h-48"
        style={{
          opacity: 1,
          background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 100%)',
        }}
      />
    </div>
  );
}
