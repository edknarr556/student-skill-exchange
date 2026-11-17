import { describe, it, expect, beforeEach } from 'vitest';
import { bootApp, navigate, $, $$, tick } from './helpers.js';
import { closeAllOverlays, hasOpenOverlays } from '../src/components/overlay.js';

describe('route-safe transient UI', () => {
  beforeEach(() => bootApp('/'));

  it('closes the notifications panel when the route changes', async () => {
    $('#notif-btn').click();
    await tick();
    expect($('#notif-panel')).toBeTruthy();
    expect($('#notif-btn').getAttribute('aria-expanded')).toBe('true');

    navigate('/browse');
    await tick();
    expect($('#notif-panel')).toBeNull();
    // No visible transient surface remains in the DOM after navigation.
    expect($('.popover')).toBeNull();
    expect($('.modal-overlay')).toBeNull();
    expect($('#notif-btn').getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the demo menu when the route changes', async () => {
    $('#demo-menu-btn').click();
    await tick();
    expect($('#demo-menu')).toBeTruthy();

    navigate('/sessions');
    await tick();
    expect($('#demo-menu')).toBeNull();
  });

  it('closes an open request modal on navigation', async () => {
    navigate('/browse');
    await tick();
    $('[data-request]').click(); // open request modal
    await tick();
    expect($('.modal-overlay')).toBeTruthy();

    navigate('/');
    await tick();
    expect($('.modal-overlay')).toBeNull();
  });

  it('closeAllOverlays tears every visible surface down', async () => {
    $('#notif-btn').click();
    await tick();
    expect($('#notif-panel')).toBeTruthy();
    expect(hasOpenOverlays()).toBe(true);
    closeAllOverlays();
    await tick();
    expect($('#notif-panel')).toBeNull();
    expect($('.popover')).toBeNull();
  });
});

describe('accessible dialog (request modal)', () => {
  beforeEach(() => bootApp('/browse'));

  it('has dialog role, aria-modal and a labelling title', async () => {
    $('[data-request]').click();
    await tick();
    const dialog = $('.modal[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect($('#' + dialog.getAttribute('aria-labelledby'))).toBeTruthy();
  });

  it('Escape closes the dialog and restores focus to the opener', async () => {
    const opener = $('[data-request]');
    opener.focus();
    opener.click();
    await tick();
    expect($('.modal-overlay')).toBeTruthy();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    await tick();
    expect($('.modal-overlay')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('uses semantic radio inputs for the payment choice', async () => {
    $('[data-request]').click();
    await tick();
    const radios = $$('input[type="radio"][name="payType"]');
    expect(radios.length).toBe(2);
    expect(radios.map((r) => r.value).sort()).toEqual(['exchange', 'money']);
    // Default selection is money; exchange field is hidden.
    expect($('#rf-pay-money').checked).toBe(true);
    expect($('[data-pay="exchange"]').hidden).toBe(true);

    // Selecting exchange reveals the exchange field (when offered).
    const exchange = $('#rf-pay-exchange');
    if (!exchange.disabled) {
      exchange.checked = true;
      exchange.dispatchEvent(new Event('change', { bubbles: true }));
      expect($('[data-pay="exchange"]').hidden).toBe(false);
      expect($('[data-pay="money"]').hidden).toBe(true);
    }
  });
});

describe('notifications are interactive', () => {
  beforeEach(() => bootApp('/'));

  it('each entry is a button with an accessible destination', async () => {
    $('#notif-btn').click();
    await tick();
    const entries = $$('[data-notif-link]');
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((e) => {
      expect(e.tagName).toBe('BUTTON');
      expect(e.dataset.notifLink).toMatch(/^\//);
    });
  });

  it('clicking a notification navigates to its target and closes the panel', async () => {
    $('#notif-btn').click();
    await tick();
    const entry = $('[data-notif-link]');
    const dest = entry.dataset.notifLink;
    entry.click();
    await tick();
    expect(window.location.hash).toBe('#' + dest);
    expect($('#notif-panel')).toBeNull();
  });
});

describe('icon-only controls have accessible names', () => {
  beforeEach(() => bootApp('/'));

  it('topbar and nav controls expose labels', () => {
    expect($('#nav-toggle').getAttribute('aria-label')).toBeTruthy();
    expect($('#notif-btn').getAttribute('aria-label')).toBeTruthy();
    // Every bare icon button should have an accessible name.
    $$('button').forEach((b) => {
      const hasText = b.textContent.trim().length > 0;
      const hasLabel =
        b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
      expect(hasText || !!hasLabel).toBe(true);
    });
  });
});

describe('action feedback + undo', () => {
  beforeEach(() => bootApp('/requests'));

  it('approving shows a toast with an Undo action', async () => {
    const approve = $('[data-approve]');
    expect(approve).toBeTruthy(); // seed has a request needing my approval
    approve.click();
    await tick();
    const toast = $('.toast');
    expect(toast).toBeTruthy();
    expect($('.toast__undo')).toBeTruthy();
  });

  it('Undo reverts the action', async () => {
    const approve = $('[data-approve]');
    const id = approve.dataset.id;
    approve.click();
    await tick();
    // After approval the session should no longer need my approval.
    // Clicking Undo restores the prior (pending-needs-me) state.
    $('.toast__undo').click();
    await tick();
    // The requests page re-renders with the approve button back.
    const restored = $(`[data-approve][data-id="${id}"]`);
    expect(restored).toBeTruthy();
  });
});
