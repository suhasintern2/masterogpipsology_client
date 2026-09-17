import React from 'react';
// ─── Curriculum Section ───────────────────────────────────────────────────────
// Six numbered chapters in a hairline-separated vertical list.
// Numbered because it is a genuine sequence — not decoration.
// Server Component.

import { CURRICULUM_CHAPTERS, CURRICULUM_INTRO } from '@/lib/content';
import { Hairline } from '@/components/ui/Hairline';

export function Curriculum(): React.ReactElement {
  return (
    <section
      id="curriculum"
      className="py-20 md:py-28 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto"
      aria-labelledby="curriculum-heading"
    >
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-xs font-body font-medium uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          The programme
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hairline)' }} aria-hidden="true" />
      </div>

      <div className="flex flex-col md:flex-row md:gap-16 mb-12 md:mb-16">
        <h2
          id="curriculum-heading"
          className="display font-medium leading-tight tracking-tight md:w-1/2"
          style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)', color: 'var(--text)' }}
        >
          Twelve weeks.<br />Six modules.<br />One system.
        </h2>

        <p
          className="md:w-1/2 mt-4 md:mt-0 text-base leading-relaxed font-body self-end body-max"
          style={{ color: 'var(--text-muted)' }}
        >
          {CURRICULUM_INTRO}
        </p>
      </div>

      {/* Chapter list */}
      <ol
        className="list-none"
        aria-label="Curriculum chapters"
      >
        <Hairline />
        {CURRICULUM_CHAPTERS.map((chapter) => (
          <li key={chapter.number}>
            <div className="py-6 md:py-8 flex flex-col md:flex-row md:gap-12">
              {/* Chapter number */}
              <div
                className="display font-medium text-3xl md:text-4xl leading-none flex-shrink-0 md:w-20 mb-3 md:mb-0"
                style={{ color: 'var(--accent)', opacity: 0.7 }}
                aria-hidden="true"
              >
                {chapter.number}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2">
                <h3
                  className="display font-medium text-xl md:text-2xl tracking-tight leading-snug"
                  style={{ color: 'var(--text)' }}
                >
                  {chapter.title}
                </h3>
                <p
                  className="text-base leading-relaxed font-body body-max"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {chapter.description}
                </p>
              </div>
            </div>
            <Hairline />
          </li>
        ))}
      </ol>
    </section>
  );
}
