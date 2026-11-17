import { describe, it, expect, beforeEach } from 'vitest';
import { bootApp, $, $$, tick, setViewport } from './helpers.js';

/**
 * jsdom has no layout/CSS engine, so these tests assert the structural and
 * behavioural contract the responsive CSS relies on (markup, ARIA, the
 * nav-open state machine, scrim wiring). The actual pixel widths at 320/390/768
 * are governed by the media queries in layout.css, which are exercised by the
 * build; here we verify the DOM those rules target behaves correctly.
 */
describe('mobile navigation drawer', () => {
  beforeEach(() => bootApp('/'));

  it('exposes a labelled toggle wired to the sidebar via aria-controls', () => {
    const toggle = $('#nav-toggle');
    expect(toggle.getAttribute('aria-label')).toBeTruthy();
    expect(toggle.getAttribute('aria-controls')).toBe('sidebar');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect($('#sidebar')).toBeTruthy();
  });

  it('opening the drawer toggles state, reveals the scrim, and updates aria', async () => {
    setViewport(390);
    const shell = $('#shell');
    const toggle = $('#nav-toggle');
    const scrim = $('[data-close-nav]');

    expect(scrim.hidden).toBe(true);
    toggle.click();
    await tick();

    expect(shell.classList.contains('nav-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(scrim.hidden).toBe(false);
  });

  it('tapping the scrim (outside) closes the drawer', async () => {
    setViewport(390);
    const shell = $('#shell');
    $('#nav-toggle').click();
    await tick();
    expect(shell.classList.contains('nav-open')).toBe(true);

    $('[data-close-nav]').click();
    await tick();
    expect(shell.classList.contains('nav-open')).toBe(false);
    expect($('[data-close-nav]').hidden).toBe(true);
  });

  it('selecting a nav route closes the drawer', async () => {
    setViewport(320);
    const shell = $('#shell');
    $('#nav-toggle').click();
    await tick();
    expect(shell.classList.contains('nav-open')).toBe(true);

    // Click a nav link (triggers close via its handler).
    const link = $$('.nav__link').find((a) =>
      a.getAttribute('href')?.includes('/browse')
    );
    link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();
    expect(shell.classList.contains('nav-open')).toBe(false);
  });

  it('Escape closes the drawer when open', async () => {
    setViewport(390);
    const shell = $('#shell');
    $('#nav-toggle').click();
    await tick();
    shell.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    await tick();
    expect(shell.classList.contains('nav-open')).toBe(false);
  });

  it('every nav item renders its full text label (no clipping by omission)', () => {
    const labels = $$('.nav__link .nav__text').map((e) => e.textContent.trim());
    expect(labels).toEqual([
      'Dashboard',
      'Browse Skills',
      'Messaging',
      'Requests',
      'My Sessions',
      'My Profile',
    ]);
  });

  it('mobile-only close button exists inside the drawer', () => {
    expect($('#nav-close')).toBeTruthy();
    expect($('#nav-close').getAttribute('aria-label')).toBeTruthy();
  });
});

describe('demo mode is de-emphasised', () => {
  beforeEach(() => bootApp('/'));

  it('replaces the persistent reset panel with a subtle trigger', () => {
    // The old always-visible "Reset demo data" button should be gone.
    expect($('#reset-demo')).toBeNull();
    const trigger = $('#demo-trigger') || $('#demo-menu-btn');
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('reset lives behind the menu and a destructive confirmation', async () => {
    $('#demo-menu-btn').click();
    await tick();
    const resetItem = $('[data-reset]');
    expect(resetItem).toBeTruthy();
    resetItem.click();
    await tick();
    // A confirmation modal with a clearly destructive action appears.
    expect($('.modal-overlay')).toBeTruthy();
    expect($('#confirm-reset')).toBeTruthy();
    expect($('#confirm-reset').className).toMatch(/danger/);
  });
});
