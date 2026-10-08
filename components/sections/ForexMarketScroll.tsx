'use client';

import React, { useRef } from 'react';
import { useFrameSequence, type FrameSequenceUpdate } from '@/components/hooks/useFrameSequence';
import { IntelligenceHero } from '@/components/sections/IntelligenceHero';

// ── Tunable constants ────────────────────────────────────────────────────────
const FOREX_FRAMES       = 240;
const STOCK_FRAMES       = 240;
const OPPORTUNITY_FRAMES = 240;
const TOTAL_FRAMES       = FOREX_FRAMES + STOCK_FRAMES + OPPORTUNITY_FRAMES; // 720

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

const SOURCES = SEQUENCES.map((s) => ({ count: s.frames, src: s.getSrc }));
const PINNED = [0, 239, 240, 479, 480, 719] as const;
const frameForProgress = (p: number, total: number): number =>
  p < FRAME_SCROLL_PORTION
    ? Math.min(total - 1, Math.max(0, Math.floor((p / FRAME_SCROLL_PORTION) * total)))
    : total - 1;

// ── Component ────────────────────────────────────────────────────────────────
export function ForexMarketScroll(): React.ReactElement {
  // Transition layers
  const heroContentRef  = useRef<HTMLDivElement>(null);
  const hudContainerRef = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement | null>(null);
  const videoStateRef   = useRef<'play' | 'pause'>('pause');
  const armedRef        = useRef<boolean>(false);

  // HUD and overlay refs
  const hudLabelRef    = useRef<HTMLSpanElement>(null);
  const hudFrameRef    = useRef<HTMLSpanElement>(null);
  const hudTotalRef    = useRef<HTMLSpanElement>(null);
  const hudProgressRef = useRef<HTMLDivElement>(null);

  const forexOverlayRef       = useRef<HTMLDivElement>(null);
  const stockOverlayRef       = useRef<HTMLDivElement>(null);
  const opportunityOverlayRef = useRef<HTMLDivElement>(null);

  // Last written value per DOM property: every write is skipped unless it changed.
  const last = useRef<Record<string, string>>({});
  const put = (key: string, value: string, apply: (v: string) => void): void => {
    if (last.current[key] !== value) {
      last.current[key] = value;
      apply(value);
    }
  };

  const getVideo = (): HTMLVideoElement | null => {
    if (!videoRef.current) videoRef.current = heroContentRef.current?.querySelector('video') ?? null;
    return videoRef.current;
  };

  const setVideoState = (want: 'play' | 'pause'): void => {
    const video = getVideo();
    if (!video || videoStateRef.current === want) return;
    videoStateRef.current = want;
    if (want === 'play') {
      video.play().catch(() => { videoStateRef.current = 'pause'; });
    } else {
      video.pause();
    }
  };

  const onUpdate = ({ progress, frame }: FrameSequenceUpdate): void => {
    const globalIdx = frame;
    const { seq, localIdx } = resolveSeq(globalIdx);

    // ── HUD text ──────────────────────────────────────────────────────────
    put('hudFrame', String(localIdx + 1).padStart(3, '0'), (v) => { if (hudFrameRef.current) hudFrameRef.current.textContent = v; });
    put('hudTotal', String(seq.frames), (v) => { if (hudTotalRef.current) hudTotalRef.current.textContent = v; });
    put('hudLabel', seq.label, (v) => { if (hudLabelRef.current) hudLabelRef.current.textContent = v; });
    const hp = localIdx / Math.max(seq.frames - 1, 1);
    put('hudWidth', `${Math.round(hp * 100)}%`, (v) => { if (hudProgressRef.current) hudProgressRef.current.style.width = v; });

    // ── Overlay opacities (deterministic from global frame) ───────────────
    let forexOp = 0;
    let stockOp = 0;
    let oppOp   = 0;

    if (globalIdx < 240) {
      forexOp = globalIdx > 215 ? Math.max(0, 1 - (globalIdx - 215) / 24) : 1;
    } else if (globalIdx < 480) {
      if (globalIdx < 265) {
        stockOp = (globalIdx - 240) / 25;
      } else if (globalIdx > 455) {
        stockOp = Math.max(0, 1 - (globalIdx - 455) / 24);
      } else {
        stockOp = 1;
      }
    } else {
      if (globalIdx < 505) {
        oppOp = (globalIdx - 480) / 25;
      } else if (globalIdx > 660) {
        oppOp = Math.max(0, 1 - (globalIdx - 660) / 45);
      } else {
        oppOp = 1;
      }
    }

    // Fade entire HUD out cleanly as doorway frame settles
    let hudMasterOp = 1;
    if (progress > 0.68) {
      hudMasterOp = Math.max(0, 1 - (progress - 0.68) / 0.05);
    }

    put('forexOp', (forexOp * hudMasterOp).toFixed(3), (v) => { if (forexOverlayRef.current) forexOverlayRef.current.style.opacity = v; });
    put('stockOp', (stockOp * hudMasterOp).toFixed(3), (v) => { if (stockOverlayRef.current) stockOverlayRef.current.style.opacity = v; });
    put('oppOp', (oppOp * hudMasterOp).toFixed(3), (v) => { if (opportunityOverlayRef.current) opportunityOverlayRef.current.style.opacity = v; });
    put('hudOp', hudMasterOp.toFixed(3), (v) => { if (hudContainerRef.current) hudContainerRef.current.style.opacity = v; });

    // ── Doorway-to-video blend ─────────────────────────────────────────────
    const canvas = canvasRef.current;
    const heroContent = heroContentRef.current;
    if (canvas && heroContent) {
      if (progress <= 0.73) {
        // 0.00 .. 0.73: normal playback, then settle on the sharp doorway frame
        put('filter', 'none', (v) => { canvas.style.filter = v; });
        put('opacity', '1', (v) => { canvas.style.opacity = v; });
        put('pe', 'none', (v) => { heroContent.style.pointerEvents = v; });
      } else {
        // 0.73 .. 0.88: doorway frame vanishes into the dark video with zero light bloom
        const t = Math.max(0, Math.min(1, (progress - 0.73) / 0.15));
        const blurPx = Math.min(24, t * 36);
        const brightnessVal = Math.max(0.1, 1 - t * 0.9);
        put(
          'filter',
          blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px) brightness(${brightnessVal.toFixed(2)})` : 'none',
          (v) => { canvas.style.filter = v; },
        );
        put('opacity', Math.max(0, 1 - t).toFixed(3), (v) => { canvas.style.opacity = v; });
        put('pe', t >= 0.90 ? 'auto' : 'none', (v) => { heroContent.style.pointerEvents = v; });
      }
      // The canvas is opaque before 0.73, so the hero layer can stay hidden until then.
      put('vis', progress >= 0.70 ? 'visible' : 'hidden', (v) => { heroContent.style.visibility = v; });
    }

    // ── Background video: arm late, play only near the doorway ────────────
    const video = getVideo();
    if (video) {
      if (progress >= 0.45 && !armedRef.current) {
        armedRef.current = true;
        video.preload = 'auto';
        video.load();
      }
      if (progress >= 0.62) setVideoState('play');
      else if (progress < 0.55) setVideoState('pause');
    }
  };

  const onActiveChange = (visible: boolean): void => {
    if (!visible) setVideoState('pause');
  };

  const { sectionRef, stickyRef, canvasRef } = useFrameSequence({
    sources: SOURCES,
    pinned: PINNED,
    frameForProgress,
    background: '#050505',
    onUpdate,
    onActiveChange,
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
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
        ref={stickyRef}
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
          style={{ pointerEvents: 'none', visibility: 'hidden' }}
        >
          <IntelligenceHero autoPlayVideo={false} videoPreload="none" />
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
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/35 bg-[#FAF6ED]/92 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] motion-safe:animate-pulse" />
              <span ref={hudLabelRef} className="text-[11px] md:text-xs font-mono tracking-widest uppercase text-[#8C6D23] font-semibold">
                Asset Class 02 &bull; Foreign Exchange
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-black/10 bg-[#FAF6ED]/92 shadow-xs">
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
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">EUR/USD &bull; MAJOR</span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">GBP/JPY &bull; CROSS</span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">XAU/USD &bull; GOLD</span>
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
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">S&amp;P 500 &bull; INDEX</span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">NASDAQ &bull; INDEX</span>
                <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">GOLD &bull; COMMODITY</span>
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
              <span className="inline-block motion-safe:animate-bounce">↓</span>
              <span>SCROLL TO ADVANCE FRAMES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForexMarketScroll;
