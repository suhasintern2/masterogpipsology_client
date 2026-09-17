'use client';
import React from 'react';

// ─── Markets Section ──────────────────────────────────────────────────────────
// Editorial alternating list — Forex, Equities, Crypto.
// Each item separated by a hairline. Brass underline draws on hover.
// Not a card grid — an editorial list with genuine hierarchy.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARKETS } from '@/lib/content';
import { Hairline } from '@/components/ui/Hairline';
import { fadeUpVariants } from '@/lib/motion';

export function Markets(): React.ReactElement {
  return (
    <section
      id="markets"
      className="py-20 md:py-28 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto"
      aria-labelledby="markets-heading"
    >
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-xs font-body font-medium uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          Markets covered
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }} aria-hidden="true" />
      </div>

      <h2
        id="markets-heading"
        className="display font-medium leading-tight tracking-tight mb-12 md:mb-16"
        style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)', color: 'var(--text)' }}
      >
        Three markets.<br />One framework.
      </h2>

      {/* Market list */}
      <div>
        <Hairline />
        {MARKETS.map((market, i) => (
          <MarketItem key={market.id} market={market} index={i} />
        ))}
      </div>
    </section>
  );
}

interface MarketItemProps {
  market: typeof MARKETS[number];
  index: number;
}

function MarketItem({ market, index }: MarketItemProps): React.ReactElement {
  const [hovered, setHovered] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={index}
      variants={fadeUpVariants}
      className="py-8 md:py-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex flex-col md:flex-row gap-6 md:gap-12 ${isEven ? '' : 'md:flex-row-reverse'}`}>
        {/* Heading + kicker */}
        <div className="md:w-64 lg:w-80 flex-shrink-0">
          <div
            className="text-xs font-body font-medium uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {market.kicker}
          </div>
          <div className="relative inline-block">
            <h3
              className="display font-medium tracking-tight leading-none"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: 'var(--text)' }}
            >
              {market.heading}
            </h3>
            {/* Brass underline draws on hover */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px brass-rule"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0, originX: 1 }}
                  transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Body + tags */}
        <div className="flex-1 flex flex-col gap-4">
          <p
            className="body-max text-base leading-relaxed font-body"
            style={{ color: 'var(--text-muted)' }}
          >
            {market.body}
          </p>

          {/* Pill tags */}
          <div className="flex flex-wrap gap-2" role="list" aria-label={`${market.heading} topics`}>
            {market.tags.map((tag) => (
              <span
                key={tag}
                role="listitem"
                className="px-3 py-1 rounded-full text-xs font-body font-medium border"
                style={{
                  borderColor: 'var(--hairline)',
                  color: 'var(--text-muted)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Hairline className="mt-8 md:mt-10" />
    </motion.article>
  );
}
