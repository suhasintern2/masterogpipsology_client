import { getLenis } from '@/components/providers/LenisProvider';

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Smooth-scroll to Forex frame 0. #forex-sequence has marginTop -100vh, so its layout top is already
 * where Forex frame 0 fully covers the Crypto sticky; we scroll to that document offset.
 */
export function startJourney(): void {
  const el = document.getElementById('forex-sequence');
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lenis = getLenis();
  if (lenis) {
    const top = el.getBoundingClientRect().top + window.scrollY;
    lenis.scrollTo(top, { duration: reduced ? 0 : 1.6, easing: easeInOutCubic, lock: true });
  } else {
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
}
