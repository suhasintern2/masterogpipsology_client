import React from 'react';
// ─── Page ─────────────────────────────────────────────────────────────────────
// Server Component. Pure composition — no logic here.
// The ArchitecturalScene wraps the core content sections (Markets, Gallery,
// Curriculum) to create the horizontal parallax / 3D camera-movement illusion.

import { LongTaskProbe } from '@/components/dev/LongTaskProbe';
import { GlassHeader } from '@/components/nav/GlassHeader';
import { Hero } from '@/components/sections/Hero';
import { CryptoMarketScroll } from '@/components/sections/CryptoMarketScroll';
import { ForexMarketScroll } from '@/components/sections/ForexMarketScroll';
import { SculptureInterlude } from '@/components/sections/SculptureInterlude';
import { Markets } from '@/components/sections/Markets';
import { MomentsReel } from '@/components/sections/MomentsReel';
import { LuxuryTeamGallery } from '@/components/sections/LuxuryTeamGallery';
import { Gallery } from '@/components/sections/Gallery';
import { Curriculum } from '@/components/sections/Curriculum';
import { Testimonial } from '@/components/sections/Testimonial';
import { MagicRingShowcase } from '@/components/art/MagicRingShowcase';
import { FinalCta } from '@/components/sections/FinalCta';
import { Footer } from '@/components/sections/Footer';
import { Preloader } from '@/components/fx/Preloader';
import { PaletteBackdrop } from '@/components/fx/PaletteBackdrop';
import { Grain } from '@/components/fx/Grain';
import { Cursor } from '@/components/fx/Cursor';

export default function Page(): React.ReactElement {
  return (
    <>
      <Preloader />
      <PaletteBackdrop />
      <Grain />
      <Cursor />
      <LongTaskProbe />
      {/* Fixed navigation */}
      <GlassHeader />

      {/* Page body — the scroll root for the theme system */}
      <div className="relative">
        <main id="main-content" style={{ color: 'var(--text)' }}>
          {/* Skip to main content link for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-body focus:font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)' }}
          >
            Skip to main content
          </a>

          {/* Hero — full-viewport background image */}
          <Hero />

          {/* 240-frame sticky scroll sequence: "Let me introduce you to the market, first crypto" */}
          <CryptoMarketScroll />

          {/* 720-frame sticky scroll sequence: Forex + Stock Market + Opportunity */}
          <ForexMarketScroll />

          {/* Text-free gold sculpture beat between Forex and the dark sections */}
          <SculptureInterlude />

          {/* ── PERSISTENT LUXURY BLACK EFFECT (Stays black all the way to page end) ── */}
          <div data-nav-tone="dark" className="theme-black-section relative w-full text-[#F5EFEB]">
            {/* Three markets, 3D glass cards */}
            <Markets />

            {/* Faculty editorial gallery */}
            <LuxuryTeamGallery />

            {/* Atelier film strip: pinned horizontal moments reel */}
            <MomentsReel />

            {/* Programme curriculum (12-week timeline) */}
            <Curriculum />

            {/* Verified cohort records & certification awards */}
            <Gallery />

            <Testimonial />
            <MagicRingShowcase />
            <FinalCta />
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
}
