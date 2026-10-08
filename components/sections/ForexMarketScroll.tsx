'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useLenis } from '@/components/providers/LenisProvider';
import { IntelligenceHero } from '@/components/sections/IntelligenceHero';

// ── Tunable constants ────────────────────────────────────────────────────────
const FOREX_FRAMES       = 240;
const STOCK_FRAMES       = 240;
const OPPORTUNITY_FRAMES = 240;
const TOTAL_FRAMES       = FOREX_FRAMES + STOCK_FRAMES + OPPORTUNITY_FRAMES; // 720

const SMOOTHING            = 10;
const INITIAL_BATCH        = 30;
const BATCH_SIZE           = 8;
const DPR_CAP              = 2;
const SCROLL_HEIGHT_VH     = 1500; // 500vh per phase + transition buffer
const FRAME_SCROLL_PORTION = 0.70; // 0.00 .. 0.70 = 720 frames; 0.74 .. 0.88 = blend into video

// ── Frame URL helpers ────────────────────────────────────────────────────────
const pad = (n: number): string => String(n + 1).padStart(3, '0');
const getForexSrc       = (i: number): string => `/assets/forex/ezgif-frame-${pad(i)}.jpg`;
const getStockSrc       = (i: number): string => `/assets/stock_market/ezgif-frame-${pad(i)}.jpg`;
const getOpportunitySrc = (i: number): string => `/assets/opportunity/ezgif-frame-${pad(i)}.jpg`;

// ── Sequence descriptor ──────────────────────────────────────────────────────
type SeqName = 'forex' | 'stock' | 'opportunity';

interface SeqInfo {
  name:   SeqName;
  start:  number;
  frames: number;
  getSrc: (i: number) => string;
  label:  string;
}

const SEQUENCES: SeqInfo[] = [
  { name: 'forex',       start: 0,                           frames: FOREX_FRAMES,       getSrc: getForexSrc,       label: 'Asset Class 02 \u2022 Foreign Exchange' },
  { name: 'stock',       start: FOREX_FRAMES,                frames: STOCK_FRAMES,       getSrc: getStockSrc,       label: 'Asset Class 03 \u2022 Stock Market'     },
  { name: 'opportunity', start: FOREX_FRAMES + STOCK_FRAMES, frames: OPPORTUNITY_FRAMES, getSrc: getOpportunitySrc, label: 'The Opportunity'                        },
];

function resolveSeq(globalIdx: number): { seq: SeqInfo; localIdx: number } {
  for (let s = SEQUENCES.length - 1; s >= 0; s--) {
    if (globalIdx >= SEQUENCES[s].start)
      return { seq: SEQUENCES[s], localIdx: globalIdx - SEQUENCES[s].start };
  }
  return { seq: SEQUENCES[0], localIdx: globalIdx };
}

