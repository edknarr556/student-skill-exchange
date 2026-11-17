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

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = `
    <div id="app"></div>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;
  window.location.hash = '';
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any leftover popovers appended to <body>.
  document
    .querySelectorAll('.popover, .modal-overlay, .toast')
    .forEach((el) => el.remove());
});
