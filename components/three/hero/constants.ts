'use client';

import { useThree } from '@react-three/fiber';

/** Hero photo intrinsic aspect (6688 x 3764). */
export const IMG_ASPECT = 6688 / 3764;
/** Matches CSS objectPosition: '65% center'. */
export const FOCUS = { x: 0.65, y: 0.5 } as const;
/** Baked panel rect in image UV (u0, v0 top, u1, v1). Tuned with ?heroDebug=1. */
export const PANEL_RECT = [0.531, 0.296, 0.923, 0.83] as const;
export const PANEL_RADIUS = 0.012;
/** Marble arch: centre u, centre v, outer R, inner R (u-units). */
export const ARCH = [0.871, 0.489, 0.188, 0.133] as const;
export const CAMERA_Z = 10;
export const CAMERA_FOV = 30;

/** World size of the frustum cross-section at z = 0 (camera at z = 10, fov 30). */
export function useViewWorld(): { w: number; h: number } {
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const h = 2 * CAMERA_Z * Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
  return { w: h * aspect, h };
}
