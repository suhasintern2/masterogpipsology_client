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
import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { StatRow } from '@/components/ui/StatRow';
import { TypingHeading } from '@/components/ui/TypingHeading';
import {
  COHORT_BADGE,
  HERO_SUBLINE,
  HERO_STATS,
  CTA_PRIMARY,
  CTA_SECONDARY,
} from '@/lib/content';
import {
  fadeUpVariants,
  brassRuleVariants,
  SPRING_RESPONSIVE,
} from '@/lib/motion';

export function Hero(): React.ReactElement {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  // Scroll inside the hero section only
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 40, damping: 28, mass: 1 });

  // ── Gradient light play transforms ────────────────────────────────────────
  // Orb 1: primary warm morning sun — drifts up and slightly left as you scroll
  const orb1Y   = useTransform(smooth, [0, 1], ['8%',  '-18%']);
  const orb1X   = useTransform(smooth, [0, 1], ['68%',  '52%']);
  const orb1Opacity = useTransform(smooth, [0, 0.3, 0.8, 1], [0.55, 0.72, 0.4, 0.2]);
  const orb1Scale = useTransform(smooth, [0, 1], [1, 1.35]);

  // Orb 2: secondary warm fill — comes from lower left, drifts up-right
  const orb2Y   = useTransform(smooth, [0, 1], ['70%', '20%']);
  const orb2X   = useTransform(smooth, [0, 1], ['10%', '32%']);
  const orb2Opacity = useTransform(smooth, [0, 0.4, 1], [0.0, 0.38, 0.18]);

  // Orb 3: cool ambient rim — appears at mid-scroll, sweeps from right
  const orb3X   = useTransform(smooth, [0, 0.3, 1], ['110%', '85%', '60%']);
  const orb3Opacity = useTransform(smooth, [0, 0.25, 0.7, 1], [0, 0.28, 0.42, 0.18]);

  // Light shaft: golden ray that rotates from 105° → 88° (subtle angular shift)
  const shaftRotate = useTransform(smooth, [0, 1], [105, 84]);
  const shaftOpacity = useTransform(smooth, [0, 0.15, 0.6, 1], [0, 0.18, 0.28, 0.08]);

  // Scrim: the left-side dark text legibility scrim lifts slightly on scroll
  // (text fades away as hero exits — less contrast needed)
  const scrimOpacity = useTransform(smooth, [0, 0.5, 1], [1, 0.8, 0.45]);

  // Bottom fade — shifts from beige-blend to transparent as user scrolls down
  const bottomFadeOpacity = useTransform(smooth, [0, 0.7, 1], [1, 0.6, 0.3]);

  // Overall hero parallax — content drifts upward at 0.4× scroll speed
  const heroContentY = useTransform(smooth, [0, 1], ['0%', '-12%']);

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
          src="/background_image.png"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: '65% center' }}
        />

        {/* ── Gradient Light Layer 1: Warm morning sun orb ─────────────────
            Primary atmospheric light source. Drifts upward-left on scroll
            simulating the sun rising / camera tilting up. */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: orb1Y,
            left: orb1X,
            width: 'clamp(400px, 65vw, 900px)',
            height: 'clamp(400px, 65vw, 900px)',
            borderRadius: '50%',
            background: `
              radial-gradient(
                circle,
                rgba(255, 220, 140, 0.70) 0%,
                rgba(245, 190, 90, 0.45) 20%,
                rgba(235, 170, 70, 0.25) 40%,
                rgba(220, 150, 60, 0.10) 60%,
                transparent 78%
              )
            `,
            filter: 'blur(55px)',
            opacity: orb1Opacity,
            scale: orb1Scale,
            translateX: '-50%',
            translateY: '-50%',
            mixBlendMode: 'screen',
          }}
        />

        {/* ── Gradient Light Layer 2: Warm ground fill ──────────────────────
            Secondary warm light that rises from lower-left on scroll.
            Simulates warm reflected light from the ground. */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: orb2Y,
            left: orb2X,
            width: 'clamp(300px, 50vw, 700px)',
            height: 'clamp(300px, 50vw, 700px)',
            borderRadius: '50%',
            background: `
              radial-gradient(
                circle,
                rgba(240, 200, 120, 0.60) 0%,
                rgba(230, 175, 90, 0.30) 35%,
                rgba(215, 155, 65, 0.10) 60%,
                transparent 80%
              )
            `,
            filter: 'blur(70px)',
            opacity: orb2Opacity,
            translateX: '-50%',
            translateY: '-50%',
            mixBlendMode: 'overlay',
          }}
        />

        {/* ── Gradient Light Layer 3: Cool atmospheric rim ──────────────────
            A cooler, silver-blue rim light that enters from the right
            on scroll — adds colour temperature contrast and depth. */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '30%',
            left: orb3X,
            width: 'clamp(250px, 40vw, 600px)',
            height: 'clamp(250px, 40vw, 600px)',
            borderRadius: '50%',
            background: `
              radial-gradient(
                circle,
                rgba(200, 215, 240, 0.55) 0%,
                rgba(190, 205, 230, 0.28) 35%,
                rgba(175, 190, 215, 0.10) 60%,
                transparent 80%
              )
            `,
            filter: 'blur(60px)',
            opacity: orb3Opacity,
            translateX: '-50%',
            translateY: '-50%',
            mixBlendMode: 'screen',
          }}
        />

        {/* ── Gradient Light Layer 4: Rotating golden light shaft ───────────
            A diagonal crepuscular ray that subtly rotates as you scroll.
            Creates the impression of morning light shifting over a building. */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-10%',
            left: '35%',
            width: '180%',
            height: '180%',
            background: `
              linear-gradient(
                ${shaftRotate}deg,
                transparent 30%,
                rgba(255, 225, 130, 0.18) 45%,
                rgba(255, 225, 130, 0.28) 50%,
                rgba(255, 225, 130, 0.18) 55%,
                transparent 70%
              )
            `,
            opacity: shaftOpacity,
            transformOrigin: '0% 0%',
            pointerEvents: 'none',
          }}
        />

        {/* ── Left-side dark scrim — text legibility, lifts on scroll ───────
            Provides contrast for the headline text. Reduces as hero exits
            since text fades away and contrast is no longer needed. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            opacity: scrimOpacity,
            background:
              'linear-gradient(108deg, rgba(14,14,18,0.68) 0%, rgba(14,14,18,0.44) 38%, rgba(14,14,18,0.10) 62%, transparent 80%)',
          }}
        />

        {/* ── Bottom fade — hero blends into beige ──────────────────────── */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-48"
          style={{
            opacity: bottomFadeOpacity,
            background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 100%)',
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 pt-28 sm:pt-32 pb-24 sm:pb-28"
        style={{ y: heroContentY }}
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
              {COHORT_BADGE}
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

          {/* Stats */}
          <motion.div
            custom={6}
            variants={fadeUpVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="pt-1"
            transition={{ ...SPRING_RESPONSIVE, delay: 0.1 }}
          >
            <StatRow stats={HERO_STATS} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
