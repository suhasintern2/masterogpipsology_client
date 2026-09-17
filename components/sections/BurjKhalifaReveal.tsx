'use client';
import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export function BurjKhalifaReveal(): React.ReactElement {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 40, damping: 28, mass: 0.8 });
  const towerScale = useTransform(smooth, [0, 0.7], [1.0, 1.03]);

  return (
    <section
      ref={sectionRef}
      aria-label="Burj Khalifa Dubai — Global Liquidity Hub"
      className="relative w-full overflow-hidden flex flex-col justify-end"
      style={{
        backgroundColor: 'var(--bg)',
        // Generous top padding ensures the spire tip has plenty of breathing room and is NEVER cut off
        paddingTop: 'clamp(80px, 12vh, 160px)',
        // Subpixel negative margin ensures ZERO gap with the black frame below
        marginBottom: '-3px',
      }}
    >
      {/* ─── 1. ARCHITECTURAL TRADING CHARTS BACKGROUND (Desktop & Mobile Responsive) ─── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
      >
        {/* Warm atmospheric morning sky glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 60% at 50% 30%, rgba(246, 239, 225, 0.85) 0%, transparent 80%),
              radial-gradient(circle 700px at 80% 35%, rgba(240, 205, 120, 0.22) 0%, transparent 65%),
              radial-gradient(circle 600px at 20% 45%, rgba(220, 185, 100, 0.15) 0%, transparent 60%)
            `,
          }}
        />

        {/* Institutional Market Structure & Candlestick Charts SVG */}
        <svg
          viewBox="0 0 1600 800"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full opacity-35 sm:opacity-55 md:opacity-70 transition-opacity duration-500"
        >
          <defs>
            {/* Chart Area Fill Gradient */}
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>

            {/* Main Trend Line Stroke Gradient */}
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#967C3B" stopOpacity="0.2" />
              <stop offset="25%" stopColor="#D4AF37" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#E5C568" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#D4AF37" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#967C3B" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Horizontal Fibonacci / Equilibrium Guides */}
          {[160, 260, 360, 460, 560].map((y, idx) => (
            <g key={y}>
              <line
                x1="0"
                y1={y}
                x2="1600"
                y2={y}
                stroke="rgba(165, 135, 75, 0.14)"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
              <text
                x="32"
                y={y - 6}
                fill="rgba(150, 120, 60, 0.38)"
                fontSize="11"
                fontFamily="monospace"
                letterSpacing="1"
              >
                {idx === 0 && '0.786 INSTITUTIONAL EXPANSION'}
                {idx === 1 && '0.618 GOLDEN FIBONACCI POCKET'}
                {idx === 2 && '0.500 SESSION EQUILIBRIUM'}
                {idx === 3 && '0.382 LIQUIDITY ACCUMULATION'}
                {idx === 4 && '0.236 BASE DISCOVERY ZONE'}
              </text>
            </g>
          ))}

          {/* Vertical Timeframe Separators */}
          {[240, 520, 1080, 1360].map((x) => (
            <line
              key={x}
              x1={x}
              y1="80"
              x2={x}
              y2="660"
              stroke="rgba(165, 135, 75, 0.08)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
          ))}

          {/* Upward Price Trajectory Area Fill */}
          <path
            d="M 0,540 C 220,520 380,440 560,460 S 840,340 1020,310 S 1320,180 1600,140 L 1600,680 L 0,680 Z"
            fill="url(#chartAreaGrad)"
          />

          {/* Main Upward Price Trajectory Curve */}
          <path
            d="M 0,540 C 220,520 380,440 560,460 S 840,340 1020,310 S 1320,180 1600,140"
            fill="none"
            stroke="url(#chartLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* ── Left Flank Candlesticks (Institutional Order Flow) ── */}
          <g transform="translate(80, 0)">
            {/* Candle 1 */}
            <line x1="80" y1="480" x2="80" y2="560" stroke="#967C3B" strokeWidth="1" opacity="0.4" />
            <rect x="74" y="495" width="12" height="42" rx="1.5" fill="#B38F39" opacity="0.35" />

            {/* Candle 2 (Bullish) */}
            <line x1="140" y1="440" x2="140" y2="530" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
            <rect x="134" y="455" width="12" height="55" rx="1.5" fill="#D4AF37" opacity="0.45" />

            {/* Candle 3 */}
            <line x1="200" y1="410" x2="200" y2="490" stroke="#967C3B" strokeWidth="1" opacity="0.4" />
            <rect x="194" y="430" width="12" height="38" rx="1.5" fill="#B38F39" opacity="0.3" />

            {/* Candle 4 (Strong Bullish breakout) */}
            <line x1="260" y1="360" x2="260" y2="460" stroke="#E5C568" strokeWidth="1.5" opacity="0.75" />
            <rect x="253" y="380" width="14" height="65" rx="1.5" fill="#E5C568" opacity="0.55" />
          </g>

          {/* ── Right Flank Candlesticks (High Volume Dubai Session) ── */}
          <g transform="translate(1120, 0)">
            {/* Candle 5 */}
            <line x1="60" y1="260" x2="60" y2="350" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
            <rect x="54" y="275" width="12" height="50" rx="1.5" fill="#D4AF37" opacity="0.4" />

            {/* Candle 6 */}
            <line x1="130" y1="210" x2="130" y2="310" stroke="#E5C568" strokeWidth="1.5" opacity="0.7" />
            <rect x="123" y="225" width="14" height="60" rx="1.5" fill="#E5C568" opacity="0.5" />

            {/* Candle 7 */}
            <line x1="200" y1="160" x2="200" y2="260" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
            <rect x="194" y="180" width="12" height="52" rx="1.5" fill="#D4AF37" opacity="0.45" />

            {/* Candle 8 (Top Wick Peak) */}
            <line x1="270" y1="110" x2="270" y2="220" stroke="#FAF1DE" strokeWidth="1.5" opacity="0.85" />
            <rect x="263" y="130" width="14" height="58" rx="1.5" fill="#FAF1DE" opacity="0.6" />
          </g>

          {/* Subtle Institutional Volume Profile Bars along Right Border */}
          {[140, 180, 220, 260, 300, 340, 380, 420, 460].map((y, i) => (
            <rect
              key={y}
              x={1540 - ((i * 37) % 110)}
              y={y}
              width={(i * 37) % 110}
              height="16"
              rx="2"
              fill="rgba(212, 175, 55, 0.12)"
            />
          ))}
        </svg>

        {/* ─── SCATTERED & REALISTIC ATMOSPHERIC DUSK-TO-OBSIDIAN TRANSITION ─── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              /* 1. Natural non-linear atmospheric easing: stays luminous through the chart body, softly deepens into obsidian */
              linear-gradient(
                to bottom,
                transparent 0%,
                transparent 35%,
                rgba(8, 8, 10, 0.02) 48%,
                rgba(8, 8, 10, 0.09) 60%,
                rgba(8, 8, 10, 0.22) 72%,
                rgba(8, 8, 10, 0.48) 84%,
                rgba(8, 8, 10, 0.78) 93%,
                #08080A 100%
              ),
              /* 2. Lateral atmospheric vignettes: deep dusk tones softly framing the flanks */
              radial-gradient(ellipse 65% 55% at 0% 100%, rgba(8, 8, 10, 0.92) 0%, rgba(8, 8, 10, 0.45) 50%, transparent 80%),
              radial-gradient(ellipse 65% 55% at 100% 100%, rgba(8, 8, 10, 0.92) 0%, rgba(8, 8, 10, 0.45) 50%, transparent 80%),
              /* 3. Luminous golden horizon dispersion behind the tower foundation */
              radial-gradient(ellipse 85% 42% at 50% 95%, rgba(212, 175, 55, 0.16) 0%, rgba(185, 140, 48, 0.05) 50%, transparent 75%),
              /* 4. Scattered atmospheric evening mist nodes (realistic desert air dispersion) */
              radial-gradient(circle 500px at 18% 88%, rgba(195, 155, 75, 0.08) 0%, transparent 65%),
              radial-gradient(circle 500px at 82% 88%, rgba(212, 175, 55, 0.07) 0%, transparent 65%),
              radial-gradient(circle 420px at 50% 82%, rgba(240, 210, 130, 0.09) 0%, transparent 70%)
            `,
          }}
        />
      </div>

      {/* ─── 2. BURJ KHALIFA TOWER: ENTIRE STRUCTURE & BASE ARE FULLY VISIBLE ─── */}
      <div className="relative w-full flex flex-col items-center justify-end z-10 select-none pointer-events-none">
        {/*
          Tower container:
          - Generous height ensures the spire is fully visible with sky headroom above
          - Tower base, palm trees, and waterfront promenade remain crystal clear
        */}
        <motion.div
          style={{
            scale: towerScale,
            transformOrigin: 'bottom center',
          }}
          className="relative w-full flex flex-col items-center justify-end overflow-visible pb-0"
        >
          {/* Full-width Architectural Waterfront Reflection Pool underneath the Burj Khalifa base */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 inset-x-0 w-full h-28 sm:h-36 pointer-events-none z-0"
            style={{
              background: `
                radial-gradient(
                  ellipse 85% 45% at 50% 90%,
                  rgba(240, 205, 120, 0.32) 0%,
                  rgba(212, 175, 55, 0.16) 40%,
                  rgba(180, 135, 45, 0.04) 65%,
                  transparent 85%
                )
              `,
            }}
          />

          {/* Full-width Ground Contact Shadow anchoring the base across the viewport */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 inset-x-0 w-full h-14 sm:h-20 pointer-events-none z-0"
            style={{
              background: `
                radial-gradient(
                  ellipse 80% 35% at 50% 98%,
                  rgba(4, 4, 6, 0.90) 0%,
                  rgba(8, 8, 10, 0.50) 45%,
                  transparent 80%
                )
              `,
            }}
          />

          {/*
            Centered Burj Khalifa Tower Image:
            Zoomed so the circular waterfront base fills 100% of the screen width edge-to-edge
            with ZERO left or right gap on mobile and desktop.
          */}
          <div
            className="relative z-10 flex items-end justify-center overflow-visible"
            style={{
              width: 'clamp(100%, 172vw, 3400px)',
              aspectRatio: '1024 / 1536',
            }}
          >
            <Image
              src="/bhurj_khalifa.png"
              alt="Burj Khalifa — Dubai Architectural Landmark"
              fill
              priority
              sizes="100vw"
              className="object-contain object-bottom filter drop-shadow-[0_25px_50px_rgba(8,6,4,0.55)]"
              style={{
                filter: 'brightness(1.03) contrast(1.04) saturate(1.06)',
              }}
            />
          </div>

          {/*
            ─── 3. DELICATE LOW-PROFILE GROUND WATER-MIST (Ultra-soft, bottom-only) ───
            Only kisses the very edge of the water basin (bottom 24px-36px),
            keeping all palm trees, promenade architecture, and illuminated windows crisp and visible.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-10 sm:h-14 pointer-events-none z-10"
            style={{
              background: `
                linear-gradient(
                  to top,
                  #08080A 0%,
                  rgba(8, 8, 10, 0.65) 25%,
                  rgba(12, 10, 8, 0.18) 60%,
                  transparent 100%
                )
              `,
            }}
          />

          {/* Refined gold horizon hairline at floor seam */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px pointer-events-none z-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.25) 15%, rgba(255,225,140,0.65) 50%, rgba(212,175,55,0.25) 85%, transparent 100%)',
              boxShadow: '0 0 10px rgba(212,175,55,0.35)',
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
