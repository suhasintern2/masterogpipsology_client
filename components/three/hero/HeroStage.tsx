'use client';

import { useCallback, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from '@/lib/gsap';
import { loadProgress } from '@/lib/load-progress';
import { scrollStore } from '@/lib/scroll-store';
import { ClockBridge } from '@/components/three/ClockBridge';
import { StageCanvas } from '@/components/three/StageCanvas';
import { GoldEnvironment } from '@/components/three/GoldEnvironment';
import { GoldDust } from '@/components/three/GoldDust';
import { useDocumentVisible, useInViewActive } from '@/components/three/useInViewActive';
import { HERO_PANEL_U, heroZoom, screenXOfImageU } from '@/lib/hero-zoom';
import { GlassPanel } from './GlassPanel';
import { CAMERA_FOV, CAMERA_Z, useViewWorld } from './constants';

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
  const size = useThree((s) => s.size);
  const { w: worldW } = useViewWorld();
  useFrame(({ camera }) => {
    const fx = screenXOfImageU(HERO_PANEL_U, size.width, size.height);
    const z = heroZoom(scrollStore.heroProgress, fx);
    camera.position.set(z.panFrac * worldW, 0, CAMERA_Z / z.scale);
  });
  return null;
}

function Scene({ onReady }: { onReady: () => void }): React.ReactElement {
  return (
    <>
      <ambientLight intensity={0.35} />
      <GoldEnvironment />
      <GlassPanel />
      <GoldDust count={500} area={DUST_AREA} />
      <CameraRig />
      <ReadyProbe onReady={onReady} />
    </>
  );
}

export default function HeroStage(): React.ReactElement {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInViewActive(wrap);
  const visible = useDocumentVisible();

  const handleReady = useCallback((): void => {
    if (wrap.current) gsap.to(wrap.current, { opacity: 1, duration: 0.8 });
    loadProgress.complete('hero-3d');
  }, []);

  return (
    <div
      ref={wrap}
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <StageCanvas alpha camera={{ fov: CAMERA_FOV, position: [0, 0, 10] }} className="absolute inset-0">
        <ClockBridge active={inView && visible} />
        <Scene onReady={handleReady} />
      </StageCanvas>
    </div>
  );
}
