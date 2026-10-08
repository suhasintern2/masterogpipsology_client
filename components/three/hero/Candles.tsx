'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { gsap } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';
import { scrollStore } from '@/lib/scroll-store';
import { CANDLES } from '@/lib/three/hero-candles';
import { clamp01, easeOutExpo } from '@/lib/three/ease';

const UP = new THREE.Color('#9fbf9a');
const DOWN = new THREE.Color('#d9978a');
const N = CANDLES.length;
const dummy = new THREE.Object3D();

interface CandlesProps {
  /** Panel size in world units. The group origin is the panel centre. */
  w: number;
  h: number;
}

/** Decorative candlesticks inside the glass. Authored art (see hero-candles.ts), not data. */
export function Candles({ w, h }: CandlesProps): React.ReactElement {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const wicks = useRef<THREE.InstancedMesh>(null);
  const glows = useRef<THREE.InstancedMesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const intro = useRef({ v: 0 });
  const lastG = useRef(-1);
  const glow = useTexture('/textures/glow-64.png');

  // Inner chart rect with margins.
  const layout = useMemo(() => {
    const iw = w * 0.84;
    const ih = h * 0.66;
    const sw = iw / N;
    return { iw, ih, sw, bw: sw * 0.55, x0: -iw / 2 + sw / 2, y0: -ih / 2 - h * 0.02 };
  }, [w, h]);

  useEffect(() => {
    let tween: gsap.core.Tween | null = null;
    const off = onIntroDone(() => {
      tween = gsap.to(intro.current, { v: 1, duration: 1.6, ease: 'expo.out' });
    });
    return () => {
      off();
      tween?.kill();
    };
  }, []);

  // Per-candle colours are static.
  useEffect(() => {
    const b = bodies.current;
    if (!b) return;
    CANDLES.forEach(([o, c], i) => b.setColorAt(i, c >= o ? UP : DOWN));
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    lastG.current = -1;
  }, [layout]);

  useFrame(() => {
    const b = bodies.current, wk = wicks.current, gl = glows.current;
    if (!b || !wk || !gl) return;
    const g = clamp01(intro.current.v * 0.4 + scrollStore.heroProgress * 1.4);
    if (Math.abs(g - lastG.current) <= 1e-3) return;
    lastG.current = g;
    const { ih, sw, bw, x0, y0 } = layout;
    for (let i = 0; i < N; i++) {
      const [o, c, hi, lo] = CANDLES[i];
      const s = easeOutExpo(clamp01(g * 1.25 - (i / N) * 0.25));
      const x = x0 + i * sw;
      const top = Math.max(o, c), bot = Math.min(o, c);
      const bodyH = Math.max(0.012, (top - bot) * ih);
      const bodyY = y0 + ((top + bot) / 2) * ih;
      const wickH = Math.max(0.012, (hi - lo) * ih);
      const wickY = y0 + ((hi + lo) / 2) * ih;

      dummy.rotation.set(0, 0, 0);
      dummy.position.set(x, bodyY, 0);
      dummy.scale.set(bw, bodyH * s, 0.02);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, wickY, 0);
      dummy.scale.set(bw * 0.1, wickH * s, 0.01);
      dummy.updateMatrix();
      wk.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, bodyY, -0.004);
      dummy.scale.set(bw * 3.2, Math.max(bodyH, 0.05) * 2.2 * s, 1);
      dummy.updateMatrix();
      gl.setMatrixAt(i, dummy.matrix);
    }
    b.instanceMatrix.needsUpdate = true;
    wk.instanceMatrix.needsUpdate = true;
    gl.instanceMatrix.needsUpdate = true;
    if (glowMat.current) glowMat.current.opacity = 0.55 * g;
  });

  return (
    <group position={[0, 0, -0.005]}>
      <instancedMesh ref={bodies} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={wicks} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f3e6cf" roughness={0.4} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={glows} args={[undefined, undefined, N]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glow}
          color="#ffcf6b"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
