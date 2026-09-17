'use client';
import React from 'react';

// ─── Theme Provider ────────────────────────────────────────────────────────────
// Activates the scroll→colour system for the page root container.
// This is a thin client wrapper so the page.tsx Server Component can pass
// a ref down to useThemeScroll.

import { useRef, type ReactNode } from 'react';
import { useThemeScroll } from '@/lib/theme';

interface ThemeScrollWrapperProps {
  children: ReactNode;
}

export function ThemeScrollWrapper({ children }: ThemeScrollWrapperProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useThemeScroll(ref);

  return (
    <div ref={ref} className="relative">
      {children}
    </div>
  );
}
