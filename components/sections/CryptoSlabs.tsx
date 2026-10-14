'use client';

import React, { Fragment, useEffect, useRef } from 'react';
import { CRYPTO_SLAB_CLOSE, CRYPTO_SLAB_TEACH } from '@/lib/content';
import { CRYPTO_SLAB_WINDOWS, slabPart, type PartStyle, type SlabId } from '@/lib/crypto-slabs';

/** Imperative driver: call with the stop coordinate s (lib/step-scroll stopCoord) from the Crypto frame tick. */
export type SlabDriver = { current: ((s: number) => void) | null };

const IDS: readonly SlabId[] = ['intro', 'teach', 'close'];

/**
 * The three Crypto slab texts. No React state: every part's opacity and translateY is a pure function of the stop
 * coordinate, written (transform + opacity only) from the same tick that draws the frames.
 */
export function CryptoSlabs({ driverRef }: { driverRef: SlabDriver }): React.ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const teach = CRYPTO_SLAB_TEACH;
  const close = CRYPTO_SLAB_CLOSE;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const slabs: HTMLElement[] = [];
    const parts: HTMLElement[][] = [];
    for (const id of IDS) {
      const el = root.querySelector<HTMLElement>(`[data-slab="${id}"]`);
      if (!el) return;
      slabs.push(el);
      parts.push(Array.from(el.querySelectorAll<HTMLElement>('[data-part]')));
    }
    const lastOpacity: string[][] = parts.map((p) => p.map(() => ''));
    const lastTransform: string[][] = parts.map((p) => p.map(() => ''));
    const lastVis: string[] = slabs.map(() => '');
    const scratch: PartStyle = { opacity: 0, y: 0 };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;
    let last = Number.NaN;

    const apply = (s: number, force?: boolean): void => {
      if (s === last && !force) return;
      last = s;
      for (let i = 0; i < IDS.length; i++) {
        const w = CRYPTO_SLAB_WINDOWS[IDS[i]];
        const list = parts[i];
        let any = false;
        for (let j = 0; j < list.length; j++) {
          slabPart(s, w, j, list.length, reduced, scratch);
          const o = scratch.opacity.toFixed(3);
          const t = `translate3d(0,${scratch.y.toFixed(2)}px,0)`;
          if (o !== lastOpacity[i][j]) { lastOpacity[i][j] = o; list[j].style.opacity = o; }
          if (t !== lastTransform[i][j]) { lastTransform[i][j] = t; list[j].style.transform = t; }
          if (scratch.opacity > 0.002) any = true;
        }
        const vis = any ? 'visible' : 'hidden';
        if (vis !== lastVis[i]) { lastVis[i] = vis; slabs[i].style.visibility = vis; }
      }
    };

    const onMq = (e: MediaQueryListEvent): void => {
      reduced = e.matches;
      apply(last, true);
    };
    mq.addEventListener('change', onMq);
    driverRef.current = apply;
    apply(-1, true);
    return () => {
      driverRef.current = null;
      mq.removeEventListener('change', onMq);
    };
  }, [driverRef]);

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {/* Slab 1: the original editorial intro, top-right */}
      <div data-slab="intro" className="cslab cslab--intro">
        <div className="w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 flex flex-col justify-between py-10 md:py-14">
          <div className="flex flex-col items-end text-right max-w-xl self-end">
            <div data-part className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] uppercase tracking-widest mb-3">
              <span>The Inaugural Asset Class</span>
              <span className="w-6 h-px bg-[#D4AF37]" />
            </div>
            <h2
              data-part
              className="font-display font-medium leading-[1.08] tracking-tight text-[#0E0F14] text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)', textShadow: '0 1px 18px rgba(255,255,255,0.6)' }}
            >
              Let me introduce you <br className="hidden sm:inline" />
              to the market, <br />
              <span className="italic font-normal text-[#B38728]">first crypto.</span>
            </h2>
            <p data-part className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
              Where 24/7 algorithmic volatility, perpetual order flow, and global liquidity pools converge. The foundation every modern institutional trader masters.
            </p>
            <div data-part className="mt-6 flex flex-wrap justify-end gap-2.5">
              <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">
                BTC • BITCOIN
              </span>
              <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">
                ETH • ETHEREUM
              </span>
              <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">
                SOL • SOLANA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slab 2: how the programme teaches crypto, top-left */}
      <div data-slab="teach" className="cslab cslab--teach">
        <div data-part className="cslab__label">
          <span>{teach.label}</span>
          <span className="cslab__rule" />
        </div>
        <h3 data-part className="cslab__title">
          {teach.title[0]}
          <br />
          <em>{teach.title[1]}</em>
        </h3>
        {teach.body && (
          <p data-part className="cslab__body">
            {teach.body}
          </p>
        )}
        {teach.path && (
          <div data-part className="cslab__path">
            {teach.path.map((s, i) => (
              <Fragment key={s}>
                {i > 0 && <i aria-hidden="true" />}
                <span>{s}</span>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Slab 3: centred above the falling coin (stop raw 179) */}
      <div data-slab="close" className="cslab cslab--close">
        <div data-part className="cslab__label">
          <span className="cslab__rule" />
          <span>{close.label}</span>
          <span className="cslab__rule" />
        </div>
        <h3 data-part className="cslab__title">
          {close.title[0]}{' '}
          <br className="cslab__br" />
          <em>{close.title[1]}</em>
        </h3>
      </div>
    </div>
  );
}

export default CryptoSlabs;
