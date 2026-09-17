import React from 'react';
// ─── Hairline ─────────────────────────────────────────────────────────────────
// 1px rule consuming --hairline CSS var. Optionally renders as a brass gradient.

import clsx from 'clsx';

export interface HairlineProps {
  orientation?: 'horizontal' | 'vertical';
  brass?: boolean;
  className?: string;
}

export function Hairline({
  orientation = 'horizontal',
  brass = false,
  className,
}: HairlineProps): React.ReactElement {
  if (orientation === 'vertical') {
    return (
      <div
        aria-hidden="true"
        className={clsx(
          'w-px self-stretch',
          brass ? 'brass-rule' : 'bg-hairline',
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={clsx(
        'h-px w-full',
        brass ? 'brass-rule' : 'bg-hairline',
        className,
      )}
    />
  );
}
