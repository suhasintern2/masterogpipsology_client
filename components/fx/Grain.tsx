'use client';

import { useDeviceTier } from '@/lib/device-tier';

/** Animated film grain (transform-only). High tier; hidden under reduced motion. */
export function Grain(): React.ReactElement | null {
  const tier = useDeviceTier();
  if (tier !== 'high') return null;
  return <div className="fx-grain" aria-hidden="true" />;
}
