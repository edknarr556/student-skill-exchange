/**
 * Appearance / theming.
 *
 * Two independent choices are persisted:
 *   - mode:   'light' | 'dark' | 'system'   (system follows the OS)
 *   - preset: one of PRESETS below          (a curated colour palette)
 *
 * Applying a theme sets two attributes on <html>:
 *   data-theme-preset="riverside"   (which palette)
 *   data-theme="light" | "dark"     (the *resolved* mode after system lookup)
 * and toggles a `theme-dark` class for convenience. All colour tokens are
 * declared per (preset, mode) in styles/theme.css, so switching either value
 * re-themes every page via CSS custom properties — no per-component work.
 *
 * Only curated palettes are allowed (no arbitrary hex), and every palette is
 * authored to meet WCAG AA contrast for normal text and interactive controls.
 */

const STORAGE_KEY = 'sse:appearance';

export const MODES = [
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'system', label: 'System', icon: 'monitor' },
];

/**
 * Preset metadata. `swatch` values are used only for the little selector
 * chips/preview — the authoritative colours live in styles/theme.css keyed by
 * [data-theme-preset][data-theme].
 */
export const PRESETS = [
  {
    id: 'riverside',
    name: 'Riverside Blue',
    description: 'The default campus palette — navy, sky, and light gray.',
    swatch: { primary: '#1e3a8a', accent: '#38bdf8', surface: '#ffffff' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep indigo with cool cyan highlights.',
    swatch: { primary: '#4f6bed', accent: '#22d3ee', surface: '#121725' },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Calm greens with a warm neutral base.',
    swatch: { primary: '#15774a', accent: '#34d399', surface: '#ffffff' },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soft violet tones with a gentle contrast.',
    swatch: { primary: '#6d28d9', accent: '#a78bfa', surface: '#ffffff' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm amber and coral accents.',
    swatch: { primary: '#b4471c', accent: '#f59e0b', surface: '#fffaf5' },
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    description: 'Maximum legibility — pure black, white, and bold accents.',
    swatch: { primary: '#0033cc', accent: '#111111', surface: '#ffffff' },
  },
];

const PRESET_IDS = PRESETS.map((p) => p.id);
const MODE_IDS = MODES.map((m) => m.id);

const DEFAULTS = { mode: 'system', preset: 'riverside' };

/* ------------------------------------------------------------------ *
 * Read / write preferences. We read localStorage directly (not via the
 * store wrapper) so the theme can be applied as early as possible on load,
 * before the rest of the app boots, avoiding a flash of the default theme.
 * ------------------------------------------------------------------ */

export function getAppearance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      mode: MODE_IDS.includes(parsed.mode) ? parsed.mode : DEFAULTS.mode,
      preset: PRESET_IDS.includes(parsed.preset)
        ? parsed.preset
        : DEFAULTS.preset,
    };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function setAppearance(patch) {
  const next = { ...getAppearance(), ...patch };
  // Guard against invalid values ever being written.
  if (!MODE_IDS.includes(next.mode)) next.mode = DEFAULTS.mode;
  if (!PRESET_IDS.includes(next.preset)) next.preset = DEFAULTS.preset;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    /* ignore quota / disabled storage */
  }
  applyTheme(next);
  return next;
}

/** Does the OS currently prefer dark? Safe when matchMedia is unavailable. */
export function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** Resolve 'system' to a concrete 'light' | 'dark'. */
export function resolveMode(mode) {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode === 'dark' ? 'dark' : 'light';
}

/**
 * Apply the given appearance (or the saved one) to <html>. Pure DOM side
 * effect — safe to call before the app renders.
 */
export function applyTheme(appearance = getAppearance()) {
  const root =
    typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) return appearance;
  const resolved = resolveMode(appearance.mode);
  root.setAttribute('data-theme-preset', appearance.preset);
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('theme-dark', resolved === 'dark');
  // Inform the UA so form controls / scrollbars match.
  root.style.colorScheme = resolved;
  return appearance;
}

let mediaQuery = null;
let mediaListener = null;

/**
 * Keep the resolved theme in sync with the OS while mode === 'system'.
 * Returns an unsubscribe function. Idempotent.
 */
export function watchSystemTheme() {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => {};
  }
  if (mediaQuery) return teardownSystemWatch; // already watching

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaListener = () => {
    if (getAppearance().mode === 'system') applyTheme();
  };
  // addEventListener is the modern API; older Safari used addListener.
  if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', mediaListener);
  else if (mediaQuery.addListener) mediaQuery.addListener(mediaListener);
  return teardownSystemWatch;
}

function teardownSystemWatch() {
  if (!mediaQuery || !mediaListener) return;
  if (mediaQuery.removeEventListener)
    mediaQuery.removeEventListener('change', mediaListener);
  else if (mediaQuery.removeListener) mediaQuery.removeListener(mediaListener);
  mediaQuery = null;
  mediaListener = null;
}

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}
