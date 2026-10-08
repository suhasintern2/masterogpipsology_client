'use client';
import React from 'react';

// ─── Glass Header ─────────────────────────────────────────────────────────────
// Fixed top navigation bar. Visible on all screen sizes.
// Mobile: logo + hamburger only (MobileMenuSheet handles the menu).
// Desktop: logo + nav links + CTA.
//
// REVISED glassmorphic transition:
//   • At 0 scroll:  pill is fully transparent, text is dark ink. Light & minimal.
//   • At 30%+ scroll: pill becomes charcoal glassmorphic — backdrop blur,
//     dark semi-transparent bg, soft border, inner glow, subtle shadow.
//     Text transitions to warm ivory.
//   • This transition is INDEPENDENT of the page background.
//     The page remains warm beige — only the navbar darkens.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { NAV_LINKS, CTA_PRIMARY, BRAND_NAME } from '@/lib/content';
import { Button } from '@/components/ui/Button';
import { MobileMenuSheet } from './MobileMenuSheet';
import { SPRING_SNAPPY } from '@/lib/motion';

export function GlassHeader(): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  // Navbar glass opacity — fades in after 40px
  const rawGlassOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const glassOpacity = useSpring(rawGlassOpacity, { stiffness: 120, damping: 24 });

  // Navbar dark progress — 0 (light) → 1 (dark charcoal glass) over first 35% of page
  const rawDarkProgress = useTransform(scrollYProgress, [0, 0.30], [0, 1]);
  const darkProgress = useSpring(rawDarkProgress, { stiffness: 80, damping: 22 });

  // Derived values from dark progress
  // Background: transparent → charcoal glass
  const navBgAlpha = useTransform(darkProgress, [0, 1], [0, 0.82]);
  // Border: warm beige hairline → subtle silver/white glass border
  const navBorderAlpha = useTransform(darkProgress, [0, 1], [0.12, 0.18]);
  // Text: dark ink → warm ivory
  const navTextL = useTransform(darkProgress, [0, 1], [10, 92]);   // hsl lightness %
  const navTextMutedL = useTransform(darkProgress, [0, 1], [40, 68]);

  // Shadow — more dramatic as nav darkens
  const shadowOpacity = useTransform(darkProgress, [0, 1], [0, 0.4]);

  // Close sheet on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50" role="banner">
        <div className="mx-3 sm:mx-4 mt-3">
          <div className="relative rounded-2xl overflow-hidden">

            {/* ── Light glass layer (shows at top of page) ─── */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl"
              style={{
                opacity: useTransform(darkProgress, [0, 1], [1, 0]),
                backgroundColor: 'rgba(245, 240, 230, 0.75)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.7),
                  inset 0 -1px 0 rgba(0,0,0,0.04),
                  0 8px 30px rgba(50,38,15,0.12)
                `,
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            />

            {/* ── Luxury Glassmorphic Layer with Gradient (Dark/Ivory Mode) ─── */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl"
              style={{
                opacity: darkProgress,
                backdropFilter: 'blur(16px) saturate(160%)',
                WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                background: `
                  linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.18) 0%,
                    rgba(240, 220, 180, 0.08) 25%,
                    rgba(14, 15, 20, 0.86) 55%,
                    rgba(20, 21, 28, 0.90) 80%,
                    rgba(212, 175, 55, 0.14) 100%
                  )
                `,
                boxShadow: `
                  inset 0 1.5px 1px rgba(255, 255, 255, 0.40),
                  inset 0 -1px 1px rgba(0, 0, 0, 0.5),
                  0 16px 45px rgba(0, 0, 0, 0.65),
                  0 0 25px rgba(212, 175, 55, 0.15)
                `,
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }}
            />

            {/* Nav content */}
            <nav
              className="relative flex items-center justify-between px-4 sm:px-5 py-2.5"
              aria-label="Primary navigation"
            >
              {/* Logo + MASTER OF PIPSOLOGY */}
              <a
                href="/"
                className="flex items-center gap-2.5 no-underline flex-shrink-0 group"
                aria-label="MASTER OF PIPSOLOGY — home"
              >
                <div className="relative rounded-full p-0.5 border border-white/25 shadow-sm overflow-hidden flex-shrink-0">
                  <Image
                    src="/main_logo.png"
                    alt="Master of Pipsology logo"
                    width={38}
                    height={38}
                    className="rounded-full object-contain"
                    priority
                  />
                </div>
                <motion.span
                  className="font-display font-bold text-xs sm:text-sm tracking-wider uppercase inline-block ml-0.5"
                  style={{
                    letterSpacing: '0.07em',
                    color: useTransform(
                      darkProgress,
                      [0, 1],
                      ['#1C1917', '#FAF6F0']
                    ),
                  }}
                >
                  MASTER OF PIPSOLOGY
                </motion.span>
              </a>

              {/* Desktop nav links */}
              <ul className="hidden md:flex items-center gap-6 lg:gap-8" role="list">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <motion.a
                      href={link.href}
                      className="text-sm font-body font-medium no-underline transition-colors duration-200 hover:text-[#D4AF37]"
                      style={{
                        color: useTransform(
                          darkProgress,
                          [0, 1],
                          ['#44403C', '#EAE2D5']
                        ),
                      }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>

              {/* Right side — CTA + hamburger */}
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <Button as="a" href="#cta" size="sm" variant="filled">
                    {CTA_PRIMARY}
                  </Button>
                </div>

                {/* Hamburger — only on mobile */}
                <motion.button
                  className="md:hidden flex flex-col gap-[5px] p-2 rounded-lg"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-menu"
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING_SNAPPY}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="block w-5 h-0.5 rounded-full"
                      style={{
                        backgroundColor: useTransform(
                          darkProgress,
                          [0, 1],
                          ['#1C1917', '#FAF6F0']
                        ),
                      }}
                    />
                  ))}
                </motion.button>
              </div>
            </nav>
          </div>
        </div>

        {/* Drop shadow underneath */}
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-4 left-0 right-0 h-8 pointer-events-none"
          style={{
            opacity: shadowOpacity,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(10,10,16,0.5) 0%, transparent 70%)',
          }}
        />
      </header>

      {/* Mobile fullscreen menu sheet */}
      <MobileMenuSheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
