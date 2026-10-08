'use client';
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

// ─── MomentsReel: "Atelier film strip" ────────────────────────────────────────
// Real GALLERY_MOMENTS photos on a pinned horizontal strip (high tier, desktop).
// Low tier: native scroll-snap carousel. Static tier (reduced motion): vertical stack.

import { GALLERY_MOMENTS } from '@/lib/content';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useDeviceTier } from '@/lib/device-tier';
import { CurtainImage } from '@/components/fx/CurtainImage';

export function MomentsReel(): React.ReactElement {
  const tier = useDeviceTier();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (tier !== 'high' || !section || !track) return;

      const dist = (): number => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + dist(),
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      section.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
        const par = panel.querySelector('[data-par]');
        const caps = panel.querySelectorAll('[data-cap]');
        const rule = panel.querySelector('[data-rule]');
        if (par) {
          gsap.fromTo(
            par,
            { xPercent: -12 },
            {
              xPercent: 12,
              ease: 'none',
              scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
            },
          );
        }
        const st = { trigger: panel, containerAnimation: tween, start: 'left 75%', once: true };
        if (caps.length) {
          gsap.from(caps, { y: 28, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, scrollTrigger: st });
        }
        if (rule) {
          gsap.from(rule, { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'expo.out', scrollTrigger: st });
        }
      });
    },
    { scope: sectionRef, dependencies: [tier], revertOnUpdate: true },
  );

  // The tier upgrade after hydration changes this section's layout; re-measure everything.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [tier]);

  const high = tier === 'high';
  const low = tier === 'low';

  const sectionCls = high
    ? 'relative h-[100dvh] overflow-hidden flex flex-col justify-center gap-6 pt-20'
    : 'relative py-20 md:py-28';
  const trackCls = high
    ? 'flex w-max gap-8 px-[8vw] will-change-transform'
    : low
      ? 'flex gap-5 px-4 overflow-x-auto snap-x snap-mandatory pb-4'
      : 'flex flex-col gap-8 px-4 md:px-8 max-w-3xl mx-auto';
  const panelCls = high
    ? 'w-[62vw] h-[70vh] shrink-0'
    : low
      ? 'w-[85vw] aspect-[4/5] shrink-0 snap-center'
      : 'w-full aspect-[4/3]';

  return (
    <section
      id="moments"
      ref={sectionRef}
      aria-labelledby="moments-eyebrow"
      className={sectionCls}
    >
      <div className="px-4 md:px-8 lg:px-16 max-w-7xl w-full mx-auto flex items-center gap-3">
        <span id="moments-eyebrow" className="label-caps" style={{ color: '#D4AF37' }}>
          Trading Floor &amp; Moments
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(212,175,55,0.25)' }} aria-hidden="true" />
      </div>

      <div
        ref={trackRef}
        className={trackCls}
        {...(low ? { tabIndex: 0, role: 'region', 'aria-label': 'Trading Floor & Moments' } : {})}
      >
        {GALLERY_MOMENTS.map((moment) => (
          <figure key={moment.id} data-panel className={`moment-frame relative overflow-hidden rounded-xl ${panelCls}`}>
            <CurtainImage className="absolute inset-0">
              <div className="relative h-full w-full">
                <div
                  data-par
                  className={high ? 'absolute inset-y-0 -inset-x-[16%]' : 'absolute inset-0'}
                >
                  <Image
                    src={moment.image}
                    alt={moment.title}
                    fill
                    loading="lazy"
                    sizes={high ? '80vw' : '(max-width: 768px) 85vw, 768px'}
                    className="object-cover"
                  />
                </div>
              </div>
            </CurtainImage>
            <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-t from-[#08080A] via-[#08080A]/35 to-transparent" />

            <figcaption className="absolute z-[4] left-6 right-6 bottom-10 md:left-10 md:bottom-14 max-w-xl">
              <div data-cap className="label-caps mb-2" style={{ color: '#D4AF37' }}>
                {moment.tag}
              </div>
              <h3
                data-cap
                className="display font-medium tracking-tight"
                style={{ fontSize: 'var(--fs-h3)', color: '#FAF6F0', lineHeight: 1.05 }}
              >
                {moment.title}
              </h3>
              <p data-cap className="mt-2 text-sm font-body leading-relaxed" style={{ color: '#C9C1B4' }}>
                {moment.subtitle}
              </p>
              <div
                data-rule
                aria-hidden="true"
                className="mt-4 h-px w-full"
                style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }}
              />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
