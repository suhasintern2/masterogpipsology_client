'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { gsap } from '@/lib/gsap';
import styles from './IntelligenceHero.module.css';

const EASING = [0.22, 1, 0.36, 1] as const;

// Letter indices (into each line's text) that bleed. Varied per line.
const LINE_ONE = 'Be a man.';
const LINE_TWO = 'Take that goddamn risk.';
const DRIPS_ONE = [1, 3, 5, 7] as const;
const DRIPS_TWO = [1, 3, 6, 10, 13, 16, 20] as const;

function BloodLine({ text, drips }: { text: string; drips: readonly number[] }): React.ReactElement {
  return (
    <>
      <span className={styles.blood} data-text="">{text}</span>
      <span className={styles.drips} data-layer="" aria-hidden="true">
        {drips.map((i) => (
          <span key={i} className={styles.drip} data-drip="" data-i={i}>
            <svg data-strand="" className={styles.strand} viewBox="0 0 10 100" preserveAspectRatio="none">
              <path d="M2.6 0 H7.4 C7.2 30 6.4 60 5.8 86 C5.6 97 4.4 97 4.2 86 C3.6 60 2.8 30 2.6 0Z" fill="#8c0212" />
              <path d="M3.9 0 H5 C5 40 4.9 70 4.8 88 H4.4 C4.3 70 3.9 40 3.9 0Z" fill="#ff7b86" opacity="0.35" />
            </svg>
            <span data-drop="" className={styles.drop} />
          </span>
        ))}
      </span>
    </>
  );
}

