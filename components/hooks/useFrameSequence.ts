'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useLenis } from '@/components/providers/LenisProvider';
import { onEveryFrame } from '@/lib/frame-loop';
import { FrameSequenceEngine } from '@/lib/frame-sequence/engine';
import { damp, sectionProgress } from '@/lib/frame-sequence/math';

export interface FrameSource {
  count: number;
  src: (localIndex: number) => string;
}

export interface FrameSequenceUpdate {
  progress: number;
  frame: number;
  shownFrame: number;
}

export interface UseFrameSequenceOptions {
  /** Concatenated into one global index space. Pass a module-level constant. */
  sources: readonly FrameSource[];
  /** Integer 0..total-1 */
  frameForProgress: (progress: number, total: number) => number;
  /** Global indices fetched first and never evicted. */
  pinned?: readonly number[];
  background: string;
  /** Damping rate, used ONLY when Lenis is inactive and motion is allowed. Default 12. */
  smoothing?: number;
  /** Every rendered tick while visible. Must guard its own DOM writes. */
  onUpdate?: (u: FrameSequenceUpdate) => void;
  onActiveChange?: (visible: boolean) => void;
  prefetchMargin?: string;
  decodeMargin?: string;
}

export interface FrameSequenceRefs {
  sectionRef: RefObject<HTMLElement | null>;
  stickyRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

interface Layout {
  top: number;
  height: number;
  viewportH: number;
}

export function useFrameSequence(options: UseFrameSequenceOptions): FrameSequenceRefs {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const optsRef = useRef<UseFrameSequenceOptions>(options);
  const lenisRef = useRef<ReturnType<typeof useLenis>>(null);
  const nativeScrollRef = useRef(0);
  const reducedRef = useRef(false);
  const layoutRef = useRef<Layout>({ top: 0, height: 0, viewportH: 0 });
  const progressRef = useRef(0);

  const lenis = useLenis();

  useEffect(() => {
    optsRef.current = options;
  });

  // Scroll source: Lenis when active, otherwise a cached native scrollY (no layout read per tick).
  useEffect(() => {
    lenisRef.current = lenis;
    if (lenis) return;
    nativeScrollRef.current = window.scrollY;
    const onScroll = (): void => {
      nativeScrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lenis]);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    if (!section || !sticky || !canvas) return;

    const sources = optsRef.current.sources;
    const urls: string[] = [];
    for (const s of sources) {
      for (let i = 0; i < s.count; i++) urls.push(s.src(i));
    }
    const engine = new FrameSequenceEngine({
      urls,
      pinned: optsRef.current.pinned ?? [],
      background: optsRef.current.background,
    });
    engine.attachCanvas(canvas);

    // Reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = mq.matches;
    const onMq = (e: MediaQueryListEvent): void => {
      reducedRef.current = e.matches;
    };
    mq.addEventListener('change', onMq);

    // The only layout read in the hook.
    const measure = (): void => {
      const rect = section.getBoundingClientRect();
      const layout = layoutRef.current;
      layout.top = rect.top + window.scrollY;
      layout.height = rect.height;
      layout.viewportH = sticky.clientHeight;
      engine.resize(sticky.clientWidth, sticky.clientHeight, window.devicePixelRatio || 1);
    };

    const currentScroll = (): number => {
      const l = lenisRef.current;
      return l ? l.scroll : nativeScrollRef.current;
    };

    const targetProgress = (): number => {
      const L = layoutRef.current;
      return sectionProgress(currentScroll(), L.top, L.height, L.viewportH);
    };

    const tick = (_ts: number, deltaMs: number): void => {
      const opts = optsRef.current;
      const target = targetProgress();
      const rate = reducedRef.current || lenisRef.current ? 0 : (opts.smoothing ?? 12);
      const p = damp(progressRef.current, target, rate, Math.min(deltaMs / 1000, 0.05));
      progressRef.current = p;
      const frame = opts.frameForProgress(p, engine.total);
      const shown = engine.update(frame);
      opts.onUpdate?.({ progress: p, frame, shownFrame: shown });
    };

    let unsub: (() => void) | null = null;

    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(sticky);
    ro.observe(document.body);
    measure();

    const prefetchIO = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          engine.setFullFetch(true);
          prefetchIO.disconnect();
        }
      },
      { rootMargin: optsRef.current.prefetchMargin ?? '200% 0px 200% 0px' },
    );
    prefetchIO.observe(section);

    const decodeIO = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) engine.setDecodeEnabled(last.isIntersecting);
      },
      { rootMargin: optsRef.current.decodeMargin ?? '100% 0px 100% 0px' },
    );
    decodeIO.observe(section);

    const activeIO = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (!last) return;
        if (last.isIntersecting) {
          if (unsub) return;
          progressRef.current = targetProgress(); // snap: no catch-up from a stale value
          unsub = onEveryFrame(tick, 'render');
          tick(0, 16);
          optsRef.current.onActiveChange?.(true);
        } else if (unsub) {
          tick(0, 16); // apply the final 0 or 1 end state
          unsub();
          unsub = null;
          optsRef.current.onActiveChange?.(false);
        }
      },
      { rootMargin: '0px' },
    );
    activeIO.observe(section);

    // Keep frame requests behind the hero LCP.
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => engine.start(), { timeout: 500 });
    } else {
      timeoutId = setTimeout(() => engine.start(), 200);
    }

    return () => {
      if (unsub) {
        unsub();
        unsub = null;
      }
      ro.disconnect();
      prefetchIO.disconnect();
      decodeIO.disconnect();
      activeIO.disconnect();
      mq.removeEventListener('change', onMq);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      engine.destroy();
    };
  }, []);

  return { sectionRef, stickyRef, canvasRef };
}
