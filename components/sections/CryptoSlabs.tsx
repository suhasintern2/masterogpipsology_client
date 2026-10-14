'use client';

import React, { Fragment, useEffect, useRef } from 'react';
import { CRYPTO_SLAB_CLOSE, CRYPTO_SLAB_INTRO, CRYPTO_SLAB_TEACH } from '@/lib/content';
import { CRYPTO_SLAB_WINDOWS, slabPart, slabZone, type PartStyle, type SlabId } from '@/lib/crypto-slabs';
import { enterAt, leaveAt, TM_MAX_UNITS } from '@/lib/text-motion';
import { SplitWords } from '@/components/motion/SplitWords';
import { collectUnits, invalidateUnits, writeUnit, type ScrubUnit } from '@/components/motion/scrub-units';

/** Imperative driver: call with the stop coordinate s (lib/step-scroll stopCoord) from the Crypto frame tick. */
export type SlabDriver = { current: ((s: number) => void) | null };

const IDS: readonly SlabId[] = ['intro', 'teach', 'close'];

/**
 * The three Crypto slab texts. No React state. Rise-and-lift text motion (lib/text-motion.ts): units in overflow masks,
 * transform + opacity only, written from the Crypto frame tick; reduced motion = still crossfade per part.
 */
export function CryptoSlabs({ driverRef }: { driverRef: SlabDriver }): React.ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const intro = CRYPTO_SLAB_INTRO;
  const teach = CRYPTO_SLAB_TEACH;
  const close = CRYPTO_SLAB_CLOSE;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const slabs: HTMLElement[] = [];
    const parts: HTMLElement[][] = [];
    const units: ScrubUnit[][] = [];
    for (const id of IDS) {
      const el = root.querySelector<HTMLElement>(`[data-slab="${id}"]`);
      if (!el) return;
      slabs.push(el);
      parts.push(Array.from(el.querySelectorAll<HTMLElement>('[data-part]')));
      const list = collectUnits(el);
      if (process.env.NODE_ENV !== 'production' && list.length > TM_MAX_UNITS) {
        console.warn(`CryptoSlabs: "${id}" has ${list.length} animated units (budget ${TM_MAX_UNITS})`);
      }
      units.push(list);
    }
    const lastPartO: string[][] = parts.map((p) => p.map(() => ''));
    const lastVis: string[] = slabs.map(() => '');
    const lastZone: number[] = slabs.map(() => -1);
    const fade: PartStyle = { opacity: 0, y: 0 };
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;
    let last = Number.NaN;

    const apply = (s: number, force?: boolean): void => {
      if (s === last && !force) return;
      last = s;
      for (let i = 0; i < IDS.length; i++) {
        const w = CRYPTO_SLAB_WINDOWS[IDS[i]];
        const zone = slabZone(s, w);
        if (!force && zone === lastZone[i] && (zone & 1) === 0) continue; // before / hold / after: nothing moves
        lastZone[i] = zone;
        let any = false;
        // Reduced: whole parts crossfade, units still. Full motion: parts stay at 1, units move.
        slabPart(s, w, 0, 1, true, fade);
        const po = reduced ? fade.opacity.toFixed(3) : '1';
        if (reduced && fade.opacity > 0.002) any = true;
        const pl = parts[i];
        for (let j = 0; j < pl.length; j++) if (lastPartO[i][j] !== po) { lastPartO[i][j] = po; pl[j].style.opacity = po; }
        const list = units[i];
        for (let k = 0; k < list.length; k++) {
          const u = list[k];
          const op = reduced
            ? writeUnit(u, 1, 0)
            : writeUnit(u, enterAt(s, w.inFrom, w.inTo, u.part, u.parts, u.unit, u.units), leaveAt(s, w.outFrom, w.outTo, u.part, u.parts, u.unit, u.units));
          if (!reduced && op > 0.002) any = true;
        }
        const vis = any ? 'visible' : 'hidden';
        if (vis !== lastVis[i]) { lastVis[i] = vis; slabs[i].style.visibility = vis; }
      }
    };

    const onMq = (e: MediaQueryListEvent): void => {
      reduced = e.matches;
      for (const l of units) invalidateUnits(l);
      for (const p of lastPartO) p.fill('');
      apply(last, true);
    };
    mq.addEventListener('change', onMq);
    driverRef.current = apply;
    apply(-1, true);
    return () => { driverRef.current = null; mq.removeEventListener('change', onMq); };
  }, [driverRef]);

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {/* Slab 1: intro, top-right */}
      <div data-slab="intro" className="cslab cslab--intro">
        <div className="w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 flex flex-col justify-between py-10 md:py-14">
          <div className="flex flex-col items-end text-right max-w-xl self-end">
            <div data-part className="cslab__label">
              <span className="tm-mask"><span className="tm-u" data-u="rise">{intro.label}</span></span>
              <span className="cslab__rule" data-u="line" />
            </div>
            <h2 className="cslab__title cslab__title--intro">
              <span className="sr-only">{intro.title[0]} {intro.title[1]}</span>
              <span aria-hidden="true">
                <span data-part><SplitWords text={intro.title[0]} kind="tilt" /></span>
                <br />
                <em data-part><SplitWords text={intro.title[1]} kind="tilt" letters /></em>
              </span>
            </h2>
            {intro.body && (
              <p className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
                <span className="sr-only">{intro.body}</span>
                <span data-part aria-hidden="true"><SplitWords text={intro.body} kind="rise" /></span>
              </p>
            )}
            {intro.tags && (
              <div data-part className="mt-6 flex flex-wrap justify-end gap-2.5">
                {intro.tags.map((t) => (
                  <span key={t} className="tm-mask tm-mask--chip">
                    <span className="tm-u px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs" data-u="rise">{t}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slab 2: the MOP method, top-left (phones: top band) */}
      <div data-slab="teach" className="cslab cslab--teach">
        <div data-part className="cslab__label">
          <span className="tm-mask"><span className="tm-u" data-u="rise">{teach.label}</span></span>
          <span className="cslab__rule" data-u="line" />
        </div>
        <h3 className="cslab__title">
          <span className="sr-only">{teach.title[0]} {teach.title[1]}</span>
          <span aria-hidden="true">
            <span data-part><SplitWords text={teach.title[0]} kind="tilt" /></span>
            <br />
            <em data-part><SplitWords text={teach.title[1]} kind="tilt" letters /></em>
          </span>
        </h3>
        {teach.body && (
          <p className="cslab__body">
            <span className="sr-only">{teach.body}</span>
            <span data-part aria-hidden="true"><SplitWords text={teach.body} kind="rise" /></span>
          </p>
        )}
        {teach.path && (
          <div data-part className="cslab__path">
            {teach.path.map((s, i) => (
              <Fragment key={s}>
                {i > 0 && <i aria-hidden="true" data-u="pop" />}
                <span className="tm-mask"><span className="tm-u" data-u="rise">{s}</span></span>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Slab 3: centred above the falling coin (stop raw 179) */}
      <div data-slab="close" className="cslab cslab--close">
        <div data-part className="cslab__label">
          <span className="cslab__rule" data-u="line" data-dir="-1" />
          <span className="tm-mask"><span className="tm-u" data-u="rise">{close.label}</span></span>
          <span className="cslab__rule" data-u="line" />
        </div>
        <h3 className="cslab__title">
          <span className="sr-only">{close.title[0]} {close.title[1]}</span>
          <span aria-hidden="true">
            <span data-part><SplitWords text={close.title[0]} kind="tilt" /></span>{' '}
            <br className="cslab__br" />
            <em data-part><SplitWords text={close.title[1]} kind="tilt" letters /></em>
          </span>
        </h3>
      </div>
    </div>
  );
}

export default CryptoSlabs;
