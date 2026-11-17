import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * WCAG AA contrast audit of every (preset, mode) declared in
 * styles/theme.css. Guards against a palette edit quietly dropping a token
 * pair below the accessible threshold.
 *   - normal text pairs: >= 4.5
 *   - UI / focus / large-text pairs: >= 3.0
 */
const css = readFileSync(
  resolve(process.cwd(), 'src/styles/theme.css'),
  'utf8'
);

function srgbToLin(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  const m = hex.replace('#', '');
  return (
    0.2126 * srgbToLin(parseInt(m.slice(0, 2), 16)) +
    0.7152 * srgbToLin(parseInt(m.slice(2, 4), 16)) +
    0.0722 * srgbToLin(parseInt(m.slice(4, 6), 16))
  );
}
function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const blocks = [];
const re = /([^{}]+)\{([^}]*)\}/g;
let match;
while ((match = re.exec(css))) {
  const vars = {};
  match[2].replace(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g, (_, k, v) => {
    vars[k] = v;
    return '';
  });
  if (Object.keys(vars).length)
    blocks.push({ selector: match[1].trim(), vars });
}
const base = blocks.find((b) => b.selector.includes(':root'))?.vars || {};

const PRESETS = ['riverside', 'midnight', 'forest', 'lavender', 'sunset', 'contrast'];
const MODES = ['light', 'dark'];

// [foreground, background, minRatio]
const PAIRS = [
  ['--text', '--bg', 4.5],
  ['--text', '--surface', 4.5],
  ['--text-muted', '--surface', 4.5],
  ['--text-muted', '--bg', 4.5],
  ['--on-primary', '--primary', 4.5],
  ['--primary', '--surface', 3.0],
  ['--danger', '--surface', 3.0],
  ['--success', '--surface', 3.0],
  ['--warning', '--surface', 3.0],
  ['--focus-ring', '--surface', 3.0],
  // soft-background chips/badges use small text -> 4.5
  ['--amber', '--amber-soft', 4.5],
  ['--green', '--green-soft', 4.5],
  ['--danger', '--red-soft', 4.5],
  ['--violet', '--violet-soft', 4.5],
  ['--navy-700', '--sky-soft', 4.5],
];

function varsFor(preset, mode) {
  if (preset === 'riverside' && mode === 'light') return base;
  const sel = blocks.find(
    (b) =>
      b.selector.includes(`data-theme-preset='${preset}'`) &&
      b.selector.includes(`data-theme='${mode}'`)
  );
  return { ...base, ...(sel?.vars || {}) };
}

describe('WCAG AA contrast across every theme', () => {
  for (const preset of PRESETS) {
    for (const mode of MODES) {
      it(`${preset} / ${mode} meets AA for all key token pairs`, () => {
        const vars = varsFor(preset, mode);
        for (const [fg, bg, min] of PAIRS) {
          expect(vars[fg], `${fg} defined in ${preset}/${mode}`).toBeTruthy();
          expect(vars[bg], `${bg} defined in ${preset}/${mode}`).toBeTruthy();
          const r = ratio(vars[fg], vars[bg]);
          expect(
            r,
            `${preset}/${mode}: ${fg}(${vars[fg]}) on ${bg}(${vars[bg]}) = ${r.toFixed(
              2
            )}, need >= ${min}`
          ).toBeGreaterThanOrEqual(min);
        }
      });
    }
  }
});
