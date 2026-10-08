'use client';

import React, { useState, useEffect } from 'react';

interface TypingHeadingProps {
  text?: string;
  speedMs?: number;
  delayMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TypingHeading({
  text = 'Education before execution',
  speedMs = 70,
  delayMs = 350,
  className = '',
  style,
}: TypingHeadingProps): React.ReactElement {
  const [displayedCount, setDisplayedCount] = useState<number>(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setDisplayedCount((prev) => {
          if (prev >= text.length) {
            if (intervalId) clearInterval(intervalId);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    }, delayMs);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speedMs, delayMs]);

  const displayedText = text.slice(0, displayedCount);

  return (
    <span className={`relative inline-block ${className}`} style={style} aria-label={text}>
      {/* Ghost text reserves exact width and height on all breakpoints — guarantees 0 layout shift */}
      <span className="invisible select-none pointer-events-none" aria-hidden="true">
        {text}
      </span>

      {/* Visible typing layer */}
      <span className="absolute inset-0 flex items-center">
        <span>{displayedText}</span>
        {/* Blinking cursor at the end while typing and continues blinking after completion */}
        <span
          className="inline-block w-[3px] sm:w-[4px] h-[0.82em] ml-1.5 sm:ml-2 bg-[#D4AF37] rounded-xs align-middle flex-shrink-0"
          style={{
            animation: 'heroBlink 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.75)',
          }}
          aria-hidden="true"
        />
      </span>

      <style jsx>{`
        @keyframes heroBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
}

export default TypingHeading;