// ── Component ────────────────────────────────────────────────────────────────
export function ForexMarketScroll(): React.ReactElement {
  const containerRef      = useRef<HTMLDivElement>(null);
  const stickyViewportRef = useRef<HTMLDivElement>(null);
  const canvasRef         = useRef<HTMLCanvasElement>(null);

  // Transition layers
  const heroContentRef  = useRef<HTMLDivElement>(null);
  const hudContainerRef = useRef<HTMLDivElement>(null);

  // Image caches
  const forexImages       = useRef<(HTMLImageElement | null)[]>(new Array(FOREX_FRAMES).fill(null));
  const stockImages       = useRef<(HTMLImageElement | null)[]>(new Array(STOCK_FRAMES).fill(null));
  const opportunityImages = useRef<(HTMLImageElement | null)[]>(new Array(OPPORTUNITY_FRAMES).fill(null));

  const getCacheForSeq = useCallback((name: SeqName): (HTMLImageElement | null)[] => {
    if (name === 'stock')       return stockImages.current;
    if (name === 'opportunity') return opportunityImages.current;
    return forexImages.current;
  }, []);

  // HUD and overlay refs
  const hudLabelRef    = useRef<HTMLSpanElement>(null);
  const hudFrameRef    = useRef<HTMLSpanElement>(null);
  const hudTotalRef    = useRef<HTMLSpanElement>(null);
  const hudProgressRef = useRef<HTMLDivElement>(null);

  const forexOverlayRef       = useRef<HTMLDivElement>(null);
  const stockOverlayRef       = useRef<HTMLDivElement>(null);
  const opportunityOverlayRef = useRef<HTMLDivElement>(null);
  const activeSeqRef          = useRef<SeqName>('forex');

  // Animation and layout state (zero React state re-renders)
  const targetProgressRef  = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const lastDrawnFrameRef  = useRef<number>(-1);
  const lastRafTimeRef     = useRef<number>(0);
  const rafIdRef           = useRef<number>(0);
  const isVisibleRef       = useRef<boolean>(false);
  const isRunningRef       = useRef<boolean>(false);
  const sectionTopRef      = useRef<number>(0);
  const sectionHeightRef   = useRef<number>(0);

  const lenis = useLenis();

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Draw ──────────────────────────────────────────────────────────────────
  const drawFrame = useCallback((globalIdx: number): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { seq, localIdx } = resolveSeq(globalIdx);
    const cache = getCacheForSeq(seq.name);
    const total = seq.frames;

    let img: HTMLImageElement | null = cache[localIdx] ?? null;

    if (!img?.complete || !img.naturalWidth) {
      for (let i = localIdx - 1; i >= 0; i--) {
        const c = cache[i];
        if (c?.complete && c.naturalWidth) { img = c; break; }
      }
    }
    if (!img?.complete || !img.naturalWidth) {
      for (let i = localIdx + 1; i < total; i++) {
        const c = cache[i];
        if (c?.complete && c.naturalWidth) { img = c; break; }
      }
    }
    if (!img?.complete || !img.naturalWidth) {
      const seqIdx = SEQUENCES.findIndex(s => s.name === seq.name);
      outer: for (let s = seqIdx - 1; s >= 0; s--) {
        const prevCache = getCacheForSeq(SEQUENCES[s].name);
        for (let i = prevCache.length - 1; i >= 0; i--) {
          const c = prevCache[i];
          if (c?.complete && c.naturalWidth) { img = c; break outer; }
        }
      }
    }
    if (!img?.complete || !img.naturalWidth) return;

    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const ratio = Math.max(cw / iw, ch / ih);
    const dw = Math.round(iw * ratio), dh = Math.round(ih * ratio);
    const dx = Math.round((cw - dw) / 2), dy = Math.round((ch - dh) / 2);
    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  }, [getCacheForSeq]);

  // ── Canvas resize ─────────────────────────────────────────────────────────
  const syncCanvasSize = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; }
    }
    drawFrame(lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0);
  }, [drawFrame]);

  const cacheLayout = useCallback((): void => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    sectionTopRef.current    = rect.top + window.scrollY;
    sectionHeightRef.current = rect.height;
    syncCanvasSize();
  }, [syncCanvasSize]);

  // ── HUD & Overlay text updates ────────────────────────────────────────────
  const updateHUD = useCallback((globalIdx: number, currentProgress: number): void => {
    const { seq, localIdx } = resolveSeq(globalIdx);
    if (hudFrameRef.current)    hudFrameRef.current.textContent    = String(localIdx + 1).padStart(3, '0');
    if (hudTotalRef.current)    hudTotalRef.current.textContent    = String(seq.frames);
    if (hudLabelRef.current)    hudLabelRef.current.textContent    = seq.label;
    if (hudProgressRef.current) {
      const p = localIdx / Math.max(seq.frames - 1, 1);
      hudProgressRef.current.style.width = `${Math.round(p * 100)}%`;
    }

    if (activeSeqRef.current !== seq.name) {
      activeSeqRef.current = seq.name;
    }

    // Smooth deterministic text opacities based on global progress
    let forexOp = 0;
    let stockOp = 0;
    let oppOp   = 0;

    if (globalIdx < 240) {
      // Forex phase
      forexOp = globalIdx > 215 ? Math.max(0, 1 - (globalIdx - 215) / 24) : 1;
    } else if (globalIdx < 480) {
      // Stock phase
      if (globalIdx < 265) {
        stockOp = (globalIdx - 240) / 25;
      } else if (globalIdx > 455) {
        stockOp = Math.max(0, 1 - (globalIdx - 455) / 24);
      } else {
        stockOp = 1;
      }
    } else {
      // Opportunity phase
      if (globalIdx < 505) {
        oppOp = (globalIdx - 480) / 25;
      } else if (globalIdx > 660) {
        oppOp = Math.max(0, 1 - (globalIdx - 660) / 45);
      } else {
        oppOp = 1;
      }
    }

    // Fade entire HUD out cleanly as doorway frame settles (zero visual clutter)
    let hudMasterOp = 1;
    if (currentProgress > 0.68) {
      hudMasterOp = Math.max(0, 1 - (currentProgress - 0.68) / 0.05);
    }

    if (forexOverlayRef.current)       forexOverlayRef.current.style.opacity       = String(forexOp * hudMasterOp);
    if (stockOverlayRef.current)       stockOverlayRef.current.style.opacity       = String(stockOp * hudMasterOp);
    if (opportunityOverlayRef.current) opportunityOverlayRef.current.style.opacity = String(oppOp * hudMasterOp);
    if (hudContainerRef.current)       hudContainerRef.current.style.opacity       = String(hudMasterOp);
  }, []);

  // ── Cinematic Doorway-to-Video Direct Blend Processor ─────────────────────
  const processDoorwayTransition = useCallback((current: number): void => {
    const canvas = canvasRef.current;
    const heroContent = heroContentRef.current;

    if (!canvas || !heroContent) return;

    if (current <= FRAME_SCROLL_PORTION) {
      // 0.00 .. 0.70: Normal frame sequence playback
      if (canvas.style.filter !== 'none') canvas.style.filter = 'none';
      if (canvas.style.opacity !== '1') canvas.style.opacity = '1';
      heroContent.style.pointerEvents = 'none';
      return;
    }

    if (current <= 0.73) {
      // 0.70 .. 0.73: Settle on sharp doorway final frame
      if (canvas.style.filter !== 'none') canvas.style.filter = 'none';
      if (canvas.style.opacity !== '1') canvas.style.opacity = '1';
      heroContent.style.pointerEvents = 'none';
      return;
    }

    // 0.73 .. 0.88: Doorway frame vanishes into the dark video with zero light bloom
    const t = Math.max(0, Math.min(1, (current - 0.73) / 0.15));

    // 1. Soft optical blur and dark fade (no light, dims into darkness of video)
    const blurPx = Math.min(24, t * 36);
    const brightnessVal = Math.max(0.1, 1 - t * 0.9);
    canvas.style.filter = blurPx > 0.2
      ? `blur(${blurPx.toFixed(1)}px) brightness(${brightnessVal.toFixed(2)})`
      : 'none';

    // 2. Canvas image opacity vanishes from 1.0 to 0.0 directly revealing the underlying video
    const canvasOp = Math.max(0, 1 - t);
    canvas.style.opacity = canvasOp.toFixed(3);

    // 3. Enable pointer events on hero once the doorway has cleared
    if (t >= 0.90) {
      heroContent.style.pointerEvents = 'auto';
    } else {
      heroContent.style.pointerEvents = 'none';
    }
  }, []);

  // ── rAF loop ──────────────────────────────────────────────────────────────
  const startLoop = useCallback((): void => {
    if (isRunningRef.current) return;
    isRunningRef.current   = true;
    lastRafTimeRef.current = performance.now();

    const loop = (now: number): void => {
      const dt = Math.min((now - lastRafTimeRef.current) / 1000, 0.05);
      lastRafTimeRef.current = now;

      const target  = targetProgressRef.current;
      let   current = currentProgressRef.current;

      current = prefersReducedMotion
        ? target
        : current + (target - current) * (1 - Math.exp(-dt * SMOOTHING));

      currentProgressRef.current = current;

      // Map progress to frame index (clamped to 719 for doorway transition)
      let globalIdx: number;
      if (current < FRAME_SCROLL_PORTION) {
        const frameP = current / FRAME_SCROLL_PORTION;
        globalIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(frameP * TOTAL_FRAMES)));
      } else {
        // Doorway final frame remains locked during the transition
        globalIdx = TOTAL_FRAMES - 1;
      }

      if (globalIdx !== lastDrawnFrameRef.current) {
        drawFrame(globalIdx);
        lastDrawnFrameRef.current = globalIdx;
      }

      updateHUD(globalIdx, current);
      processDoorwayTransition(current);

      if (Math.abs(target - current) < 0.0001) {
        isRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
  }, [drawFrame, updateHUD, processDoorwayTransition, prefersReducedMotion]);

  const stopLoop = useCallback((): void => {
    cancelAnimationFrame(rafIdRef.current);
    isRunningRef.current = false;
  }, []);

  // ── Scroll handler ────────────────────────────────────────────────────────
  const onScroll = useCallback((): void => {
    const scrollY    = window.scrollY;
    const top        = sectionTopRef.current;
    const height     = sectionHeightRef.current;
    const viewportH  = window.innerHeight;
    const scrollable = height - viewportH;
    if (scrollable <= 0) return;

    const progress = Math.max(0, Math.min(1, (scrollY - top) / scrollable));
    targetProgressRef.current = progress;
    if (isVisibleRef.current) startLoop();
  }, [startLoop]);

  // ── Progressive preloader ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadImg = (src: string, cache: (HTMLImageElement | null)[], idx: number): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src   = src;
        img.onload = async () => {
          if (cancelled) return resolve();
          try { if ('decode' in img) await img.decode(); } catch (_) { /* noop */ }
          cache[idx] = img;
          resolve();
        };
        img.onerror = () => resolve();
      });

    const loadRange = (start: number, end: number, cache: (HTMLImageElement | null)[], getSrc: (i: number) => string): Promise<void> => {
      const batch: Promise<void>[] = [];
      for (let i = start; i < end; i++) batch.push(loadImg(getSrc(i), cache, i));
      return Promise.all(batch).then(() => undefined);
    };

    const run = async (): Promise<void> => {
      // Forex frame 0 – show immediately
      await loadImg(getForexSrc(0), forexImages.current, 0);
      if (cancelled) return;
      cacheLayout();
      drawFrame(0);
      lastDrawnFrameRef.current = 0;
      updateHUD(0, 0);

      // Pre-warm initial frames and the critical doorway final frame
      loadImg(getStockSrc(0), stockImages.current, 0);
      loadImg(getOpportunitySrc(0), opportunityImages.current, 0);
      loadImg(getOpportunitySrc(OPPORTUNITY_FRAMES - 1), opportunityImages.current, OPPORTUNITY_FRAMES - 1);

      // Initial forex batch
      const forexInitEnd = Math.min(INITIAL_BATCH, FOREX_FRAMES);
      await loadRange(1, forexInitEnd, forexImages.current, getForexSrc);
      if (cancelled) return;

      // Complete first half of forex
      let fi = forexInitEnd;
      while (fi < FOREX_FRAMES && !cancelled) {
        const end = Math.min(fi + BATCH_SIZE, FOREX_FRAMES);
        await loadRange(fi, end, forexImages.current, getForexSrc);
        fi = end;
        if (fi >= FOREX_FRAMES / 2) break;
      }

      // Stock initial batch parallel with remaining forex
      const stockInitEnd     = Math.min(INITIAL_BATCH, STOCK_FRAMES);
      const stockInitPromise = loadRange(1, stockInitEnd, stockImages.current, getStockSrc);
      while (fi < FOREX_FRAMES && !cancelled) {
        const end = Math.min(fi + BATCH_SIZE, FOREX_FRAMES);
        await loadRange(fi, end, forexImages.current, getForexSrc);
        fi = end;
      }
      await stockInitPromise;
      if (cancelled) return;

      // Complete stock
      let si = stockInitEnd;
      while (si < STOCK_FRAMES && !cancelled) {
        const end = Math.min(si + BATCH_SIZE, STOCK_FRAMES);
        await loadRange(si, end, stockImages.current, getStockSrc);
        si = end;
      }
      if (cancelled) return;

      // Opportunity initial batch
      const oppInitEnd = Math.min(INITIAL_BATCH, OPPORTUNITY_FRAMES);
      await loadRange(1, oppInitEnd, opportunityImages.current, getOpportunitySrc);
      if (cancelled) return;

      // Complete opportunity
      let oi = oppInitEnd;
      while (oi < OPPORTUNITY_FRAMES - 1 && !cancelled) {
        const end = Math.min(oi + BATCH_SIZE, OPPORTUNITY_FRAMES - 1);
        await loadRange(oi, end, opportunityImages.current, getOpportunitySrc);
        oi = end;
      }
    };

    run().catch(() => undefined);
    return () => { cancelled = true; };
  }, [cacheLayout, drawFrame, updateHUD]);

  useEffect(() => {
    const ro = new ResizeObserver(() => cacheLayout());
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [cacheLayout]);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (!entry.isIntersecting) stopLoop();
    }, { threshold: 0 });
    const el = containerRef.current;
    if (el) io.observe(el);
    return () => io.disconnect();
  }, [stopLoop]);

  useEffect(() => {
    if (lenis) {
      lenis.on('scroll', onScroll);
      return () => { lenis.off('scroll', onScroll); };
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lenis, onScroll]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      ref={containerRef}
      id="forex-sequence"
      aria-label="Forex, Stock Market and Opportunity Interactive Scroll Sequence"
      className="relative w-full z-20"
      style={{
        height: `${SCROLL_HEIGHT_VH}vh`,
        backgroundColor: 'transparent',
      }}
    >
      {/* Sticky cinematic viewport: 720 frames merge directly into the video hero */}
      <div
        ref={stickyViewportRef}
        className="sticky top-0 w-full overflow-hidden select-none z-20"
        style={{
          height: '100dvh',
          backgroundColor: '#050505',
          contain: 'layout paint',
        }}
      >
        {/* Layer 0: The IntelligenceHero with its video plate – blends directly with the last frame */}
        <div
          ref={heroContentRef}
          className="absolute inset-0 z-0"
          style={{ willChange: 'opacity', pointerEvents: 'none' }}
        >
          <IntelligenceHero />
        </div>

        {/* Layer 1: Single canvas – drawing surface for the 720 cinematic frames */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{
            display: 'block',
            imageRendering: 'auto',
            willChange: 'filter, opacity',
            transform: 'translateZ(0)',
          }}
        />



        {/* Layer 3: HUD and Editorial Overlays */}
        <div
          ref={hudContainerRef}
          className="relative z-30 w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 flex flex-col justify-between py-10 md:py-14 pointer-events-none"
          style={{ willChange: 'opacity' }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/35 bg-[#FAF6ED]/85 backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span ref={hudLabelRef} className="text-[11px] md:text-xs font-mono tracking-widest uppercase text-[#8C6D23] font-semibold">
                Asset Class 02 &bull; Foreign Exchange
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-black/10 bg-[#FAF6ED]/80 backdrop-blur-md shadow-xs">
              <span className="text-[11px] font-mono text-[#7A756D]">FRAME</span>
              <span ref={hudFrameRef} className="text-xs font-mono font-bold text-[#0E0F14] min-w-[28px] text-right">001</span>
              <span className="text-[10px] font-mono text-[#B0AAA0]">/</span>
              <span ref={hudTotalRef} className="text-[10px] font-mono text-[#B0AAA0]">240</span>
              <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden ml-1">
                <div ref={hudProgressRef} className="h-full bg-[#D4AF37] rounded-full" style={{ width: '0%', transition: 'none' }} />
              </div>
            </div>
          </div>

          {/* Overlay panels – stacked in a single grid cell to prevent layout shift */}
          <div className="grid grid-cols-1 justify-items-end text-right max-w-xl self-end">

            {/* Forex overlay */}
            <div
              ref={forexOverlayRef}
              className="col-start-1 row-start-1 flex flex-col items-end text-right"
              style={{ opacity: 1, willChange: 'opacity' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] uppercase tracking-widest mb-3">
                <span>The Global Reserve Market</span>
                <span className="w-6 h-px bg-[#D4AF37]" />
              </div>
              <h2
                className="font-display font-medium leading-[1.08] tracking-tight text-[#0E0F14] text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem]"
                style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', textShadow: '0 1px 18px rgba(255,255,255,0.6)' }}
              >
                And now, <br className="hidden sm:inline" />
                the global reserve, <br />
                <span className="italic font-normal text-[#B38728]">pure forex.</span>
              </h2>
              <p className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
                The foreign exchange market moves $7.5 trillion a day. Where central banks, sovereign wealth funds, and interbank algorithms dictate institutional order flow.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">EUR/USD &bull; 1.0842 <strong className="text-emerald-600">+0.12%</strong></span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">GBP/JPY &bull; 191.65 <strong className="text-rose-600">-0.34%</strong></span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">XAU/USD &bull; $2,384 <strong className="text-emerald-600">+0.87%</strong></span>
              </div>
            </div>

            {/* Stock Market overlay */}
            <div
              ref={stockOverlayRef}
              className="col-start-1 row-start-1 flex flex-col items-end text-right"
              style={{ opacity: 0, willChange: 'opacity' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] uppercase tracking-widest mb-3">
                <span>The Equity Arena</span>
                <span className="w-6 h-px bg-[#D4AF37]" />
              </div>
              <h2
                className="font-display font-medium leading-[1.08] tracking-tight text-[#0E0F14] text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem]"
                style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', textShadow: '0 1px 18px rgba(255,255,255,0.6)' }}
              >
                And then, <br className="hidden sm:inline" />
                the market floor, <br />
                <span className="italic font-normal text-[#B38728]">pure stocks.</span>
              </h2>
              <p className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
                Equities, indices, and the bull&ndash;bear cycle. Where institutional block orders, earnings catalysts, and central bank policy converge into price action.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">S&amp;P 500 &bull; 5,204 <strong className="text-emerald-600">+0.54%</strong></span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">NASDAQ &bull; 16,340 <strong className="text-emerald-600">+0.78%</strong></span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">GOLD &bull; $2,384 <strong className="text-emerald-600">+0.87%</strong></span>
              </div>
            </div>

            {/* Opportunity overlay */}
            <div
              ref={opportunityOverlayRef}
              className="col-start-1 row-start-1 flex flex-col items-end text-right"
              style={{ opacity: 0, willChange: 'opacity' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] uppercase tracking-widest mb-3">
                <span>Where It All Converges</span>
                <span className="w-6 h-px bg-[#D4AF37]" />
              </div>
              <h2
                className="font-display font-medium leading-[1.08] tracking-tight text-[#0E0F14] text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem]"
                style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', textShadow: '0 1px 18px rgba(255,255,255,0.6)' }}
              >
                This is <br className="hidden sm:inline" />
                your moment, <br />
                <span className="italic font-normal text-[#B38728]">the opportunity.</span>
              </h2>
              <p className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
                Every market. Every asset class. Every edge. The complete picture of how institutional capital moves — and how you position yourself inside it.
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">STRUCTURE &bull; ORDER FLOW</span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">RISK &bull; PSYCHOLOGY</span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">EXECUTION &bull; CONSISTENCY</span>
              </div>
            </div>

          </div>

          {/* Bottom hint */}
          <div className="flex items-end justify-between pt-4 border-t border-black/10">
            <div className="text-xs font-mono text-[#7A756D] tracking-wide">MOP &bull; 1920&times;1080 3D SEQUENCE</div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] font-medium">
              <span className="inline-block animate-bounce">↓</span>
              <span>SCROLL TO ADVANCE FRAMES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForexMarketScroll;
