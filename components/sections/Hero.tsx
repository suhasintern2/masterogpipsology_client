'use client';
import React from 'react';

// ─── Hero Section ─────────────────────────────────────────────────────────────
// Full-viewport hero. The photo is a plain DOM image (never tinted or covered);
// scroll drives a zoom of the photo (shared math in lib/hero-zoom.ts), and on the
// high tier a transparent WebGL layer registered to the same projection.

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { HeroLiveTicker } from '@/components/sections/hero/HeroLiveTicker';
import { useHeroScroll } from '@/components/sections/hero/useHeroScroll';
import { RevealText } from '@/components/motion/RevealText';
import { GoldShimmer } from '@/components/motion/GoldShimmer';
import dynamic from 'next/dynamic';
import { useDeviceTier } from '@/lib/device-tier';
import { loadProgress } from '@/lib/load-progress';
import {
  HERO_SUBLINE,
  CTA_PRIMARY,
  CTA_SECONDARY,
} from '@/lib/content';
import {
  fadeUpVariants,
  brassRuleVariants,
} from '@/lib/motion';

if (typeof window !== 'undefined') loadProgress.register('hero-image', 0.45);

// 3D stage is a separate lazy chunk, requested only on the high tier. If it fails to
// load, release the preloader task and render nothing (the DOM image stays).
const HeroStage = dynamic(
  () =>
    import('@/components/three/hero/HeroStage').catch(() => {
      loadProgress.complete('hero-3d');
      return { default: () => null };
    }),
  { ssr: false },
);

export function Hero(): React.ReactElement {
  const ref = useRef<HTMLElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const markHeroImage = useCallback((): void => {
    const img = bgImgRef.current;
    if (!img) return;
    loadProgress.update('hero-image', 0.8);
    const done = (): void => loadProgress.complete('hero-image');
    if (typeof img.decode === 'function') img.decode().then(done, done);
    else done();
  }, []);
  useEffect(() => {
    // Image may have finished loading before hydration attached onLoad.
    if (bgImgRef.current?.complete) markHeroImage();
  }, [markHeroImage]);
  const inView = useInView(ref, { once: true, amount: 0.08 });
  const tier = useDeviceTier();
  const zoomRef = useRef<HTMLDivElement>(null);

  // Register before the dynamic 3D import resolves so the preloader waits for it.
  useEffect(() => {
    if (tier === 'high') loadProgress.register('hero-3d', 0.25);
  }, [tier]);

  const contentRef = useRef<HTMLDivElement>(null);
  useHeroScroll(ref, zoomRef, contentRef, tier !== 'static');

  return (
    <section
      id="hero"
      ref={ref}
      className="hero-ink relative min-h-screen w-full flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Background image (never covered or tinted) ──────────────────────── */}
      <div
        ref={zoomRef}
        className="absolute inset-0"
        style={{ transformOrigin: '50% 50%', willChange: 'transform' }}
        aria-hidden="true"
      >
        <Image
          src="/hero/hero-3200.jpg"
          ref={bgImgRef}
          onLoad={markHeroImage}
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          quality={90}
          style={{ objectFit: 'cover', objectPosition: '65% center' }}
        />
      </div>
      {tier === 'high' && <HeroStage />}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 pt-28 sm:pt-32 pb-24 sm:pb-28"
      >
        {/* Text column */}
        <div className="max-w-xl lg:max-w-2xl flex flex-col gap-5 sm:gap-6">

          {/* Cohort badge */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="inline-flex self-start"
          >
            <span
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-body font-medium"
              style={{
                borderColor: 'rgba(140,109,35,0.55)',
                color: '#6B5320',
                backgroundColor: 'rgba(250,246,237,0.55)',
              }}
            >
              <span
                className="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#8C6D23' }}
                aria-hidden="true"
              />
              Education before execution
            </span>
          </motion.div>

          {/* Headline */}
          <RevealText
            as="h1"
            mode="chars"
            trigger="intro"
            className="display"
            style={{
              fontSize: 'var(--fs-hero)',
              color: '#14161B',
              textShadow: '0 1px 24px rgba(255,248,236,0.55)',
            }}
          >
            Education before <GoldShimmer>execution</GoldShimmer>
          </RevealText>

          {/* Brass rule */}
          <motion.div
            className="brass-rule w-20 sm:w-28"
            aria-hidden="true"
            variants={brassRuleVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          />

          {/* Subline */}
          <motion.p
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="text-base sm:text-lg leading-relaxed font-body max-w-prose"
            style={{
              color: 'rgba(20,22,27,0.78)',
              textShadow: '0 1px 14px rgba(255,248,236,0.6)',
            }}
          >
            {HERO_SUBLINE}
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={5}
            variants={fadeUpVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="flex flex-wrap items-center gap-3 pt-1"
          >
            <Button as="a" href="#cta" size="lg" variant="liquid" className="btn-liquid--on-light" id="hero-cta-primary">
              {CTA_PRIMARY}
            </Button>
            <Button as="a" href="#curriculum" size="lg" variant="ghost" className="border border-[rgba(20,22,27,0.35)]" id="hero-cta-secondary">
              {CTA_SECONDARY}
            </Button>
          </motion.div>

          <motion.div
            custom={6}
            variants={fadeUpVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="pt-2"
          >
            <HeroLiveTicker tier={tier} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
