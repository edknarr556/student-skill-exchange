/**
 * Vitest setup: runs before each test file.
 * Provides the DOM scaffold the app expects and a few jsdom shims.
 */
import { beforeEach, afterEach, vi } from 'vitest';

// jsdom lacks a layout engine; make rAF synchronous-ish so focus/positioning
// code that defers a frame runs within the test tick.
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

// scrollTo / scrollIntoView are not implemented in jsdom (they throw); stub them.
Element.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};

/**
 * Controllable matchMedia mock (jsdom doesn't implement it). Tests flip the
 * OS preference with `setSystemDark(true|false)` from tests/helpers.js.
 */
const mqListeners = new Set();
globalThis.__systemDark = false;
window.matchMedia = (query) => {
  const isDarkQuery = /prefers-color-scheme:\s*dark/.test(query);
  const mql = {
    media: query,
    get matches() {
      return isDarkQuery ? globalThis.__systemDark : !globalThis.__systemDark;
    },
    addEventListener: (_e, cb) => mqListeners.add(cb),
    removeEventListener: (_e, cb) => mqListeners.delete(cb),
    addListener: (cb) => mqListeners.add(cb), // legacy
    removeListener: (cb) => mqListeners.delete(cb),
    dispatchEvent: () => true,
    onchange: null,
  };
  return mql;
};
globalThis.__fireSystemThemeChange = () => {
  mqListeners.forEach((cb) => cb({ matches: globalThis.__systemDark }));
};

beforeEach(() => {
  localStorage.clear();
  globalThis.__systemDark = false;
  document.body.innerHTML = `
    <div id="app"></div>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;
  // Reset theme attributes applied to <html> by previous tests.
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  root.removeAttribute('data-theme-preset');
  root.classList.remove('theme-dark');
  root.style.colorScheme = '';
  window.location.hash = '';
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any leftover popovers appended to <body>.
  document
    .querySelectorAll('.popover, .modal-overlay, .toast')
    .forEach((el) => el.remove());
});
