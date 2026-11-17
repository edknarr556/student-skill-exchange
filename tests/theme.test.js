import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAppearance,
  setAppearance,
  applyTheme,
  resolveMode,
  watchSystemTheme,
  PRESETS,
  MODES,
} from '../src/store/theme.js';
import {
  bootApp,
  navigate,
  $,
  $$,
  tick,
  setSystemDark,
  fireSystemThemeChange,
  keydown,
} from './helpers.js';

const root = () => document.documentElement;

describe('theme — persistence', () => {
  it('defaults to Riverside Blue + system when nothing is saved', () => {
    expect(getAppearance()).toEqual({ mode: 'system', preset: 'riverside' });
  });

  it('persists mode + preset to localStorage', () => {
    setAppearance({ mode: 'dark', preset: 'forest' });
    const raw = JSON.parse(localStorage.getItem('sse:appearance'));
    expect(raw).toEqual({ mode: 'dark', preset: 'forest' });
    // A fresh read reflects the stored value.
    expect(getAppearance()).toEqual({ mode: 'dark', preset: 'forest' });
  });

  it('ignores invalid persisted values and falls back to defaults', () => {
    localStorage.setItem(
      'sse:appearance',
      JSON.stringify({ mode: 'neon', preset: 'rainbow' })
    );
    expect(getAppearance()).toEqual({ mode: 'system', preset: 'riverside' });
  });

  it('rejects arbitrary presets/modes on write (no custom hex path)', () => {
    const saved = setAppearance({ mode: 'spicy', preset: '#ff0000' });
    expect(saved.mode).toBe('system');
    expect(saved.preset).toBe('riverside');
  });
});

describe('theme — root attributes & classes', () => {
  beforeEach(() => setSystemDark(false));

  it('applyTheme sets data-theme-preset, data-theme and color-scheme', () => {
    setAppearance({ mode: 'light', preset: 'midnight' });
    expect(root().getAttribute('data-theme-preset')).toBe('midnight');
    expect(root().getAttribute('data-theme')).toBe('light');
    expect(root().classList.contains('theme-dark')).toBe(false);
    expect(root().style.colorScheme).toBe('light');
  });

  it('dark mode toggles the theme-dark class', () => {
    setAppearance({ mode: 'dark', preset: 'riverside' });
    expect(root().getAttribute('data-theme')).toBe('dark');
    expect(root().classList.contains('theme-dark')).toBe(true);
    expect(root().style.colorScheme).toBe('dark');
  });

  it('every preset id applies a matching data-theme-preset attribute', () => {
    PRESETS.forEach((p) => {
      setAppearance({ preset: p.id, mode: 'light' });
      expect(root().getAttribute('data-theme-preset')).toBe(p.id);
    });
  });
});

describe('theme — system fallback', () => {
  it('resolveMode maps system to the OS preference', () => {
    setSystemDark(true);
    expect(resolveMode('system')).toBe('dark');
    setSystemDark(false);
    expect(resolveMode('system')).toBe('light');
    // Explicit modes ignore the OS.
    setSystemDark(true);
    expect(resolveMode('light')).toBe('light');
    expect(resolveMode('dark')).toBe('dark');
  });

  it('applies dark when mode=system and OS prefers dark', () => {
    setSystemDark(true);
    setAppearance({ mode: 'system', preset: 'riverside' });
    expect(root().getAttribute('data-theme')).toBe('dark');
  });

  it('watchSystemTheme re-applies when the OS preference changes (system mode)', () => {
    setSystemDark(false);
    setAppearance({ mode: 'system', preset: 'riverside' });
    expect(root().getAttribute('data-theme')).toBe('light');

    const stop = watchSystemTheme();
    setSystemDark(true);
    fireSystemThemeChange();
    expect(root().getAttribute('data-theme')).toBe('dark');
    stop();
  });

  it('does NOT follow the OS when an explicit mode is chosen', () => {
    setSystemDark(false);
    setAppearance({ mode: 'light', preset: 'riverside' });
    const stop = watchSystemTheme();
    setSystemDark(true);
    fireSystemThemeChange();
    // Still light — the user pinned it.
    expect(root().getAttribute('data-theme')).toBe('light');
    stop();
  });
});

