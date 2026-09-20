'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useLenis } from '@/components/providers/LenisProvider';

const TOTAL_FRAMES = 240;

const getFrameSrc = (index: number) => {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `/assets/crypto/ezgif-frame-${frameNumber}.jpg`;
};

export function CryptoMarketScroll(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cached HTMLImageElements array
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));

  // Frame counter & HUD DOM refs (NO React state updates on scroll)
  const hudFrameRef = useRef<HTMLSpanElement>(null);
  const hudProgressRef = useRef<HTMLDivElement>(null);

  // Animation & scroll state refs
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);

  const lenis = useLenis();

  // ── 1. Pristine Native Canvas Drawing (NO CSS FILTERS / NO SCRIMS) ────────
  const drawFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Retrieve target image or nearest loaded neighbor
    let img: HTMLImageElement | null = imagesRef.current[frameIdx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let i = frameIdx - 1; i >= 0; i--) {
        if (imagesRef.current[i] && imagesRef.current[i]!.complete && imagesRef.current[i]!.naturalWidth > 0) {
          img = imagesRef.current[i];
          break;
        }
      }
      if (!img) {
        for (let i = frameIdx + 1; i < TOTAL_FRAMES; i++) {
          if (imagesRef.current[i] && imagesRef.current[i]!.complete && imagesRef.current[i]!.naturalWidth > 0) {
            img = imagesRef.current[i];
            break;
          }
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Unadulterated native drawing settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Aspect-ratio cover centering
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const dw = iw * ratio;
    const dh = ih * ratio;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  }, []);

  // ── 2. Resize Canvas with High-DPI Retina Support ─────────────────────────
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const frameToDraw = lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0;
    drawFrame(frameToDraw);
  }, [drawFrame]);

  // ── 3. Optimized Concurrent Preloader with GPU decode() ───────────────────
  useEffect(() => {
    let isCancelled = false;

    // Load initial frame immediately
    const frame0 = new Image();
    frame0.src = getFrameSrc(0);
    frame0.onload = async () => {
      if (isCancelled) return;
      try {
        if ('decode' in frame0) await frame0.decode();
      } catch (_) {}
      imagesRef.current[0] = frame0;
      handleResize();
      drawFrame(0);
      lastDrawnFrameRef.current = 0;
    };

    // Preload remaining frames in batches of 10
    const BATCH_SIZE = 10;
    let idx = 1;

    const loadBatch = () => {
      if (isCancelled || idx >= TOTAL_FRAMES) return;
      const batchPromises: Promise<void>[] = [];
      const end = Math.min(idx + BATCH_SIZE, TOTAL_FRAMES);

      for (let i = idx; i < end; i++) {
        const frameIdx = i;
        const p = new Promise<void>((resolve) => {
          const img = new Image();
          img.src = getFrameSrc(frameIdx);
          img.onload = async () => {
            if (isCancelled) return resolve();
            try {
              if ('decode' in img) await img.decode();
            } catch (_) {}
            imagesRef.current[frameIdx] = img;
            resolve();
          };
          img.onerror = () => resolve();
        });
        batchPromises.push(p);
      }

      idx = end;
      Promise.all(batchPromises).then(() => {
        if (!isCancelled) loadBatch();
      });
    };

    loadBatch();

    return () => {
      isCancelled = true;
    };
  }, [drawFrame, handleResize]);

  // ── 4. Precise Sticky Scroll Calculation ──────────────────────────────────
  const updateScrollProgress = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const windowH = window.innerHeight;
    const scrollableDistance = rect.height - windowH;

    if (scrollableDistance <= 0) return;

    // Distance scrolled while sticky in the viewport
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

    // Target frame between 0 and 239
    targetFrameRef.current = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(progress * TOTAL_FRAMES))
    );

    // Update HUD progress bar directly without React re-renders
    if (hudProgressRef.current) {
      hudProgressRef.current.style.width = `${Math.round(progress * 100)}%`;
    }
  }, []);

  useEffect(() => {
    const onScroll = () => updateScrollProgress();

    if (lenis) {
      lenis.on('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    updateScrollProgress();
    handleResize();

    return () => {
      if (lenis) {
        lenis.off('scroll', onScroll);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [lenis, updateScrollProgress, handleResize]);

  // ── 5. RAF Animation Loop: Buttery Frame-by-Frame Scrubbing ───────────────
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      // Smooth lerp towards target frame for fluid control
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.05) {
        currentFrameRef.current += diff * 0.28;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const frameToDraw = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentFrameRef.current))
      );

      if (frameToDraw !== lastDrawnFrameRef.current) {
        drawFrame(frameToDraw);
        lastDrawnFrameRef.current = frameToDraw;

        if (hudFrameRef.current) {
          hudFrameRef.current.textContent = String(frameToDraw + 1).padStart(3, '0');
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [drawFrame]);

  return (
    <section
      ref={containerRef}
      id="crypto-sequence"
      aria-label="Crypto Market Interactive Scroll Sequence"
      className="relative w-full"
      style={{
        // 450vh runway provides ample scroll depth for 240 frames to advance one by one
        height: '450vh',
        backgroundColor: '#EFE7DC',
      }}
    >
      {/* ── Sticky Pinned Viewport (Sticks at top: 0 while frames advance) ───── */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center select-none"
        style={{
          backgroundColor: '#EFE7DC',
        }}
      >
        {/* Full-screen Canvas: 100% PRISTINE NATIVE QUALITY — NO CSS FILTERS */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          style={{
            // Guaranteed no muddying filters or contrast manipulation
            filter: 'none',
            imageRendering: 'auto',
          }}
        />

        {/* ── Clean Editorial Typography Overlay ───────────────────────────── */}
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 flex flex-col justify-between py-10 md:py-14 pointer-events-none">
          {/* Top Bar / Category Tag + Frame Counter */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/35 bg-[#FAF6ED]/85 backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[11px] md:text-xs font-mono tracking-widest uppercase text-[#8C6D23] font-semibold">
                Asset Class 01 • Cryptocurrency
              </span>
            </div>

            {/* Frame Scrubber Counter */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-black/10 bg-[#FAF6ED]/80 backdrop-blur-md shadow-xs">
              <span className="text-[11px] font-mono text-[#7A756D]">FRAME</span>
              <span ref={hudFrameRef} className="text-xs font-mono font-bold text-[#0E0F14] min-w-[28px] text-right">
                001
              </span>
              <span className="text-[11px] font-mono text-[#B0AAA0]">/ 240</span>
              <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden ml-1">
                <div
                  ref={hudProgressRef}
                  className="h-full bg-[#D4AF37] rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Right-Side Editorial Headline (Positioned in Open Negative Space) */}
          <div className="flex flex-col items-end text-right max-w-xl self-end">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] uppercase tracking-widest mb-3">
              <span>The Inaugural Asset Class</span>
              <span className="w-6 h-px bg-[#D4AF37]" />
            </div>

            {/* Exact User Requested Heading */}
            <h2
              className="font-display font-medium leading-[1.08] tracking-tight text-[#0E0F14] text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem]"
              style={{
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                textShadow: '0 1px 18px rgba(255,255,255,0.6)',
              }}
            >
              Let me introduce you <br className="hidden sm:inline" />
              to the market, <br />
              <span className="italic font-normal text-[#B38728] relative inline-block">
                first crypto.
              </span>
            </h2>

            <p className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
              Where 24/7 algorithmic volatility, perpetual order flow, and global liquidity pools converge. The foundation every modern institutional trader masters.
            </p>

            {/* Live Asset Badges */}
            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">
                BTC • $64,280 <strong className="text-emerald-600">+3.4%</strong>
              </span>
              <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">
                ETH • $3,450 <strong className="text-emerald-600">+2.8%</strong>
              </span>
              <span className="px-3 py-1 rounded-md border border-[#D4AF37]/30 bg-[#FAF6ED]/90 text-[11px] font-mono text-[#38332B] shadow-xs">
                SOL • $148 <strong className="text-emerald-600">+5.1%</strong>
              </span>
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="flex items-end justify-between pt-4 border-t border-black/10">
            <div className="text-xs font-mono text-[#7A756D] tracking-wide">
              MOP • 1920×1080 3D SEQUENCE
            </div>
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

export default CryptoMarketScroll;
