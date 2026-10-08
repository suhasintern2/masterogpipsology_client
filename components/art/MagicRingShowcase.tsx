'use client';
import React, { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { gsap, useGSAP } from '@/lib/gsap';
import MagicRings from '@/components/MagicRings';

type Kf = [t: number, v: number];

/** Piecewise-linear keyframes (t in 0..1) as sequential tweens on a scrubbed timeline. */
function keyframes(tl: gsap.core.Timeline, el: Element, prop: string, kfs: Kf[]): void {
  for (let i = 1; i < kfs.length; i++) {
    tl.fromTo(
      el,
      { [prop]: kfs[i - 1][1] },
      { [prop]: kfs[i][1], duration: kfs[i][0] - kfs[i - 1][0], ease: 'none', immediateRender: i === 1 },
      kfs[i - 1][0],
    );
  }
}

export function MagicRingShowcase(): React.ReactElement {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const medallionRef = useRef<HTMLDivElement>(null);

  // One scrubbed timeline replaces the four framer useScroll/useSpring chains.
  // start end -> end start matches the old offsets (centre-centre is progress 0.5).
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const card = cardRef.current, aura = auraRef.current, med = medallionRef.current;
      if (!card || !aura || !med) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: containerRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      keyframes(tl, card, 'scale', [[0, 0.86], [0.5, 1], [0.85, 1], [1, 0.92]]);
      keyframes(tl, card, 'opacity', [[0, 0.25], [0.3, 1], [0.8, 1], [1, 0.35]]);
      keyframes(tl, card, 'rotationX', [[0, 15], [0.5, 0], [1, -8]]);
      keyframes(tl, card, 'y', [[0, 50], [0.5, 0], [1, -35]]);
      keyframes(tl, aura, 'scale', [[0, 0.75], [0.5, 1.3], [1, 0.85]]);
      keyframes(tl, aura, 'opacity', [[0, 0.15], [0.5, 0.65], [1, 0.2]]);
      keyframes(tl, med, 'y', [[0, 25], [0.5, 0], [1, -20]]);
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      aria-label="Master of Pipsology Portal of Precision"
      className="relative w-full py-16 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col items-center justify-center overflow-hidden"
      style={{ perspective: 1200 }}
    >
      {/* ─── SCROLL-ANIMATED MAIN APERTURE CONTAINER ─── */}
      <div
        ref={cardRef}
        style={{
          transformStyle: 'preserve-3d',
          willChange: 'transform, opacity',
        }}
        className="relative w-full max-w-6xl h-[440px] sm:h-[500px] md:h-[580px] lg:h-[620px] rounded-[2rem] overflow-hidden border border-[#D4AF37]/35 bg-gradient-to-b from-[#0D0E12] via-[#08080A] to-[#040406] shadow-[0_24px_80px_rgba(0,0,0,0.92),0_0_80px_rgba(212,175,55,0.12)] flex items-center justify-center group"
      >
        {/* Subtle Ambient Vignette & Horizon Grid Line */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(4,4,6,0.85)_100%)]"
        />

        {/* Top & Bottom Specular Highlights */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/80 to-transparent z-20 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent z-20 pointer-events-none"
        />

        {/* Top Status Badge */}
        <div className="absolute top-6 inset-x-0 z-20 flex justify-center items-center pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-[#D4AF37]/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="font-mono text-[10px] md:text-[11px] tracking-[0.25em] text-[#D4AF37] uppercase font-semibold">
              RING OF PRECISION · LIVE WEBGL
            </span>
          </div>
        </div>

        {/* ─── WEBGL MAGIC RINGS BACKGROUND ─── */}
        <div className="absolute inset-0 z-0">
          <MagicRings
            color="#D4AF37"
            colorTwo="#FAF1DE"
            ringCount={7}
            speed={0.8}
            lineThickness={2.3}
            baseRadius={0.3}
            radiusStep={0.088}
            scaleRate={0.08}
            attenuation={10.5}
            ringGap={1.42}
            followMouse={true}
            mouseInfluence={0.25}
            hoverScale={1.14}
            clickBurst={true}
          />
        </div>

        {/* ─── EXPANDING GOLDEN AURA (Scroll Reactive) ─── */}
        <div
          ref={auraRef}
          aria-hidden="true"
          style={{
            opacity: 0.65,
            transform: 'scale(1.3)',
            willChange: 'transform, opacity',
          }}
          className="absolute w-72 h-72 sm:w-96 sm:h-96 md:w-[480px] md:h-[480px] rounded-full pointer-events-none -z-5"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(212,175,55,0.45) 0%, rgba(212,175,55,0.22) 30%, rgba(212,175,55,0.08) 55%, rgba(212,175,55,0.02) 75%, transparent 92%)',
            }}
          />
        </div>

        {/* ─── FLOATING CENTER LOGO MEDALLION ─── */}
        <div
          ref={medallionRef}
          style={{
            transformStyle: 'preserve-3d',
          }}
          className="relative z-20 flex flex-col items-center justify-center pointer-events-none select-none px-4"
        >
          {/* Continuous Micro-Levitation */}
          <motion.div
            animate={{
              y: [-6, 6, -6],
              rotateZ: [-0.5, 0.5, -0.5],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="flex flex-col items-center"
          >
            {/* Medallion Disc */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full p-2 bg-black/85 border-2 border-[#D4AF37]/80 shadow-[0_0_60px_rgba(212,175,55,0.5),inset_0_0_30px_rgba(212,175,55,0.35)] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
              {/* Inner Decorative Accent Ring */}
              <div className="absolute inset-1.5 rounded-full border border-[#D4AF37]/30 pointer-events-none" />

              {/* Official Logo */}
              <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                <Image
                  src="/main_logo.png"
                  alt="Master of Pipsology Official Insignia"
                  fill
                  className="object-contain p-2.5 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                  priority
                />
              </div>
            </div>

            {/* Typography with Metallic Sheen */}
            <div className="mt-6 text-center">
              <span className="font-display font-bold text-base sm:text-lg md:text-xl tracking-[0.24em] text-[#FAF6F0] uppercase block drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                MASTER OF PIPSOLOGY
              </span>
              <span className="text-xs sm:text-sm font-mono tracking-[0.28em] text-[#D4AF37] uppercase mt-2 block font-medium">
                EDUCATION BEFORE EXECUTION
              </span>
              <div className="mt-3 flex items-center justify-center gap-3 opacity-75">
                <span className="h-[1px] w-8 bg-[#D4AF37]/50" />
                <span className="text-[10px] sm:text-[11px] font-body tracking-[0.18em] text-[#E0D8D0] uppercase">
                  Institutional Market Craft
                </span>
                <span className="h-[1px] w-8 bg-[#D4AF37]/50" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