describe('Appearance page — selection & keyboard', () => {
  beforeEach(() => {
    setSystemDark(false);
    return bootApp('/appearance');
  });

  it('renders mode + preset radiogroups with the saved selection checked', () => {
    const modeGroup = $('#mode-group');
    const presetGroup = $('#preset-group');
    expect(modeGroup.getAttribute('role')).toBe('radiogroup');
    expect(presetGroup.getAttribute('role')).toBe('radiogroup');
    expect($$('[data-preset]').length).toBe(PRESETS.length);
    expect($$('[data-mode]').length).toBe(MODES.length);
    // Default preset (riverside) is checked and is the single tabbable item.
    const checked = $('[data-preset][aria-checked="true"]');
    expect(checked.dataset.preset).toBe('riverside');
    expect(checked.tabIndex).toBe(0);
    expect($('[data-preset="midnight"]').tabIndex).toBe(-1);
  });

  it('clicking a preset selects it, persists it, and updates the root', () => {
    $('[data-preset="forest"]').click();
    expect(getAppearance().preset).toBe('forest');
    expect(root().getAttribute('data-theme-preset')).toBe('forest');
    const card = $('[data-preset="forest"]');
    expect(card.getAttribute('aria-checked')).toBe('true');
    expect(card.classList.contains('is-selected')).toBe(true);
    // Only one option is checked at a time.
    expect($$('[data-preset][aria-checked="true"]').length).toBe(1);
  });

  it('ArrowRight moves selection to the next preset (roving tabindex)', () => {
    const first = $('[data-preset="riverside"]');
    first.focus();
    keydown(first, 'ArrowRight');
    // Selection follows focus to the 2nd preset.
    const second = $(`[data-preset="${PRESETS[1].id}"]`);
    expect(second.getAttribute('aria-checked')).toBe('true');
    expect(second.tabIndex).toBe(0);
    expect(getAppearance().preset).toBe(PRESETS[1].id);
  });

  it('ArrowLeft wraps from the first to the last preset', () => {
    const first = $('[data-preset="riverside"]');
    first.focus();
    keydown(first, 'ArrowLeft');
    const last = $(`[data-preset="${PRESETS[PRESETS.length - 1].id}"]`);
    expect(last.getAttribute('aria-checked')).toBe('true');
  });

  it('Home / End jump to the first / last preset', () => {
    $('[data-preset="forest"]').focus();
    keydown($('[data-preset="forest"]'), 'End');
    expect(
      $(`[data-preset="${PRESETS[PRESETS.length - 1].id}"]`).getAttribute(
        'aria-checked'
      )
    ).toBe('true');
    keydown(document.activeElement, 'Home');
    expect($('[data-preset="riverside"]').getAttribute('aria-checked')).toBe(
      'true'
    );
  });

  it('arrow keys switch the theme mode and persist it', () => {
    const light = $('[data-mode="light"]');
    // Ensure a known starting point.
    light.click();
    light.focus();
    keydown(light, 'ArrowRight');
    expect($('[data-mode="dark"]').getAttribute('aria-checked')).toBe('true');
    expect(getAppearance().mode).toBe('dark');
  });

  it('Enter/Space on a focused option selects it', () => {
    const sunset = $('[data-preset="sunset"]');
    sunset.focus();
    keydown(sunset, ' ');
    expect(getAppearance().preset).toBe('sunset');
  });

  it('every control exposes an accessible name', () => {
    $$('#mode-group [data-mode], #preset-group [data-preset]').forEach((el) => {
      expect(el.getAttribute('aria-label')).toBeTruthy();
    });
  });
});

describe('Appearance — preview + no-flash boot', () => {
  it('renders a preview with buttons, tags, a tutor card and an agreement', async () => {
    await bootApp('/appearance');
    const preview = $('#appearance-preview');
    expect(preview.querySelector('.btn--primary')).toBeTruthy();
    expect(preview.querySelector('.tag')).toBeTruthy();
    expect(preview.querySelector('.preview__tutor')).toBeTruthy();
    expect(preview.querySelector('.preview__agreement')).toBeTruthy();
  });

  it('a saved theme is applied on boot (no flash of default)', async () => {
    setAppearance({ mode: 'dark', preset: 'lavender' });
    // Simulate a fresh load: clear root attributes, then boot.
    root().removeAttribute('data-theme');
    root().removeAttribute('data-theme-preset');
    await bootApp('/');
    expect(root().getAttribute('data-theme-preset')).toBe('lavender');
    expect(root().getAttribute('data-theme')).toBe('dark');
  });
});
