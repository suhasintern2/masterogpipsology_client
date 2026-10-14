import React, { Fragment } from 'react';
import { splitChars, splitWords, type UnitKind } from '@/lib/text-motion';

/**
 * Words in overflow masks; each word (letters = false) or each letter (letters = true) is one scrubbed unit ([data-u]).
 * Spaces stay as text nodes between masks, so lines wrap naturally. Callers hide this from AT and provide an sr-only copy.
 */
export function SplitWords({ text, kind = 'tilt', letters = false }: { text: string; kind?: UnitKind; letters?: boolean }): React.ReactElement {
  const words = splitWords(text);
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="tm-mask">
            {letters
              ? splitChars(w).map((c, k) => <span key={k} className="tm-u" data-u={kind}>{c}</span>)
              : <span className="tm-u" data-u={kind}>{w}</span>}
          </span>
        </Fragment>
      ))}
    </>
  );
}
export default SplitWords;
