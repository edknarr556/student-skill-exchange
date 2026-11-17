/**
 * Boots the real application into jsdom for interaction tests. Mirrors the
 * route-registration + render/mount flow in src/main.js (without importing the
 * CSS side-effects from main.js).
 */
import {
  registerRoutes,
  onRouteChange,
  startRouter,
  setNotFound,
  navigate,
} from '../src/router.js';
import { renderShell, mountShell } from '../src/components/layout.js';
import { initStore } from '../src/store/state.js';

import { renderDashboard, mountDashboard } from '../src/pages/dashboard.js';
import { renderBrowse, mountBrowse } from '../src/pages/browse.js';
import { renderProfile, mountProfile } from '../src/pages/profile.js';
import { renderMessaging, mountMessaging } from '../src/pages/messaging.js';
import { renderRequests, mountRequests } from '../src/pages/requests.js';
import { renderSessions, mountSessions } from '../src/pages/sessions.js';

let routesRegistered = false;

export function bootApp(initialHash = '/') {
  initStore();

  // Routes are global state in the router module; register them once.
  if (!routesRegistered) {
    registerRoutes([
      { path: '/', render: renderDashboard },
      { path: '/browse', render: renderBrowse },
      { path: '/messages', render: renderMessaging },
      { path: '/messages/:id', render: renderMessaging },
      { path: '/requests', render: renderRequests },
      { path: '/sessions', render: renderSessions },
      { path: '/profile', render: renderProfile },
      { path: '/profile/:id', render: renderProfile },
    ]);
    setNotFound(() => '<div class="page">not found</div>');
    routesRegistered = true;
  }

  const MOUNTS = {
    '/': mountDashboard,
    '/browse': mountBrowse,
    '/requests': mountRequests,
    '/sessions': mountSessions,
  };
  // Re-bind the render callback each boot so it resolves the *current* #app
  // (the DOM is recreated between tests).
  onRouteChange(({ path, html, params }) => {
    const app = document.getElementById('app');
    app.innerHTML = renderShell(html);
    mountShell();
    if (path.startsWith('/messages')) mountMessaging(params);
    else if (path.startsWith('/profile')) mountProfile(params);
    else MOUNTS[path]?.(params);
  });

  // Set the hash first, then start. startRouter() renders synchronously; we
  // also flush the async `hashchange` the assignment queues so it fires now
  // (not in the middle of a later interaction).
  window.location.hash = initialHash;
  startRouter();
  return flushHashChange();
}

/**
 * jsdom queues a `hashchange` when location.hash is assigned. Flush it so the
 * router's close-overlays-on-navigation doesn't fire during a later step.
 */
function flushHashChange() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export { navigate };

/** Convenience query helpers. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) =>
  Array.from(root.querySelectorAll(sel));

/** Set the jsdom viewport width and dispatch resize. */
export function setViewport(width, height = 800) {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
}

/** Wait a macrotask so deferred (rAF/setTimeout 0) work completes. */
export function tick(ms = 0) {
  return new Promise((r) => setTimeout(r, ms));
}
