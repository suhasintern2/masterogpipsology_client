'use client';

import type { RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll-store';
import { HERO_PANEL_U, heroZoom, screenXOfImageU } from '@/lib/hero-zoom';

/** Scroll zoom for the hero photo (DOM) plus content drift. Writes scrollStore.heroProgress for the 3D layer. */
export function useHeroScroll(
  heroRef: RefObject<HTMLElement | null>,
  zoomRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
): void {
  useGSAP(
    () => {
      if (!enabled) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const hero = heroRef.current;
      const zoom = zoomRef.current;
      const content = contentRef.current;
      if (!hero || !zoom || !content) return;

      const setScale = gsap.quickSetter(zoom, 'scale') as (v: number) => void;
      const setX = gsap.quickSetter(zoom, 'x', 'px') as (v: number) => void;
      let fx = screenXOfImageU(HERO_PANEL_U, hero.clientWidth, hero.clientHeight);

      const apply = (p: number): void => {
        scrollStore.heroProgress = p;
        const z = heroZoom(p, fx);
        setScale(z.scale);
        setX(-z.scale * z.panFrac * hero.clientWidth);
      };

      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (s) => apply(s.progress),
        onRefresh: (s) => {
          fx = screenXOfImageU(HERO_PANEL_U, hero.clientWidth, hero.clientHeight);
          apply(s.progress);
        },
      });

      gsap.fromTo(
        content,
        { yPercent: 0 },
        {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
        },
      );

      return () => {
        scrollStore.heroProgress = 0;
      };
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );
}
