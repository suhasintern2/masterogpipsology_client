'use client';
import React from 'react';

// ─── Hero Section ─────────────────────────────────────────────────────────────
// Full-viewport hero. Background image from components/assets.
// The background stays consistent — scroll drives GRADIENT LIGHT PLAY,
// not page darkening. As the user scrolls:
//   • A warm atmospheric orb drifts upward-left (morning sun effect)
//   • A secondary cool rim light sweeps rightward
//   • A golden light shaft rotates subtly
//   • A soft warm-to-cool colour temperature shift happens in the gradient
//   • The bottom fade adjusts but stays within the beige palette
// None of this changes the actual page background — only the decorative
// gradient layers that live inside the hero animate.

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { HeroLightLayers } from '@/components/sections/hero/HeroLightLayers';
import { TypingHeading } from '@/components/ui/TypingHeading';
import {
  HERO_SUBLINE,
  CTA_PRIMARY,
  CTA_SECONDARY,
} from '@/lib/content';
import {
  fadeUpVariants,
  brassRuleVariants,
} from '@/lib/motion';

export function Hero(): React.ReactElement {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen w-full flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Background image ────────────────────────────────────────────────── */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/hero/hero-3200.jpg"
          alt=""
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: '65% center' }}
        />

        <HeroLightLayers contentRef={contentRef} />
      </div>

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
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              }}
            >
              <span
                className="pulse-dot w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--accent)' }}
                aria-hidden="true"
              />
              Education before execution
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            className="display font-medium leading-[1.05] tracking-tight"
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 5rem)',
              color: '#F3ECE0',
              textShadow: '0 2px 28px rgba(0,0,0,0.35)',
            }}
          >
            <TypingHeading text="Education before execution" />
          </h1>

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
              color: 'rgba(243,236,224,0.80)',
              textShadow: '0 1px 12px rgba(0,0,0,0.3)',
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
            <Button as="a" href="#cta" size="lg" variant="filled" id="hero-cta-primary">
              {CTA_PRIMARY}
            </Button>
            <Button as="a" href="#curriculum" size="lg" variant="outline" id="hero-cta-secondary">
              {CTA_SECONDARY}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
