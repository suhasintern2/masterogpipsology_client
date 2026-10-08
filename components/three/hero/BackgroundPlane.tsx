'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { scrollStore } from '@/lib/scroll-store';
import { damp } from '@/lib/frame-sequence/math';
import { ARCH, FOCUS, IMG_ASPECT, PANEL_RADIUS, PANEL_RECT, useViewWorld } from './constants';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uImgAspect;
uniform float uViewAspect;
uniform float uProgress;
uniform float uTime;
uniform float uPanelRadius;
uniform float uDebug;
uniform vec2 uFocus;
uniform vec2 uMouse;
uniform vec4 uPanelRect;
uniform vec4 uArch;
varying vec2 vUv;

vec3 samp(vec2 uv) { return texture(uMap, vec2(uv.x, 1.0 - uv.y)).rgb; }

float rrMask(vec2 uv, vec4 rect, float r, float f) {
  vec2 asp = vec2(1.0, 1.0 / uImgAspect);
  vec2 c = (rect.xy + rect.zw) * 0.5;
  vec2 h = (rect.zw - rect.xy) * 0.5 * asp;
  vec2 q = abs((uv - c) * asp) - h + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  return 1.0 - smoothstep(-f, f, d);
}

void main() {
  // a. cover UV with focus, identical to CSS object-fit: cover + object-position
  vec2 frac = uViewAspect > uImgAspect
    ? vec2(1.0, uImgAspect / uViewAspect)
    : vec2(uViewAspect / uImgAspect, 1.0);
  vec2 off = uFocus * (1.0 - frac);
  vec2 uvImg = off + vec2(vUv.x, 1.0 - vUv.y) * frac;

  // b. masks (upper half of the arch ring, plus the rocks lower right)
  float e = 0.01;
  vec2 ad = vec2(uvImg.x - uArch.x, (uvImg.y - uArch.y) / uImgAspect);
  float dist = length(ad);
  float upper = 1.0 - smoothstep(uArch.y - 0.004, uArch.y + 0.004, uvImg.y);
  float archMask = (1.0 - smoothstep(uArch.z - e, uArch.z + e, dist))
                 * smoothstep(uArch.w - e, uArch.w + e, dist) * upper;
  float rockMask = smoothstep(0.49, 0.55, uvImg.x) * smoothstep(0.77, 0.83, uvImg.y);

  // c. parallax
  vec2 shift = (uMouse * 0.006 + vec2(0.0, uProgress * 0.015)) * (archMask + rockMask * 0.6)
             + uMouse * 0.002;
  vec3 col = samp(uvImg + shift);

  // d. clean plate: replace the baked panel with a blurred wall so the 3D one takes over
  float pm = rrMask(uvImg, uPanelRect, uPanelRadius, 0.006);
  vec3 blur = textureLod(uMap, vec2(uvImg.x, 1.0 - uvImg.y), 6.5).rgb * 1.02;
  col = mix(col, blur, pm);

  // e. gold light sweep over the arch and rocks
  float t = fract(uTime * 0.045) * 1.6 - 0.3 + uProgress * 0.5;
  float band = exp(-pow((uvImg.x * 0.8 + uvImg.y * 0.6 - t) * 9.0, 2.0));
  col += vec3(1.0, 0.84, 0.55) * band * 0.32 * (archMask + rockMask * 0.4);

  // f. debug tint for aligning the constants against the photo
  col = mix(col, vec3(1.0, 0.0, 0.0), archMask * 0.5 * uDebug);
  col = mix(col, vec3(0.0, 0.0, 1.0), pm * 0.4 * uDebug);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

/** Full-frustum plane showing the hero photo with arch parallax and a gold light sweep. */
export function BackgroundPlane(): React.ReactElement {
  const dpr = useThree((s) => s.viewport.dpr);
  const width = useThree((s) => s.size.width);
  const { w, h } = useViewWorld();
  const url = dpr > 1.25 || width > 1600 ? '/hero/hero-2560.webp' : '/hero/hero-1600.webp';
  const map = useTexture(url, (t) => {
    const tex = (Array.isArray(t) ? t[0] : t) as THREE.Texture;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  });
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const smooth = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(
    () => ({
      uMap: { value: map },
      uImgAspect: { value: IMG_ASPECT },
      uViewAspect: { value: 1 },
      uFocus: { value: new THREE.Vector2(FOCUS.x, FOCUS.y) },
      uProgress: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uPanelRect: { value: new THREE.Vector4(...PANEL_RECT) },
      uPanelRadius: { value: PANEL_RADIUS },
      uArch: { value: new THREE.Vector4(...ARCH) },
      uDebug: {
        value: typeof location !== 'undefined' && new URLSearchParams(location.search).get('heroDebug') === '1' ? 1 : 0,
      },
    }),
    [map],
  );

  useFrame((state, delta) => {
    const m = matRef.current;
    if (!m) return;
    const dt = Math.min(delta, 0.1);
    smooth.current.x = damp(smooth.current.x, scrollStore.mouseX, 4, dt);
    smooth.current.y = damp(smooth.current.y, scrollStore.mouseY, 4, dt);
    const u = m.uniforms;
    u.uViewAspect.value = w / h;
    u.uProgress.value = scrollStore.heroProgress;
    u.uTime.value = state.clock.elapsedTime;
    (u.uMouse.value as THREE.Vector2).set(smooth.current.x, smooth.current.y);
  });

  return (
    <mesh scale={[w, h, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        glslVersion={THREE.GLSL3}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}
