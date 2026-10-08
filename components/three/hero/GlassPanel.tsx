'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { scrollStore } from '@/lib/scroll-store';
import { damp } from '@/lib/frame-sequence/math';
import { imageUvToWorld } from '@/lib/three/cover-math';
import { Candles } from './Candles';
import { FOCUS, IMG_ASPECT, PANEL_RECT, useViewWorld } from './constants';

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function usePanelRect(): { cx: number; cy: number; w: number; h: number } {
  const { w: vw, h: vh } = useViewWorld();
  return useMemo(() => {
    const a = imageUvToWorld(PANEL_RECT[0], PANEL_RECT[1], vw, vh, IMG_ASPECT, FOCUS);
    const b = imageUvToWorld(PANEL_RECT[2], PANEL_RECT[3], vw, vh, IMG_ASPECT, FOCUS);
    return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
  }, [vw, vh]);
}

/** Transmission-glass chart panel with a gold frame, positioned over the cleaned plate. */
export function GlassPanel(): React.ReactElement {
  const { cx, cy, w, h } = usePanelRect();
  const group = useRef<THREE.Group>(null);
  const prog = useRef(0);

  const frameGeo = useMemo(() => {
    const shape = roundedRectShape(w, h, 0.04);
    const inset = 0.025;
    shape.holes.push(roundedRectShape(w - inset * 2, h - inset * 2, 0.02));
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 2,
      curveSegments: 16,
    });
  }, [w, h]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    prog.current = damp(prog.current, scrollStore.heroProgress, 8, dt);
    const p = prog.current;
    const t = state.clock.elapsedTime;
    g.position.set(cx, cy + 0.35 * p + Math.sin(t * 0.6) * 0.03 * (1 - p), 0.04 + 2.1 * p);
    g.rotation.x = -0.16 * p + scrollStore.mouseY * 0.05;
    g.rotation.y = 0.3 * p + scrollStore.mouseX * 0.07;
  });

  return (
    <group ref={group} position={[cx, cy, 0.04]}>
      <RoundedBox args={[w, h, 0.06]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial
          transmission={1}
          thickness={0.35}
          roughness={0.16}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.08}
          attenuationColor="#f3e6cf"
          attenuationDistance={2.5}
          color="#fffaf0"
          envMapIntensity={1.2}
          specularIntensity={1}
        />
      </RoundedBox>
      <mesh geometry={frameGeo} position={[0, 0, 0.015]}>
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.22} />
      </mesh>
      <Candles w={w - 0.05} h={h - 0.05} />
    </group>
  );
}