export function IntelligenceHero({
  autoPlayVideo = true,
  videoPreload = 'auto',
  embedded = false,
  revealed = false,
}: {
  autoPlayVideo?: boolean;
  videoPreload?: 'auto' | 'metadata' | 'none';
  /** Rendered inside ForexMarketScroll's sticky (geometry and video are driven from there). */
  embedded?: boolean;
  /** Embedded only: show the text. */
  revealed?: boolean;
} = {}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(containerRef, { once: false, amount: 0.15 });
  const show = embedded ? revealed : inView;
  const statementRef = useRef<HTMLDivElement>(null);

  // Blood drips: measured on mount/resize only, animated with GSAP (transform/opacity only).
  useEffect(() => {
    const root = statementRef.current;
    if (!embedded || !root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const range = document.createRange();
    const tls: gsap.core.Timeline[] = [];
    let onScreen = true;
    let delayed: gsap.core.Tween | null = null;

    const dripsOf = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>('[data-drip]'));

    const measure = (): void => {
      root.querySelectorAll<HTMLElement>('[data-layer]').forEach((layer) => {
        const line = layer.parentElement;
        const tn = line?.querySelector('[data-text]')?.firstChild;
        if (!line || !tn) return;
        const base = line.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(line).fontSize) || 64;
        layer.querySelectorAll<HTMLElement>('[data-drip]').forEach((el) => {
          const idx = Number(el.dataset.i);
          range.setStart(tn, idx);
          range.setEnd(tn, idx + 1);
          const r = range.getBoundingClientRect();
          const w = Math.max(3, fs * 0.075);
          const h = Number(el.dataset.h) || fs * (0.45 + Math.random() * 0.5);
          el.dataset.h = String(h);
          el.style.left = `${r.left - base.left + r.width / 2 - w / 2}px`;
          el.style.top = `${r.top - base.top + fs * 0.9}px`;
          el.style.width = `${w}px`;
          const strand = el.querySelector<HTMLElement>('[data-strand]');
          const drop = el.querySelector<HTMLElement>('[data-drop]');
          if (strand) strand.style.height = `${h}px`;
          if (drop) {
            drop.style.width = `${w * 1.5}px`;
            drop.style.height = `${w * 1.9}px`;
            drop.style.left = `${-w * 0.25}px`;
          }
        });
      });
    };

    const kill = (): void => {
      delayed?.kill();
      tls.splice(0).forEach((t) => t.kill());
    };

    const pose = (): void => {
      dripsOf().forEach((el) => {
        const h = Number(el.dataset.h) || 0;
        const k = reduced ? 0.55 : 0.2;
        gsap.set(el.querySelector('[data-strand]'), { scaleY: k, transformOrigin: '50% 0%' });
        gsap.set(el.querySelector('[data-drop]'), { y: h * k, opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.7 });
      });
    };

    const build = (): void => {
      kill();
      measure();
      pose();
      if (reduced || !show) return;
      delayed = gsap.delayedCall(1.2, () => {
        dripsOf().forEach((el, n) => {
          const h = Number(el.dataset.h) || 40;
          const strand = el.querySelector('[data-strand]');
          const drop = el.querySelector('[data-drop]');
          const grow = 3.2 + Math.random() * 2.6;
          const tl = gsap.timeline({
            repeat: -1,
            repeatDelay: 0.4 + Math.random() * 2.4,
            delay: (n % 4) * 0.6 + Math.random() * 1.6,
          });
          tl.set(strand, { scaleY: 0.2 })
            .set(drop, { y: h * 0.2, opacity: 1, scale: 0.7 })
            .to(strand, { scaleY: 1, duration: grow, ease: 'sine.in' }, 0)
            .to(drop, { y: h, scale: 1, duration: grow, ease: 'sine.in' }, 0)
            .to(drop, { y: h * 2.9, opacity: 0, duration: 1.3, ease: 'power2.in' })
            .to(strand, { scaleY: 0.2, duration: 0.7, ease: 'power2.out' }, '<');
          if (!onScreen || document.hidden) tl.pause();
          tls.push(tl);
        });
      });
    };

    const sync = (): void => {
      const run = onScreen && !document.hidden;
      tls.forEach((t) => (run ? t.resume() : t.pause()));
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(root);
    document.addEventListener('visibilitychange', sync);
    const ro = new ResizeObserver(build);
    ro.observe(root);
    document.fonts?.ready.then(build).catch(() => {});
    build();

    return () => {
      kill();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [embedded, show]);

  // Play video on mount / view
  useEffect(() => {
    if (autoPlayVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [autoPlayVideo]);

  // Close menu on Escape or screen resize to landscape
  useEffect(() => {
    if (embedded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const mql = window.matchMedia('(max-aspect-ratio: 11/10)');
    const handleMql = (e: MediaQueryListEvent) => {
      if (!e.matches) setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    if (mql.addEventListener) {
      mql.addEventListener('change', handleMql);
    } else {
      mql.addListener(handleMql);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMql);
      } else {
        mql.removeListener(handleMql);
      }
    };
  }, [embedded]);

  return (
    <section
      ref={containerRef}
      aria-label="The Next Layer of Intelligence"
      className={`${styles.stage} ${embedded ? styles.embedded : ''} ${isOpen ? styles.isOpen : ''}`}
    >
      {/* ── Background Video Plate ────────────────────────────────────────── */}
      <div className={styles.plate} aria-hidden="true">
        <video
          ref={videoRef}
          className={styles.plateVideo}
          autoPlay={autoPlayVideo}
          muted
          loop
          playsInline
          preload={videoPreload}
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4"
            type="video/mp4"
          />
          <source src="/intelligence-layer.mp4" type="video/mp4" />
        </video>
        {embedded && <div className={styles.plateShade} data-ih-shade="" aria-hidden="true" />}
      </div>

      {!embedded && (
        <>
      {/* ── Topbar / Header ────────────────────────────────────────────────── */}
        <header className={styles.topbar}>
          {/* Brand bolt geometry mark */}
          <motion.a
            href="#home"
            aria-label="Home"
            className={styles.brand}
            initial={{ opacity: 0, y: 20 }}
            animate={show ? { opacity: 1, y: 0 } : embedded ? { opacity: 0, y: 20 } : {}}
            transition={{ duration: 0.8, ease: EASING }}
          >
            <svg
              className={styles.brandSvg}
              viewBox="0 0 31.5 48.5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="brandGradBg1"
                  x1="8"
                  y1="0"
                  x2="34.1"
                  y2="28.9"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="#9e9e9e" />
                  <stop offset="0.28" stopColor="#a6a6a6" />
                  <stop offset="0.34" stopColor="#a3a3a3" />
                  <stop offset="0.40" stopColor="#3a3a3a" />
                  <stop offset="0.55" stopColor="#414141" />
                  <stop offset="0.60" stopColor="#7a7a7a" />
                  <stop offset="0.68" stopColor="#8e8e8e" />
                  <stop offset="0.80" stopColor="#a9a9a9" />
                  <stop offset="0.95" stopColor="#c4c4c4" />
                  <stop offset="1" stopColor="#cccccc" />
                </linearGradient>
              </defs>
              <path
                d="M21.5 0 L21.5 19.5 L31.5 19.5 L31.5 29 L10 48.5 L10 28.5 L0.5 28.5 L0.5 18.5 Z"
                fill="url(#brandGradBg1)"
              />
              <rect x="0.5" y="18.5" width="9" height="10" fill="#fdfdfd" />
              <rect x="22" y="19.5" width="9.5" height="9.5" fill="#fdfdfd" />
            </svg>
          </motion.a>
  
          {/* Primary nav links (Desktop centered) */}
          <motion.nav
            className={styles.links}
            aria-label="Primary"
            initial={{ opacity: 0, y: 14 }}
            animate={show ? { opacity: 1, y: 0 } : embedded ? { opacity: 0, y: 14 } : {}}
            transition={{ duration: 0.8, ease: EASING }}
          >
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </motion.nav>
  
          {/* Header CTA pill */}
          <motion.a
            href="#get-started"
            className={`${styles.pill} ${styles.pillNav}`}
            initial={{ opacity: 0, y: 14 }}
            animate={show ? { opacity: 1, y: 0 } : embedded ? { opacity: 0, y: 14 } : {}}
            transition={{ duration: 0.8, ease: EASING }}
          >
            <span>Get Started</span>
          </motion.a>
  
          {/* Mobile Burger Toggle */}
          <button
            className={styles.burger}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-intelligence-menu"
          >
            <i />
            <i />
          </button>
        </header>
  
        {/* ── Mobile Overlay Menu ────────────────────────────────────────────── */}
        <nav
          id="mobile-intelligence-menu"
          className={styles.menu}
          aria-hidden={!isOpen}
        >
          <div className={styles.menuInner}>
            <p className={styles.menuEyebrow}>Menu</p>
            <ul className={styles.menuList}>
              <li><a href="#about" onClick={() => setIsOpen(false)}>About</a></li>
              <li><a href="#features" onClick={() => setIsOpen(false)}>Features</a></li>
              <li><a href="#faq" onClick={() => setIsOpen(false)}>FAQ</a></li>
              <li><a href="#contact" onClick={() => setIsOpen(false)}>Contact</a></li>
            </ul>
            <div className={styles.menuFoot}>
              <a
                href="#get-started"
                className={styles.pillMenu}
                onClick={() => setIsOpen(false)}
              >
                <span>Get Started</span>
              </a>
              <a
                href="#architecture"
                className={styles.ghostMenu}
                onClick={() => setIsOpen(false)}
              >
                View Architecture
              </a>
            </div>
          </div>
        </nav>
        </>
      )}

      {embedded ? (
        <div ref={statementRef} className={styles.statement}>
          <motion.p
            className={styles.stmtLine}
            initial={{ opacity: 0, y: 18 }}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.9, delay: 0.06, ease: EASING }}
          >
            <BloodLine text={LINE_ONE} drips={DRIPS_ONE} />
          </motion.p>
          <motion.p
            className={`${styles.stmtLine} ${styles.stmtGold}`}
            initial={{ opacity: 0, y: 18 }}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASING }}
          >
            <BloodLine text={LINE_TWO} drips={DRIPS_TWO} />
          </motion.p>
        </div>
      ) : (
        <>
      {/* ── Hero Main Content ──────────────────────────────────────────────── */}
      <main className={styles.hero}>
        <motion.h1
          className={styles.headline}
          initial={{ opacity: 0, y: 14 }}
          animate={show ? { opacity: 1, y: 0 } : embedded ? { opacity: 0, y: 14 } : {}}
          transition={{ duration: 0.9, delay: 0.06, ease: EASING }}
        >
          <span>The Next Layer</span>{' '}
          <span>of Intelligence</span>
        </motion.h1>

        <motion.p
          className={styles.sub}
          initial={{ opacity: 0, y: 14 }}
          animate={show ? { opacity: 1, y: 0 } : embedded ? { opacity: 0, y: 14 } : {}}
          transition={{ duration: 0.9, delay: 0.14, ease: EASING }}
        >
          <span>A unified infrastructure platform to help teams build,</span>{' '}
          <span>ship, and scale AI systems with confidence.</span>
        </motion.p>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 14 }}
          animate={show ? { opacity: 1, y: 0 } : embedded ? { opacity: 0, y: 14 } : {}}
          transition={{ duration: 0.9, delay: 0.22, ease: EASING }}
        >
          <a href="#get-started" className={`${styles.pill} ${styles.pillCta}`}>
            <span>Get Started</span>
          </a>
          <a href="#architecture" className={styles.ghost}>
            View Architecture
          </a>
        </motion.div>
      </main>

      {/* ── Partner Logos Strip ────────────────────────────────────────────── */}
      <motion.div
        className={styles.logos}
        aria-label="Partner logos"
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : embedded ? { opacity: 0 } : {}}
        transition={{ duration: 1.1, delay: 0.34, ease: 'easeOut' }}
      >
        {/* Logo 1 */}
        <div className={`${styles.lg} ${styles.lg1}`}>
          <svg className={styles.lgIcon} viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="bite1_comp" maskUnits="userSpaceOnUse">
              <rect x="0" y="0.5" width="30" height="30" rx="5.5" fill="#fff" />
              <circle cx="19.5" cy="10.5" r="5.1" fill="#000" />
            </mask>
            <rect x="0" y="0.5" width="30" height="30" rx="5.5" fill="currentColor" mask="url(#bite1_comp)" />
            <circle cx="19.5" cy="10.5" r="3.2" fill="currentColor" />
          </svg>
          <span className={styles.word}>logoipsum</span>
        </div>

        {/* Logo 2 */}
        <div className={`${styles.lg} ${styles.lg2}`}>
          <svg className={styles.lgIcon} viewBox="0 0 25 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="7" height="30" rx="3.5" fill="currentColor" />
            <mask id="split2_comp" maskUnits="userSpaceOnUse">
              <circle cx="15.5" cy="15" r="9.5" fill="#fff" />
              <rect x="15.5" y="5.5" width="10" height="19" fill="#000" />
            </mask>
            <circle cx="15.5" cy="15" r="9.5" fill="currentColor" mask="url(#split2_comp)" />
            <circle cx="15.5" cy="15" r="4" fill="currentColor" />
          </svg>
          <span className={styles.word}>
            logoipsum<span className={styles.dot} />
          </span>
        </div>

        {/* Logo 3 */}
        <div className={`${styles.lg} ${styles.lg3}`}>
          <svg className={styles.lgIcon} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12.35" stroke="currentColor" strokeWidth="3.1" />
            <path
              d="M7 14 C7 10.13 10.13 7 14 7 C16.5 7 18.7 8.3 19.9 10.3"
              stroke="currentColor"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            <path
              d="M21 14 C21 17.87 17.87 21 14 21 C11.5 21 9.3 19.7 8.1 17.7"
              stroke="currentColor"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
          </svg>
          <span className={styles.word}>logoipsum</span>
        </div>

        {/* Logo 4 */}
        <div className={`${styles.lg} ${styles.lg4}`}>
          <svg className={styles.lgIcon} viewBox="0 0 28 25.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.5 10.5 C3.5 5 8 1 14 1 C20 1 24.5 5 26.5 10.5 C22.5 8.5 18.5 8.5 14 10 C9.5 11.5 5.5 11.5 1.5 10.5 Z"
              fill="currentColor"
            />
            <path
              d="M1.5 16.5 C5.5 14.5 9.5 14.5 14 16.5 C18.5 18.5 22.5 18.5 26.5 16.5"
              stroke="currentColor"
              strokeWidth="3.05"
              strokeLinecap="round"
            />
            <path
              d="M1.5 22.5 C5.5 20.5 9.5 20.5 14 22.5 C18.5 24.5 22.5 24.5 26.5 22.5"
              stroke="currentColor"
              strokeWidth="3.05"
              strokeLinecap="round"
            />
          </svg>
          <span className={styles.word}>logoipsum</span>
        </div>
      </motion.div>
        </>
      )}
    </section>
  );
}
export default IntelligenceHero;
