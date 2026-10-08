'use client';
import React from 'react';

// ─── Achievements Gallery ──────────────────────────────────────────────────────
// Two large framed pieces side by side (desktop) / stacked (mobile).
// Left: ResultsWall — verified cohort records, equity curve.
// Right: CertificateDisplay — certification with brass border and seal.
// Desktop: pointer-tracking tilt (max 6°, spring-damped). Disabled on touch.
// Specular sheen sweep on hover.
// Four-up stat bar below.

import { useRef, useState, useCallback } from 'react';
import { motion, useSpring } from 'framer-motion';
import { ResultsWall } from '@/components/art/ResultsWall';
import { CertificateDisplay } from '@/components/art/CertificateDisplay';
import { SPRING_SLOW } from '@/lib/motion';

export function Gallery(): React.ReactElement {
  return (
    <section
      id="gallery"
      className="py-20 md:py-28 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto"
      aria-labelledby="gallery-heading"
    >
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-xs font-body font-medium uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          Results
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }} aria-hidden="true" />
      </div>

      <h2
        id="gallery-heading"
        className="display font-medium leading-tight tracking-tight mb-12 md:mb-16"
        style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)', color: 'var(--text)' }}
      >
        Real results from<br />real traders.
      </h2>

      {/* Gallery frames */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <TiltFrame label="Programme framework">
          <ResultsWall />
        </TiltFrame>

        <TiltFrame label="Certification and awards">
          <CertificateDisplay />
        </TiltFrame>
      </div>
    </section>
  );
}

// ─── Tilt frame ───────────────────────────────────────────────────────────────
interface TiltFrameProps {
  children: React.ReactNode;
  label: string;
}

function TiltFrame({ children, label }: TiltFrameProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(0, SPRING_SLOW);
  const rotateY = useSpring(0, SPRING_SLOW);
  const sheenX = useSpring(-120, SPRING_SLOW);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;

      // Disable on touch-primary devices
      if (window.matchMedia('(hover: none)').matches) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      rotateX.set(-dy * 6);
      rotateY.set(dx * 6);
      sheenX.set(e.clientX - rect.left);
    },
    [rotateX, rotateY, sheenX],
  );

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    sheenX.set(-120);
    setIsHovered(false);
  }, [rotateX, rotateY, sheenX]);

  return (
    <figure
      ref={ref}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        borderColor: 'var(--accent)',
        perspective: '800px',
        boxShadow: 'var(--shadow-lg)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      aria-label={label}
    >
      <motion.div
        className="w-full p-5 md:p-6"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          backgroundColor: 'var(--surface)',
        }}
      >
        {children}

        {/* Specular sheen */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
          style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
        >
          <motion.div
            className="absolute top-0 bottom-0 w-24"
            style={{
              left: sheenX,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              transform: 'skewX(-15deg)',
            }}
          />
        </motion.div>
      </motion.div>

      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
