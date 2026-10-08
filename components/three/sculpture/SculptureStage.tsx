'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { scrollStore } from '@/lib/scroll-store';
import { buildSculpture } from '@/lib/three/sculpture-layout';
import { clamp01, easeInCubic, easeOutCubic, smoothstep } from '@/lib/three/ease';
import { ClockBridge } from '@/components/three/ClockBridge';
import { StageCanvas } from '@/components/three/StageCanvas';
import { GoldEnvironment } from '@/components/three/GoldEnvironment';
import { GoldDust } from '@/components/three/GoldDust';
import { useDocumentVisible, useInViewActive } from '@/components/three/useInViewActive';

const COUNT = 1400;
const BLOCK = 0.055;
const DUST_AREA: [number, number, number] = [16, 10, 8];
const dummy = new THREE.Object3D();
const qa = new THREE.Quaternion();
const qIdentity = new THREE.Quaternion();
const eul = new THREE.Euler();

function Sculpture(): React.ReactElement {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const lastP = useRef(-1);
  const layout = useMemo(() => buildSculpture(COUNT, 7), []);
  const quats = useMemo(() => {
    const q = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      eul.set(layout.rot[i * 3], layout.rot[i * 3 + 1], layout.rot[i * 3 + 2]);
      qa.setFromEuler(eul);
      qa.toArray(q, i * 4);
    }
    return q;
  }, [layout]);

  useFrame((state) => {
    const p = scrollStore.sculptureProgress;
    const m = mesh.current;
    if (m && Math.abs(p - lastP.current) > 1e-4) {
      lastP.current = p;
      const { start, target, scatter, delay } = layout;
      for (let i = 0; i < COUNT; i++) {
        const a = smoothstep(0, 0.42, p - delay[i] * 0.15);
        const d = smoothstep(0.62, 1, p - delay[i] * 0.1);
        const ea = easeOutCubic(a);
        const ed = easeInCubic(d);
        const k = i * 3;
        const x = (start[k] + (target[k] - start[k]) * ea) * (1 - ed) + scatter[k] * ed;
        const y = (start[k + 1] + (target[k + 1] - start[k + 1]) * ea) * (1 - ed) + scatter[k + 1] * ed;
        const z = (start[k + 2] + (target[k + 2] - start[k + 2]) * ea) * (1 - ed) + scatter[k + 2] * ed;
        dummy.position.set(x, y, z);
        qa.fromArray(quats, i * 4).slerp(qIdentity, a);
        dummy.quaternion.copy(qa);
        dummy.scale.setScalar(BLOCK * (1 - 0.6 * d));
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
    if (group.current) group.current.rotation.y = p * 0.9 + state.clock.elapsedTime * 0.05;
    if (spot.current) spot.current.position.x = -6 + 12 * clamp01((p - 0.3) / 0.4);

    const cam = state.camera;
    const radius = 9 - 2 * smoothstep(0, 0.5, p);
    const angle = -0.5 + p * 1.0;
    cam.position.set(Math.sin(angle) * radius, 1.2 - 0.8 * p, Math.cos(angle) * radius);
    cam.lookAt(0, 0.2, 0);
  });

  return (
    <>
      <spotLight ref={spot} color="#ffd58a" intensity={40} angle={0.5} penumbra={0.6} position={[-6, 4, 5]} />
      <group ref={group}>
        <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.28} envMapIntensity={1.4} />
        </instancedMesh>
      </group>
    </>
  );
}

export default function SculptureStage(): React.ReactElement {
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInViewActive(wrap);
  const visible = useDocumentVisible();
  return (
    <div ref={wrap} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <StageCanvas alpha camera={{ fov: 35, position: [0, 1.2, 9] }} className="absolute inset-0">
        <ClockBridge active={inView && visible} />
        <ambientLight intensity={0.25} />
        <GoldEnvironment />
        <Sculpture />
        <GoldDust count={900} area={DUST_AREA} seed={99} />
      </StageCanvas>
    </div>
  );
}
