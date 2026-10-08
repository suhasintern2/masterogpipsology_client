'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useLenis } from '@/components/providers/LenisProvider';

// ── Tunable constants ────────────────────────────────────────────────────────
const TOTAL_FRAMES = 240;
// Exponential-damping strength. Higher = snappier. Lower = floatier.
// At 10 the animation settles in ~230 ms regardless of screen refresh rate.
const SMOOTHING = 10;
// Preload the first N frames before any scroll (first visible batch).
const INITIAL_BATCH = 30;
// Background batch size after initial load.
const BATCH_SIZE = 8;
// DPR cap – 2 covers all Retina/HiDPI screens without tripling memory.
const DPR_CAP = 2;

const getFrameSrc = (index: number): string => {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `/assets/crypto/ezgif-frame-${frameNumber}.jpg`;
};

export function CryptoMarketScroll(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Image cache
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));

  // HUD refs – written directly, never via React state
  const hudFrameRef = useRef<HTMLSpanElement>(null);
  const hudProgressRef = useRef<HTMLDivElement>(null);

  // Scroll / animation state – all refs, zero React re-renders on scroll
  const targetProgressRef = useRef<number>(0);   // 0..1 raw scroll progress
  const currentProgressRef = useRef<number>(0);  // eased progress
  const lastDrawnFrameRef = useRef<number>(-1);
  const lastRafTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(false);

  // Layout cache – populated once by ResizeObserver, never read in scroll path
  const sectionTopRef = useRef<number>(0);
  const sectionHeightRef = useRef<number>(0);

  const lenis = useLenis();

  // ── Detect prefers-reduced-motion ──────────────────────────────────────────
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. Draw frame – DPR-aware, sub-pixel-free, smoothing re-applied ────────
  const drawFrame = useCallback((frameIdx: number): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // getContext with alpha:false lets the GPU skip compositing
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Find nearest loaded frame (prefer backward, then forward)
    let img: HTMLImageElement | null = imagesRef.current[frameIdx];
    if (!img?.complete || !img.naturalWidth) {
      for (let i = frameIdx - 1; i >= 0; i--) {
        const candidate = imagesRef.current[i];
        if (candidate?.complete && candidate.naturalWidth) { img = candidate; break; }
      }
    }
    if (!img?.complete || !img.naturalWidth) {
      for (let i = frameIdx + 1; i < TOTAL_FRAMES; i++) {
        const candidate = imagesRef.current[i];
        if (candidate?.complete && candidate.naturalWidth) { img = candidate; break; }
      }
    }
    if (!img?.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Re-apply after every draw (canvas context resets these on resize)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Cover-fit with integer coordinates to avoid sub-pixel blur
    const ratio = Math.max(cw / iw, ch / ih);
    const dw = Math.round(iw * ratio);
    const dh = Math.round(ih * ratio);
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2);

    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  }, []);

  // ── 2. Resize canvas via ResizeObserver – sets backing buffer then redraws ─
  const syncCanvasSize = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      // Re-apply smoothing immediately after resize (resize resets context state)
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    }
    const frame = lastDrawnFrameRef.current >= 0 ? lastDrawnFrameRef.current : 0;
    drawFrame(frame);
  }, [drawFrame]);

  // ── 3. Cache layout values – called by ResizeObserver, never in scroll path ─
  const cacheLayout = useCallback((): void => {
    const el = containerRef.current;
    if (!el) return;
    // Use getBoundingClientRect + scrollY to get absolute top
    const rect = el.getBoundingClientRect();
    sectionTopRef.current = rect.top + window.scrollY;
    sectionHeightRef.current = rect.height;
    syncCanvasSize();
  }, [syncCanvasSize]);

  // ── 4. rAF loop – frame-rate-independent exponential damping ───────────────
  const startLoop = useCallback((): void => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    lastRafTimeRef.current = performance.now();

    const loop = (now: number): void => {
      const rawDt = (now - lastRafTimeRef.current) / 1000;
      // Clamp dt to avoid giant jumps after tab switches
      const dt = Math.min(rawDt, 0.05);
      lastRafTimeRef.current = now;

      const target = targetProgressRef.current;
      let current = currentProgressRef.current;

      if (prefersReducedMotion) {
        // Skip easing entirely – jump to target
        current = target;
      } else {
        // Frame-rate-independent exponential ease: settles identically at 60 Hz and 120 Hz
        current += (target - current) * (1 - Math.exp(-dt * SMOOTHING));
      }
      currentProgressRef.current = current;

      // Map progress to integer frame index
      const frameIdx = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(current * (TOTAL_FRAMES - 1)))
      );

      if (frameIdx !== lastDrawnFrameRef.current) {
        drawFrame(frameIdx);
        lastDrawnFrameRef.current = frameIdx;
        if (hudFrameRef.current) {
          hudFrameRef.current.textContent = String(frameIdx + 1).padStart(3, '0');
        }
      }

      // Stop the loop when converged (saves GPU power while idle)
      if (Math.abs(target - current) < 0.0001) {
        isRunningRef.current = false;
        return;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
  }, [drawFrame, prefersReducedMotion]);

  const stopLoop = useCallback((): void => {
    cancelAnimationFrame(rafIdRef.current);
    isRunningRef.current = false;
  }, []);

  // ── 5. Scroll handler – reads only cached values, no layout reads ──────────
  const onScroll = useCallback((): void => {
    const scrollY = window.scrollY;
    const top = sectionTopRef.current;
    const height = sectionHeightRef.current;
    const viewportH = window.innerHeight;
    const scrollable = height - viewportH;
    if (scrollable <= 0) return;

    const scrolled = scrollY - top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollable));
    targetProgressRef.current = progress;

    // Update progress bar directly (no React re-render)
    if (hudProgressRef.current) {
      hudProgressRef.current.style.width = `${Math.round(progress * 100)}%`;
    }

    // Restart the rAF loop if it has settled
    if (isVisibleRef.current) startLoop();
  }, [startLoop]);

  // ── 6. Preloader – initial batch fast, rest in background ─────────────────
  useEffect(() => {
    let cancelled = false;

    const loadFrame = (idx: number): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = getFrameSrc(idx);
        img.onload = async () => {
          if (cancelled) return resolve();
          try { if ('decode' in img) await img.decode(); } catch (_) { /* ignore */ }
          imagesRef.current[idx] = img;
          resolve();
        };
        img.onerror = () => resolve();
      });

    const loadRange = (start: number, end: number): Promise<void> => {
      const batch: Promise<void>[] = [];
      for (let i = start; i < end; i++) batch.push(loadFrame(i));
      return Promise.all(batch).then(() => undefined);
    };

    const run = async (): Promise<void> => {
      // Load first INITIAL_BATCH frames and draw frame 0 as soon as possible
      await loadFrame(0);
      if (cancelled) return;
      imagesRef.current[0] = imagesRef.current[0]; // already set
      cacheLayout();
      drawFrame(0);
      lastDrawnFrameRef.current = 0;

      // Load remaining initial batch
      const firstBatchEnd = Math.min(INITIAL_BATCH, TOTAL_FRAMES);
      await loadRange(1, firstBatchEnd);
      if (cancelled) return;

      // Load the rest in small background batches
      let idx = firstBatchEnd;
      while (idx < TOTAL_FRAMES && !cancelled) {
        const end = Math.min(idx + BATCH_SIZE, TOTAL_FRAMES);
        await loadRange(idx, end);
        idx = end;
      }
    };

    run().catch(() => undefined);
    return () => { cancelled = true; };
  }, [cacheLayout, drawFrame]);

  // ── 7. ResizeObserver – caches layout, resizes canvas ─────────────────────
  useEffect(() => {
    const ro = new ResizeObserver(() => cacheLayout());
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [cacheLayout]);

  // ── 8. IntersectionObserver – pause loop when section is off-screen ────────
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) stopLoop();
      },
      { threshold: 0 }
    );
    const el = containerRef.current;
    if (el) io.observe(el);
    return () => io.disconnect();
  }, [stopLoop]);

  // ── 9. Scroll listeners – Lenis primary, native fallback ─────────────────
  useEffect(() => {
    // Only attach native listener as fallback when Lenis is absent
    if (lenis) {
      lenis.on('scroll', onScroll);
      return () => { lenis.off('scroll', onScroll); };
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lenis, onScroll]);

  // ── 10. Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => () => stopLoop(), [stopLoop]);

  return (
    <section
      ref={containerRef}
      id="crypto-sequence"
      aria-label="Crypto Market Interactive Scroll Sequence"
      className="relative w-full"
      style={{ height: '450vh', backgroundColor: '#EFE7DC' }}
    >
      {/* Sticky viewport – contain: layout paint avoids unnecessary compositing */}
      <div
        className="sticky top-0 w-full overflow-hidden select-none"
        style={{
          height: '100dvh',
          backgroundColor: '#EFE7DC',
          contain: 'layout paint',
        }}
      >
        {/* Canvas fills the sticky wrapper exactly */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ display: 'block', imageRendering: 'auto' }}
        />

        {/* Editorial overlay – transform/opacity only, no layout properties */}
        <div
          className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 flex flex-col justify-between py-10 md:py-14 pointer-events-none"
          style={{ willChange: 'transform' }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#D4AF37]/35 bg-[#FAF6ED]/85 backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[11px] md:text-xs font-mono tracking-widest uppercase text-[#8C6D23] font-semibold">
                Asset Class 01 • Cryptocurrency
              </span>
            </div>

            {/* Frame counter HUD */}
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-black/10 bg-[#FAF6ED]/80 backdrop-blur-md shadow-xs">
              <span className="text-[11px] font-mono text-[#7A756D]">FRAME</span>
              <span ref={hudFrameRef} className="text-xs font-mono font-bold text-[#0E0F14] min-w-[28px] text-right">
                001
              </span>
              <span className="text-[11px] font-mono text-[#B0AAA0]">/ 240</span>
              <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden ml-1">
                <div ref={hudProgressRef} className="h-full bg-[#D4AF37] rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="flex flex-col items-end text-right max-w-xl self-end">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8C6D23] uppercase tracking-widest mb-3">
              <span>The Inaugural Asset Class</span>
              <span className="w-6 h-px bg-[#D4AF37]" />
            </div>
            <h2
              className="font-display font-medium leading-[1.08] tracking-tight text-[#0E0F14] text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem]"
              style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', textShadow: '0 1px 18px rgba(255,255,255,0.6)' }}
            >
              Let me introduce you <br className="hidden sm:inline" />
              to the market, <br />
              <span className="italic font-normal text-[#B38728]">first crypto.</span>
            </h2>
            <p className="mt-4 md:mt-6 text-sm md:text-base font-body text-[#524C42] leading-relaxed max-w-md">
              Where 24/7 algorithmic volatility, perpetual order flow, and global liquidity pools converge. The foundation every modern institutional trader masters.
            </p>
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

          {/* Bottom hint */}
          <div className="flex items-end justify-between pt-4 border-t border-black/10">
            <div className="text-xs font-mono text-[#7A756D] tracking-wide">MOP • 1920×1080 3D SEQUENCE</div>
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
