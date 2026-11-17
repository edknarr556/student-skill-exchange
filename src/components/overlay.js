/**
 * Central registry for transient UI — modals, notification panels, dropdown
 * menus, popovers. Every transient surface registers a close handler here so
 * that a single call (on each route change) can tear them all down.
 *
 * This guarantees the acceptance criterion: no modal, drawer, notification
 * panel, or dropdown remains open after route navigation.
 */
const open = new Set();

/**
 * Register a transient surface. `close` must be idempotent.
 * Returns an unregister function to call once the surface is gone.
 */
export function registerOverlay(close) {
  open.add(close);
  return () => open.delete(close);
}

/** Close every registered transient surface. Called by the router. */
export function closeAllOverlays() {
  // Copy first: close handlers mutate the set as they unregister.
  [...open].forEach((close) => {
    try {
      close();
    } catch (e) {
      /* ignore */
    }
  });
  open.clear();
}

export function hasOpenOverlays() {
  return open.size > 0;
}

/* ------------------------------------------------------------------ *
 * Focus management helpers shared by dialogs and menus.
 * ------------------------------------------------------------------ */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Get focusable descendants of a container, in DOM order. */
export function focusableWithin(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

/**
 * Trap Tab focus inside `container`. Returns a cleanup function.
 * Also moves initial focus to the first sensible target.
 */
export function trapFocus(container, { initial } = {}) {
  const onKeydown = (e) => {
    if (e.key !== 'Tab') return;
    const items = focusableWithin(container);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', onKeydown);

  // Initial focus
  const target =
    initial ||
    container.querySelector('[data-autofocus]') ||
    focusableWithin(container)[0] ||
    container;
  // Defer so the element is laid out.
  requestAnimationFrame(() => {
    try {
      target.focus({ preventScroll: true });
    } catch (e) {
      /* ignore */
    }
  });

  return () => container.removeEventListener('keydown', onKeydown);
}
