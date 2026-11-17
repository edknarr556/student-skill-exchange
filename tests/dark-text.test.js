import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard for "dark text invisible in dark themes".
 *
 * In the dark palettes, the darkest brand tokens (--navy-900 / --navy-800) are
 * near-black (they back the sidebar). Using them as a text `color:` on a
 * themeable surface makes that text invisible in dark mode. Body/title text
 * must use the semantic --text (or --text-muted) token, which flips per theme.
 *
 * The one legitimate exception is text placed on a *bright accent* background
 * (e.g. the sidebar nav badge sits on --sky), where dark-on-light is intended.
 */
const FILES = ['base.css', 'layout.css', 'components.css'].map((f) =>
  resolve(process.cwd(), 'src/styles', f)
);

// Selectors allowed to use a dark navy text color (dark-on-bright-accent).
const ALLOW = [/\.nav__badge\b/];

function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), body: m[2] });
  return out;
}

describe('no dark-navy text that would vanish in dark mode', () => {
  for (const file of FILES) {
    it(`${file.split('/').pop()} uses --text (not --navy-900/800) for text`, () => {
      const css = readFileSync(file, 'utf8');
      const offenders = rules(css)
        .filter((r) => /color:\s*var\(--navy-(900|800)\)/.test(r.body))
        .filter((r) => !ALLOW.some((rx) => rx.test(r.selector)))
        .map((r) => r.selector);
      expect(offenders, `offending selectors: ${offenders.join(', ')}`).toEqual(
        []
      );
    });
  }
});
