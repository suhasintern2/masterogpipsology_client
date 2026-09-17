import React from 'react';
// ─── Page ─────────────────────────────────────────────────────────────────────
// Server Component. Pure composition — no logic here.
// The ThemeScrollWrapper (client) activates the scroll→colour system on mount.
// The ArchitecturalScene wraps the core content sections (Markets, Gallery,
// Curriculum) to create the horizontal parallax / 3D camera-movement illusion.

import { ThemeScrollWrapper } from '@/components/providers/ThemeScrollWrapper';
import { GlassHeader } from '@/components/nav/GlassHeader';
import { Hero } from '@/components/sections/Hero';
import { Marquee } from '@/components/sections/Marquee';
import { Markets } from '@/components/sections/Markets';
import { BurjKhalifaReveal } from '@/components/sections/BurjKhalifaReveal';
import { LuxuryTeamGallery } from '@/components/sections/LuxuryTeamGallery';
import { Gallery } from '@/components/sections/Gallery';
import { Curriculum } from '@/components/sections/Curriculum';
import { Testimonial } from '@/components/sections/Testimonial';
import { MagicRingShowcase } from '@/components/art/MagicRingShowcase';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/sections/Footer';

export default function Page(): React.ReactElement {
  return (
    <>
      {/* Fixed navigation */}
      <GlassHeader />

      {/* Page body — the scroll root for the theme system */}
      <ThemeScrollWrapper>
        <main id="main-content" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
          {/* Skip to main content link for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-body focus:font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            Skip to main content
          </a>

          {/* Hero — full-viewport, gradient light play on scroll */}
          <Hero />

          {/* Marquee — ticker strip between hero and main content */}
          <Marquee />

          {/* Markets covered — stock, crypto, and forex description */}
          <Markets />

          {/* Burj Khalifa landmark — basement spans full width, lifting upward */}
          <BurjKhalifaReveal />

          {/* ── PERSISTENT LUXURY BLACK EFFECT (Stays black all the way to page end) ── */}
          <div className="theme-black-section relative w-full bg-[#08080A] text-[#F5EFEB]">
            {/* Luxury animated team movement gallery & moments */}
            <LuxuryTeamGallery />

            {/* Verified cohort records & certification awards */}
            <Gallery />

            {/* Programme curriculum */}
            <Curriculum />

            <Testimonial />
            <MagicRingShowcase />
            <FinalCta />
            <Footer />
          </div>
        </main>
      </ThemeScrollWrapper>
    </>
  );
}
