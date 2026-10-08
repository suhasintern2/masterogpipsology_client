'use client';
import React from 'react';

// ─── Results Wall SVG ─────────────────────────────────────────────────────────
// Left frame in the gallery. Shows verified cohort records, mini-charts,
// an equity curve, and retention stat. Inline SVG — zero weight, CSS-var aware.

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { PROGRAMME_PILLARS } from '@/lib/content';
import { fadeUpVariants } from '@/lib/motion';

// Mini sparkline points (pre-calculated for each record)
const SPARKLINES = [
  'M 0,18 L 8,14 L 16,16 L 24,10 L 32,8 L 40,5 L 48,3',
  'M 0,20 L 8,18 L 16,15 L 24,17 L 32,12 L 40,10 L 48,6',
  'M 0,22 L 8,20 L 16,19 L 24,16 L 32,14 L 40,12 L 48,8',
  'M 0,15 L 8,18 L 16,12 L 24,14 L 32,10 L 40,7 L 48,4',
];

// Equity curve
const EQUITY_CURVE =
  'M 10,80 C 30,75 50,70 80,60 S 110,48 140,40 S 170,28 200,18 S 230,14 260,10';

export function ResultsWall(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="flex flex-col gap-4 h-full">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUpVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="flex items-center gap-2"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden="true"
        />
        <span
          className="text-xs font-body font-medium uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          Programme framework
        </span>
      </motion.div>

      {/* Record tiles */}
      <div className="grid grid-cols-2 gap-2">
        {PROGRAMME_PILLARS.map((record, i) => (
          <motion.div
            key={record.label}
            custom={i + 1}
            variants={fadeUpVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="rounded-lg p-3 border"
            style={{ borderColor: 'var(--hairline)' }}
            role="figure"
            aria-label={`${record.value} ${record.label}`}
          >
            {/* Mini sparkline */}
            <svg
              viewBox="0 0 48 24"
              className="w-full h-6 mb-2"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <path
                d={SPARKLINES[i]}
                stroke="var(--accent)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <div
              className="font-display font-medium text-lg leading-none mb-0.5"
              style={{ color: 'var(--accent)' }}
            >
              {record.value}
            </div>
            <div
              className="text-xs font-body leading-tight"
              style={{ color: 'var(--text-muted)' }}
            >
              {record.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Equity curve */}
      <motion.div
        custom={5}
        variants={fadeUpVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="flex-1 rounded-lg border p-3"
        style={{ borderColor: 'var(--hairline)' }}
      >
        <div
          className="text-xs font-body mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Illustrative equity curve
        </div>
        <svg
          viewBox="0 0 270 90"
          className="w-full"
          aria-label="Illustrative equity curve (decorative, not performance data)"
          role="img"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${EQUITY_CURVE} L 260,90 L 10,90 Z`}
            fill="url(#eqGrad)"
          />
          <path
            d={EQUITY_CURVE}
            stroke="var(--accent)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
