'use client';

import React, { useRef, useCallback } from 'react';
import { useFrameSequence, type FrameSequenceUpdate } from '@/components/hooks/useFrameSequence';
import { useStepScroll, type StepScrollOptions } from '@/components/hooks/useStepScroll';
import { loadProgress } from '@/lib/load-progress';
import { DepthStage } from '@/components/sections/DepthStage';
import { ScrollCaptions, type CaptionDriver } from '@/components/sections/ScrollCaptions';
import { CryptoSlabs, type SlabDriver } from '@/components/sections/CryptoSlabs';
import { CRYPTO_FLOW } from '@/lib/scroll-captions';
import { CRYPTO_STOPS_RAW, knotProgress, framePos, stopListIndex, handoffEndY } from '@/lib/step-scroll';
import { railU } from '@/lib/crypto-slabs';
import {
  buildFrameSet,
  warmFirstFrame,
  warmIndices,
  FRAMES_PER_SEQ,
  SEQ_SCROLL_VH,
  FOREX_OVERLAP_VH,
  UNIQUE_LOCAL,
  UNIQUE_PER_SEQ,
  type FrameSet,
  type FrameTier,
} from '@/lib/frame-sequence/sources';

// ── Tunable constants ────────────────────────────────────────────────────────
const TOTAL_FRAMES = UNIQUE_PER_SEQ; // 192 unique of 240

const urlsFor = (tier: FrameTier): FrameSet => buildFrameSet(['crypto'], tier, FRAMES_PER_SEQ, UNIQUE_LOCAL);
const CRYPTO_STOP_INDICES: readonly number[] = CRYPTO_STOPS_RAW.map((r) => stopListIndex(r, UNIQUE_LOCAL)); // [0, 89, 110, 142]
const CRYPTO_KNOT_IDX = CRYPTO_STOP_INDICES[CRYPTO_STOP_INDICES.length - 1]; // 142 = raw 179, the hand-off stop
// raw 179 is shown exactly where ForexFade starts (Crypto top + 250vh); raw 180-240 keep playing under the fade.
const CRYPTO_KNOT_P = knotProgress(SEQ_SCROLL_VH, FOREX_OVERLAP_VH); // 5/7
const CRYPTO_STEP: StepScrollOptions = {
  stops: CRYPTO_STOP_INDICES, total: TOTAL_FRAMES, knotP: CRYPTO_KNOT_P,
  tail: (l) => handoffEndY(l.top, l.height, SEQ_SCROLL_VH, FOREX_OVERLAP_VH), // slab 4: 179 -> Forex frame 1 (fade complete)
};
// Every landing frame (and the last frame) fetched first and never evicted.
const PINNED: readonly number[] = [...CRYPTO_STOP_INDICES, TOTAL_FRAMES - 1]; // [0, 89, 110, 142, 191]
// First 24 frames, then every 8th: a coarse fallback exists before the full fetch starts.
const CRYPTO_WARM = warmIndices(TOTAL_FRAMES);
if (typeof window !== 'undefined') {
  loadProgress.register('crypto-first-frame', 0.15);
  warmFirstFrame('crypto');
}

export function CryptoMarketScroll(): React.ReactElement {
  // HUD refs – written directly, never via React state
  const hudFrameRef = useRef<HTMLSpanElement>(null);
  const hudProgressRef = useRef<HTMLDivElement>(null);
  const lastHud = useRef({ frame: -1, pct: -1 });
  const progressRef = useRef(0);
  const captionRef: CaptionDriver = useRef(null);
  const slabRef: SlabDriver = useRef(null);

  const step = useStepScroll(CRYPTO_STEP);
  // Fractional: the engine blends the two neighbouring frames. Knot at the last stop (raw 179); exact stop frame at rest.
  const frameForProgress = useCallback(
    (p: number, total: number): number => step.frameFor(framePos(p, total, CRYPTO_KNOT_IDX, CRYPTO_KNOT_P)),
    [step],
  );

  const onUpdate = useCallback(
    (u: FrameSequenceUpdate): void => {
      progressRef.current = u.progress;
      const s = step.coord(u.scroll);
      captionRef.current?.(railU(s));
      slabRef.current?.(s);
      const last = lastHud.current;
      if (u.frame !== last.frame) {
        last.frame = u.frame;
        if (hudFrameRef.current) hudFrameRef.current.textContent = String((UNIQUE_LOCAL[u.frame] ?? u.frame) + 1).padStart(3, '0');
      }
      const pct = Math.round(u.progress * 100);
      if (pct !== last.pct) {
        last.pct = pct;
        if (hudProgressRef.current) hudProgressRef.current.style.transform = `scaleX(${pct / 100})`;
      }
    },
    [step],
  );

  const { sectionRef, stickyRef, canvasRef } = useFrameSequence({
    urlsFor,
    pinned: PINNED,
    warm: CRYPTO_WARM,
    frameForProgress,
    background: '#EFE7DC',
    onUpdate,
    onLayout: step.onLayout,
    onFrameReady: (i) => {
      if (i === 0) loadProgress.complete('crypto-first-frame');
    },
  });

  return (
    <section
      ref={sectionRef}
      id="crypto-sequence"
      aria-label="Crypto Market Interactive Scroll Sequence"
      className="relative w-full"
      style={{ height: `${SEQ_SCROLL_VH + 100}vh`, backgroundColor: '#EFE7DC' }}
    >
      {/* Sticky viewport – contain: layout paint avoids unnecessary compositing */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full overflow-hidden select-none"
        style={{
          height: '100dvh',
          backgroundColor: '#EFE7DC',
          contain: 'layout paint',
        }}
      >
        {/* Canvas fills the sticky wrapper exactly; DepthStage adds the 3D tilt */}
        <DepthStage progressRef={progressRef} zIndex={0}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ display: 'block', imageRendering: 'auto' }}
          />
        </DepthStage>

        {/* Slab texts – transform/opacity only, scrubbed by the stop coordinate */}
        <CryptoSlabs driverRef={slabRef} />
        <ScrollCaptions flow={CRYPTO_FLOW} driverRef={captionRef} variant="crypto" />
      </div>
    </section>
  );
}

export default CryptoMarketScroll;
