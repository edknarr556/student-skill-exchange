import './styles/theme.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import {
  registerRoutes,
  onRouteChange,
  startRouter,
  setNotFound,
} from './router.js';
import { renderShell, mountShell } from './components/layout.js';
import { initStore } from './store/state.js';
import { applyTheme, watchSystemTheme } from './store/theme.js';

import { renderDashboard, mountDashboard } from './pages/dashboard.js';
import { renderBrowse, mountBrowse } from './pages/browse.js';
import { renderProfile, mountProfile } from './pages/profile.js';
import { renderMessaging, mountMessaging } from './pages/messaging.js';
import { renderRequests, mountRequests } from './pages/requests.js';
import { renderSessions, mountSessions } from './pages/sessions.js';
import { renderAppearance, mountAppearance } from './pages/appearance.js';

// Apply the saved theme (the inline <head> script already did this before
// paint; re-applying keeps the DOM authoritative) and follow the OS while
// in system mode.
applyTheme();
watchSystemTheme();

// Seed LocalStorage on first run.
initStore();

const app = document.getElementById('app');

// Each route returns inner page HTML; `mount` wires events after injection.
registerRoutes([
  { path: '/', render: renderDashboard },
  { path: '/browse', render: renderBrowse },
  { path: '/messages', render: renderMessaging },
  { path: '/messages/:id', render: renderMessaging },
  { path: '/requests', render: renderRequests },
  { path: '/sessions', render: renderSessions },
  { path: '/profile', render: renderProfile },
  { path: '/profile/:id', render: renderProfile },
  { path: '/appearance', render: renderAppearance },
]);

setNotFound(
  () => `
  <div class="page">
    <div class="empty">
      <div class="empty__icon">🤔</div>
      <h3>Page not found</h3>
      <p><a class="link" href="#/">Return to the dashboard</a></p>
    </div>
  </div>`
);

const MOUNTS = {
  '/': mountDashboard,
  '/browse': mountBrowse,
  '/messages': mountMessaging,
  '/requests': mountRequests,
  '/sessions': mountSessions,
  '/profile': mountProfile,
  '/appearance': mountAppearance,
};

function mountFor(path, params) {
  if (path.startsWith('/messages')) return mountMessaging(params);
  if (path.startsWith('/profile')) return mountProfile(params);
  const fn = MOUNTS[path];
  if (fn) fn(params);
}

onRouteChange(({ path, html, params }) => {
  // Re-render the whole shell so sidebar badges / active state stay in sync.
  app.innerHTML = renderShell(html);
  mountShell();
  mountFor(path, params);
});

startRouter();
