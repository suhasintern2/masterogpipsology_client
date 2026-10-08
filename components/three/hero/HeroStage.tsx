'use client';

import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { gsap } from '@/lib/gsap';
import { loadProgress } from '@/lib/load-progress';
import { scrollStore } from '@/lib/scroll-store';
import { ClockBridge } from '@/components/three/ClockBridge';
import { StageCanvas } from '@/components/three/StageCanvas';
import { GoldEnvironment } from '@/components/three/GoldEnvironment';
import { GoldDust } from '@/components/three/GoldDust';
import { useDocumentVisible, useInViewActive } from '@/components/three/useInViewActive';
import { BackgroundPlane } from './BackgroundPlane';
import { GlassPanel, usePanelRect } from './GlassPanel';
import { CAMERA_FOV } from './constants';

const DUST_AREA: [number, number, number] = [14, 8, 4];

/** Fires onReady once, after the first two rendered frames (textures are loaded by then). */
function ReadyProbe({ onReady }: { onReady: () => void }): null {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > 1) return;
    frames.current += 1;
    if (frames.current === 2) onReady();
  });
  return null;
}

function CameraRig(): null {
  const panel = usePanelRect();
  useFrame(({ camera }) => {
    const p = scrollStore.heroProgress;
    camera.position.z = 10 - 1.4 * p;
    camera.position.y = -0.3 * p;
    camera.lookAt(panel.cx * 0.3 * p, 0, 0);
  });
  return null;
}

function Scene({ onReady }: { onReady: () => void }): React.ReactElement {
  return (
    <>
      <ambientLight intensity={0.35} />
      <GoldEnvironment />
      <BackgroundPlane />
      <GlassPanel />
      <GoldDust count={500} area={DUST_AREA} />
      <CameraRig />
      <ReadyProbe onReady={onReady} />
    </>
  );
}

interface HeroStageProps {
  /** Called when the 3D layer is visible, so the DOM light layers can hide. */
  onReady?: () => void;
}

export default function HeroStage({ onReady }: HeroStageProps): React.ReactElement {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInViewActive(wrap);
  const visible = useDocumentVisible();

  const handleReady = useCallback((): void => {
    if (wrap.current) gsap.to(wrap.current, { opacity: 1, duration: 0.8 });
    loadProgress.complete('hero-3d');
    onReady?.();
  }, [onReady]);

  return (
    <div
      ref={wrap}
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <StageCanvas camera={{ fov: CAMERA_FOV, position: [0, 0, 10] }} className="absolute inset-0">
        <ClockBridge active={inView && visible} />
        <Scene onReady={handleReady} />
      </StageCanvas>
    </div>
  );
}
