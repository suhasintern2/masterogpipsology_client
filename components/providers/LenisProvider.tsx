'use client';
import React from 'react';

// ─── Lenis Smooth Scroll Provider ─────────────────────────────────────────────
// Wraps the page in Lenis smooth scrolling, synchronized with Framer Motion's
// global scroll. Disabled entirely under prefers-reduced-motion.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';
import { onEveryFrame } from '@/lib/frame-loop';

interface LenisContextValue {
  lenis: Lenis | null;
}

const LenisContext = createContext<LenisContextValue>({ lenis: null });

export function useLenis(): Lenis | null {
  return useContext(LenisContext).lenis;
}

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps): React.ReactElement {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      autoRaf: false,
    });

    // Lenis runs in framer-motion's "update" step; frame sequences run later in "render".
    const stop = onEveryFrame((t) => instance.raf(t), 'update');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- publishing external Lenis instance
    setLenis(instance);

    return () => {
      stop();
      instance.destroy();
      setLenis(null);
    };
  }, [prefersReduced]);

  const value = useMemo(() => ({ lenis }), [lenis]);

  return (
    <LenisContext.Provider value={value}>
      {children}
    </LenisContext.Provider>
  );
}
