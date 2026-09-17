'use client';

// ─── Scroll → Colour Theme System ────────────────────────────────────────────
// REVISED: The global page background (--bg, --surface, --text) is NO LONGER
// driven by scroll position. The warm beige/ivory environment persists through
// the entire scroll journey.
//
// What this system now controls:
//   1. --navbar-progress (0→1): drives the navbar's independent glassmorphic
//      dark transition.
//   2. --accent / --accent-bright: very subtle brightening of the brass tone.
//   3. --ground-shadow-opacity: controls the local shadow at the building base.
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

// ─── Navbar progress writes (0 → 1 across scroll) ─────────────────────────────
// Only the navbar tint shifts — the page background stays beige.

function writeNavbarProgress(progress: number): void {
  const root = document.documentElement;

  // Navbar progress: 0 at top, 1 at ~40% scroll (early transition for glass)
  const navP = Math.min(1, progress / 0.35);
  root.style.setProperty('--navbar-progress', navP.toFixed(4));

  // Ground shadow at base of building — local darkening only
  const groundP = Math.min(1, Math.max(0, (progress - 0.1) / 0.6));
  root.style.setProperty('--ground-shadow-opacity', groundP.toFixed(4));

  // Accent: very subtle brightening from antique brass → slightly brighter brass
  // Range is narrow — this is barely perceptible, just adds life
  const accentL = 40 + progress * 10;           // 40% → 50% lightness
  const accentBrightL = 50 + progress * 12;     // 50% → 62% lightness
  root.style.setProperty('--accent', `hsl(38, 45%, ${accentL.toFixed(1)}%)`);
  root.style.setProperty('--accent-bright', `hsl(38, 50%, ${accentBrightL.toFixed(1)}%)`);
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useThemeScroll(containerRef: React.RefObject<HTMLElement | null>): void {
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Initialise CSS vars so they're always defined
    document.documentElement.style.setProperty('--navbar-progress', '0');
    document.documentElement.style.setProperty('--ground-shadow-opacity', '0');
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
    writeNavbarProgress(Math.max(0, Math.min(1, latest)));
  });
}
