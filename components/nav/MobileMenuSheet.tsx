'use client';
import React from 'react';

// ─── Mobile Menu Sheet ─────────────────────────────────────────────────────────
// Full-screen glass sheet that expands when mobile pill nav is tapped.
// Spring transition, staggered link entrance.

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import Image from 'next/image';
import { NAV_LINKS, CTA_PRIMARY, BRAND_NAME } from '@/lib/content';
import { Button } from '@/components/ui/Button';
import { sheetVariants, listItemVariants, SPRING_RESPONSIVE } from '@/lib/motion';

export interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenuSheet({ isOpen, onClose }: MobileMenuSheetProps): React.ReactElement {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 flex flex-col"
          variants={sheetVariants}
          initial="closed"
          animate="open"
          exit="closed"
          style={{
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            backgroundColor: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <a
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 no-underline"
              aria-label={`${BRAND_NAME} — home`}
            >
              <Image
                src="/main_logo.png"
                alt={`${BRAND_NAME} logo`}
                width={36}
                height={36}
                className="rounded-full object-contain"
              />
              <span className="font-display font-semibold text-base tracking-tight" style={{ color: 'var(--text)' }}>
                {BRAND_NAME}
              </span>
            </a>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <line x1="1" y1="1" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="17" y1="1" x2="1" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Hairline */}
          <div className="h-px mx-6" style={{ backgroundColor: 'var(--hairline)' }} aria-hidden="true" />

          {/* Nav links */}
          <nav className="flex-1 flex flex-col justify-center px-8" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-1" role="list">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  custom={i}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  role="listitem"
                >
                  <a
                    href={link.href}
                    onClick={onClose}
                    className="block py-4 font-display font-medium text-2xl tracking-tight no-underline transition-colors duration-200"
                    style={{ color: 'var(--text)' }}
                  >
                    {link.label}
                  </a>
                  <div className="h-px" style={{ backgroundColor: 'var(--hairline)' }} aria-hidden="true" />
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* CTA */}
          <motion.div
            className="px-6 pb-8"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_RESPONSIVE, delay: 0.3 }}
          >
            <Button
              as="a"
              href="#cta"
              size="lg"
              variant="filled"
              onClick={onClose}
              className="w-full"
            >
              {CTA_PRIMARY}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
