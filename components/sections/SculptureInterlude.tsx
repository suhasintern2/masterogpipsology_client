'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { useDeviceTier } from '@/lib/device-tier';
import { scrollStore } from '@/lib/scroll-store';
import { LightLeak } from '@/components/fx/LightLeak';
import { SculptureFallback } from '@/components/sections/SculptureFallback';

// The 3D bundle is only requested on the high tier.
const SculptureStage = dynamic(() => import('@/components/three/sculpture/SculptureStage'), {
  ssr: false,
});

/** Text-free gold beat after Forex: blocks assemble into a candlestick sculpture, then disperse. */
export function SculptureInterlude(): React.ReactElement {
  const tier = useDeviceTier();
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = ref.current;
      if (!section) return;
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (s) => {
          scrollStore.sculptureProgress = s.progress;
        },
      });
      return () => {
        st.kill();
        scrollStore.sculptureProgress = 0;
      };
    },
    { scope: ref },
  );

  // The tier upgrade after hydration changes this section's height; re-measure everything.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [tier]);

  return (
    <section
      id="sculpture"
      ref={ref}
      data-nav-tone="dark"
      aria-hidden="true"
      className="relative overflow-clip"
      style={{ height: tier === 'high' ? '260vh' : '140vh' }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {tier === 'high' ? (
          <SculptureStage />
        ) : (
          <SculptureFallback animate={tier === 'low'} trigger={ref} />
        )}
      </div>
      <LightLeak from="left" intensity={0.8} />
    </section>
  );
}
