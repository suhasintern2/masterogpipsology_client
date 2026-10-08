'use client';

// ─── Scroll → Colour Theme System ────────────────────────────────────────────
// REVISED: The global page background (--bg, --surface, --text) is NO LONGER
// driven by scroll position. The warm beige/ivory environment persists through
// the entire scroll journey.
//
// What this system now controls:
//   --accent / --accent-bright: very subtle brightening of the brass tone.
//   (--navbar-progress and --ground-shadow-opacity keep their CSS defaults in
//   globals.css; they are no longer written per frame.)
//
// Background progression is now achieved through:
//   - Parallax depth and layering (BurjKhalifahLayer)
//   - Local shadow accumulation at the building ground plane
//   - NOT by darkening the entire viewport.

import { useEffect, useRef } from 'react';
import {
  useScroll,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';
import { SPRING_HEAVY } from './motion';

// ─── Accent writes (0 → 1 across scroll) ─────────────────────────────────────
// Only written when the resulting string changes, to avoid root style invalidation.

let lastAccent = '';
let lastAccentBright = '';

function writeAccentProgress(progress: number): void {
  const root = document.documentElement;

  // Accent: very subtle brightening from antique brass → slightly brighter brass
  // Range is narrow — this is barely perceptible, just adds life
  const accentL = 40 + progress * 10;           // 40% → 50% lightness
  const accentBrightL = 50 + progress * 12;     // 50% → 62% lightness
  const accent = `hsl(38, 45%, ${accentL.toFixed(1)}%)`;
  const accentBright = `hsl(38, 50%, ${accentBrightL.toFixed(1)}%)`;
  if (accent !== lastAccent) {
    lastAccent = accent;
    root.style.setProperty('--accent', accent);
  }
  if (accentBright !== lastAccentBright) {
    lastAccentBright = accentBright;
    root.style.setProperty('--accent-bright', accentBright);
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useThemeScroll(containerRef: React.RefObject<HTMLElement | null>): void {
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef as React.RefObject<HTMLElement>,
    offset: ['start start', 'end end'],
  });

  const springProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 28,
    mass: 0.9,
  });

  useMotionValueEvent(springProgress, 'change', (latest: number) => {
    if (prefersReduced.current) return;
    writeAccentProgress(Math.max(0, Math.min(1, latest)));
  });
}
