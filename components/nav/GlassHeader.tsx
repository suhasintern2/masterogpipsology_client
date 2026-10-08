'use client';
import React from 'react';

// ─── Liquid Glass Header ──────────────────────────────────────────────────────
// Floating glass pill. One backdrop-filter layer (.lg-pill::before). Tone,
// compact, hide/show and the liquid indicator are driven by ScrollTrigger and
// the shared frame loop; only transform/opacity animate.

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { NAV_LINKS, CTA_PRIMARY } from '@/lib/content';
import { Button } from '@/components/ui/Button';
import { MobileMenuSheet } from './MobileMenuSheet';
import { LiquidGlassFilter } from './LiquidGlassFilter';
import { indicatorTransform, stretchKeyframes } from './nav-math';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { onEveryFrame } from '@/lib/frame-loop';
import { scrollStore } from '@/lib/scroll-store';
import { getLenis } from '@/components/providers/LenisProvider';

type ChromiumNav = Navigator & { userAgentData?: { brands: { brand: string }[] } };

export function GlassHeader(): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileOpenRef = useRef(false);
  const wrapRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const ulRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  const closeMenu = useCallback(() => {
    setMobileOpen(false);
    burgerRef.current?.focus();
  }, []);

  // Close sheet on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const pill = pillRef.current;
    const ul = ulRef.current;
    const indicator = indicatorRef.current;
    if (!wrap || !pill || !ul || !indicator) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isChromium = (navigator as ChromiumNav).userAgentData?.brands?.some((b) => b.brand === 'Chromium');
    if (isChromium) pill.classList.add('lg-refract');

    const cleanups: Array<() => void> = [];
    const ctx = gsap.context(() => {
      // Tone: toggle dark class over dark sections.
      document.querySelectorAll<HTMLElement>('[data-nav-tone="dark"]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 48px',
          end: 'bottom 48px',
          toggleClass: { targets: pill, className: 'lg-dark' },
        });
      });

      // Shrink after hero.
      const hero = document.getElementById('hero');
      if (hero) {
        ScrollTrigger.create({
          trigger: hero,
          start: 'bottom 80px',
          onEnter: () => pill.classList.add('lg-compact'),
          onLeaveBack: () => pill.classList.remove('lg-compact'),
        });
      }

      // Hide / show on scroll direction (shared clock).
      let heroH = hero ? hero.offsetHeight : 0;
      const onRefresh = (): void => { heroH = hero ? hero.offsetHeight : 0; };
      ScrollTrigger.addEventListener('refresh', onRefresh);
      cleanups.push(() => ScrollTrigger.removeEventListener('refresh', onRefresh));
      const scrollFn = ScrollTrigger.getScrollFunc(window) as () => number;
      let hidden = false;
      cleanups.push(
        onEveryFrame(() => {
          const y = getLenis()?.scroll ?? scrollFn();
          let next = hidden;
          if (scrollStore.direction === 1 && y > heroH) next = true;
          else if (scrollStore.direction === -1) next = false;
          if (next && (mobileOpenRef.current || wrap.contains(document.activeElement))) next = false;
          if (next !== hidden) {
            hidden = next;
            wrap.classList.toggle('lg-hidden', hidden);
          }
        }, 'render'),
      );

      // Liquid indicator.
      const links = Array.from(ul.querySelectorAll<HTMLAnchorElement>('a'));
      let rects = links.map((a) => indicatorTransform(a.offsetLeft, a.offsetWidth));
      let active = -1;
      let tl: gsap.core.Timeline | null = null;
      gsap.set(indicator, { x: 0, scaleX: 1, opacity: 0 });
      const setActive = (i: number): void => {
        const prev = active;
        active = i;
        tl?.kill();
        if (i < 0) {
          gsap.to(indicator, { opacity: 0, duration: reduced ? 0 : 0.3 });
          return;
        }
        const to = rects[i];
        if (reduced || prev < 0) {
          gsap.set(indicator, { x: to.x, scaleX: to.sx, opacity: 1 });
          return;
        }
        const from = rects[prev];
        const [k1, k2] = stretchKeyframes(from.x, from.sx, to.x, to.sx);
        tl = gsap.timeline();
        tl.to(indicator, { x: k1.x, scaleX: k1.sx, opacity: 1, duration: 0.18, ease: 'power2.in' });
        tl.to(indicator, { x: k2.x, scaleX: k2.sx, duration: 0.42, ease: 'expo.out' });
      };
      const measure = (): void => {
        rects = links.map((a) => indicatorTransform(a.offsetLeft, a.offsetWidth));
        if (active >= 0) gsap.set(indicator, { x: rects[active].x, scaleX: rects[active].sx });
      };
      const ro = new ResizeObserver(measure);
      ro.observe(ul);
      cleanups.push(() => ro.disconnect());

      NAV_LINKS.forEach((link, i) => {
        const section = document.querySelector(link.href);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (self.isActive) setActive(i);
            else if (active === i) setActive(-1);
          },
        });
      });

      // Magnetic hover (desktop fine pointer, not reduced).
      if (!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
        const targets = Array.from(pill.querySelectorAll<HTMLElement>('[data-magnetic]')).map((el) => ({
          el,
          qx: gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' }),
          qy: gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' }),
          inside: false,
        }));
        const onMove = (e: PointerEvent): void => {
          for (const t of targets) {
            const r = t.el.getBoundingClientRect();
            const ox = Number(gsap.getProperty(t.el, 'x')) || 0;
            const oy = Number(gsap.getProperty(t.el, 'y')) || 0;
            const left = r.left - ox - 12;
            const right = r.right - ox + 12;
            const top = r.top - oy - 12;
            const bottom = r.bottom - oy + 12;
            const inside = e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom;
            if (inside) {
              t.qx((e.clientX - (left + right) / 2) * 0.25);
              t.qy((e.clientY - (top + bottom) / 2) * 0.35);
              t.inside = true;
            } else if (t.inside) {
              t.qx(0);
              t.qy(0);
              t.inside = false;
            }
          }
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', onMove));
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <>
      <LiquidGlassFilter />
      <header
        ref={wrapRef}
        className="lg-wrap fixed top-3 inset-x-0 z-50 flex justify-center pointer-events-none"
        role="banner"
      >
        <div ref={pillRef} className="lg-pill pointer-events-auto">
          <nav
            className="lg-content relative flex items-center justify-between px-4 sm:px-5 py-2"
            aria-label="Primary navigation"
          >
            {/* Logo + MASTER OF PIPSOLOGY */}
            <a
              href="/"
              className="flex items-center gap-2.5 no-underline flex-shrink-0 group lg-text"
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
              <span
                className="lg-wordmark font-display font-bold text-xs sm:text-sm tracking-wider uppercase ml-0.5"
                style={{ letterSpacing: '0.07em' }}
              >
                MASTER OF PIPSOLOGY
              </span>
            </a>

            {/* Desktop nav links */}
            <ul ref={ulRef} className="relative hidden md:flex items-center gap-6 lg:gap-8" role="list">
              <span ref={indicatorRef} aria-hidden="true" className="lg-indicator" />
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    data-magnetic
                    className="lg-link relative inline-block text-sm font-body font-medium no-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Right side — CTA + hamburger */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <Button as="a" href="#cta" size="sm" variant="liquid" data-magnetic>
                  {CTA_PRIMARY}
                </Button>
              </div>

              <button
                ref={burgerRef}
                type="button"
                className="lg-burger md:hidden flex flex-col gap-[5px] p-2 rounded-lg"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                <span className="lg-bar" />
                <span className="lg-bar" />
                <span className="lg-bar" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile fullscreen menu sheet */}
      <MobileMenuSheet isOpen={mobileOpen} onClose={closeMenu} />
    </>
  );
}
