'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { gsap } from '@/lib/gsap';
import { useDeviceTier } from '@/lib/device-tier';

const HOVER_SEL = 'a, button, [data-cursor]';
const FINE_QUERY = '(hover:hover) and (pointer:fine)';

function subscribeFine(cb: () => void): () => void {
  const mq = window.matchMedia(FINE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getFine = (): boolean => window.matchMedia(FINE_QUERY).matches;
const getFineServer = (): boolean => false;

/** Desktop fine-pointer custom cursor: gold ring + dot. */
export function Cursor(): React.ReactElement | null {
  const tier = useDeviceTier();
  const fine = useSyncExternalStore(subscribeFine, getFine, getFineServer);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const enabled = fine && tier === 'high';

  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;
    const html = document.documentElement;
    html.classList.add('has-cursor');

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, opacity: 0 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    let visible = false;
    let hovering = false;
    const show = (v: boolean): void => {
      if (v === visible) return;
      visible = v;
      gsap.to(ring, { opacity: v ? 1 : 0, duration: 0.2 });
      gsap.to(dot, { opacity: v ? (hovering ? 0 : 1) : 0, duration: 0.2 });
    };

    const onMove = (e: PointerEvent): void => {
      if (!visible) {
        gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
      }
      rx(e.clientX);
      ry(e.clientY);
      dx(e.clientX);
      dy(e.clientY);
      show(true);
    };
    const setHover = (h: boolean): void => {
      if (h === hovering) return;
      hovering = h;
      gsap.to(ring, { scale: h ? 1.6 : 1, duration: 0.3, ease: 'power3.out' });
      gsap.to(dot, { opacity: h || !visible ? 0 : 1, duration: 0.2 });
    };
    const onOver = (e: PointerEvent): void => {
      const t = e.target as Element | null;
      setHover(!!t?.closest?.(HOVER_SEL));
    };
    const onDown = (): void => {
      gsap.to(ring, { scale: hovering ? 1.4 : 0.85, duration: 0.15 });
    };
    const onUp = (): void => {
      gsap.to(ring, { scale: hovering ? 1.6 : 1, duration: 0.2 });
    };
    const onLeave = (): void => show(false);

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    html.addEventListener('pointerleave', onLeave);
    return () => {
      html.classList.remove('has-cursor');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      html.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf([ring, dot]);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={ringRef} className="fx-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="fx-cursor-dot" aria-hidden="true" />
    </>
  );
}
