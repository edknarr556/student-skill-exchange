import { icon } from './icons.js';
import { avatar, esc, fmtRelative } from '../utils.js';
import {
  getCurrentUser,
  pendingForMeCount,
  unreadMessageCount,
  getNotifications,
  unreadNotificationCount,
  markNotificationsRead,
  notificationLink,
  resetDemo,
} from '../store/state.js';
import { currentPath, navigate } from '../router.js';
import { openModal } from './modal.js';
import { registerOverlay, trapFocus } from './overlay.js';

const NAV = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/browse', label: 'Browse Skills', icon: 'compass' },
  { path: '/messages', label: 'Messaging', icon: 'chat', badge: 'messages' },
  { path: '/requests', label: 'Requests', icon: 'handshake', badge: 'pending' },
  { path: '/sessions', label: 'My Sessions', icon: 'calendar' },
  { path: '/profile', label: 'My Profile', icon: 'user' },
];

/** Returns the full shell markup with `innerHtml` injected into the content. */
export function renderShell(innerHtml) {
  const me = getCurrentUser();
  const path = currentPath();
  const pending = pendingForMeCount();
  const unreadMsgs = unreadMessageCount();
  const unreadNotifs = unreadNotificationCount();

  const navItems = NAV.map((item) => {
    const active =
      item.path === '/' ? path === '/' : path.startsWith(item.path);
    let badge = '';
    if (item.badge === 'pending' && pending)
      badge = `<span class="nav__badge" aria-label="${pending} awaiting approval">${pending}</span>`;
    if (item.badge === 'messages' && unreadMsgs)
      badge = `<span class="nav__badge" aria-label="${unreadMsgs} unread">${unreadMsgs}</span>`;
    return `
      <a class="nav__link ${active ? 'is-active' : ''}" href="#${item.path}"
         ${active ? 'aria-current="page"' : ''}>
        ${icon(item.icon, { size: 19 })}
        <span class="nav__text">${item.label}</span>
        ${badge}
      </a>`;
  }).join('');

  return `
    <div class="app-shell" id="shell">
      <div class="scrim" data-close-nav hidden></div>
      <aside class="sidebar" id="sidebar" aria-label="Primary">
        <div class="brand">
          <div class="brand__logo" aria-hidden="true">${icon('book', {
            size: 21,
          })}</div>
          <div class="brand__name">Skill Exchange<span>Riverside State</span></div>
          <button class="sidebar__close" id="nav-close" type="button"
            aria-label="Close menu">${icon('x', { size: 20 })}</button>
        </div>
        <nav class="nav" aria-label="Main navigation">
          <div class="nav__label">Menu</div>
          ${navItems}
        </nav>
        <div class="sidebar__footer">
          <button class="demo-trigger" id="demo-menu-btn" type="button"
            aria-haspopup="menu" aria-expanded="false" aria-controls="demo-menu">
            <span class="demo-trigger__dot" aria-hidden="true"></span>
            <span class="flex-1">Demo mode</span>
            ${icon('info', { size: 16 })}
          </button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="topbar__menu" id="nav-toggle" type="button"
            aria-label="Open navigation menu" aria-controls="sidebar"
            aria-expanded="false">${icon('menu', { size: 20 })}</button>
          <div class="topbar__search">
            <label for="global-search" class="sr-only">Search tutors, skills, subjects</label>
            ${icon('search', { size: 18 })}
            <input id="global-search" type="search"
              placeholder="Search tutors, skills, subjects…" />
          </div>
          <div class="topbar__right">
            <button class="icon-btn" id="notif-btn" type="button"
              aria-label="Notifications${
                unreadNotifs ? `, ${unreadNotifs} unread` : ''
              }" aria-haspopup="dialog" aria-expanded="false"
              aria-controls="notif-panel">
              ${icon('bell', { size: 20 })}
              ${
                unreadNotifs
                  ? '<span class="icon-btn__dot" aria-hidden="true"></span>'
                  : ''
              }
            </button>
            <a class="topbar__user" href="#/profile" aria-label="Your profile">
              ${avatar(me, 'avatar--sm')}
              <span class="topbar__user-name">${esc(
                me.name
              )}<span>${esc(me.major)}</span></span>
            </a>
          </div>
        </header>
        <main id="view">${innerHtml}</main>
      </div>
    </div>
  `;
}

/** Wire up shell-level interactions after each render. */
export function mountShell() {
  const shell = document.getElementById('shell');
  const scrim = shell?.querySelector('[data-close-nav]');

  /* ---------------- Mobile navigation drawer ---------------- */
  const toggle = document.getElementById('nav-toggle');
  const closeBtn = document.getElementById('nav-close');

  function openNav() {
    shell.classList.add('nav-open');
    toggle?.setAttribute('aria-expanded', 'true');
    if (scrim) scrim.hidden = false;
    // Move focus into the drawer for keyboard users.
    requestAnimationFrame(() =>
      shell.querySelector('.nav__link')?.focus({ preventScroll: true })
    );
  }
  function closeNav() {
    if (!shell.classList.contains('nav-open')) return;
    shell.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (scrim) scrim.hidden = true;
    toggle?.focus({ preventScroll: true });
  }

  toggle?.addEventListener('click', () =>
    shell.classList.contains('nav-open') ? closeNav() : openNav()
  );
  closeBtn?.addEventListener('click', closeNav);
  scrim?.addEventListener('click', closeNav);
  // Selecting a route closes the drawer.
  shell?.querySelectorAll('.nav__link').forEach((a) =>
    a.addEventListener('click', closeNav)
  );
  // Escape closes the drawer when it's open.
  shell?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shell.classList.contains('nav-open')) closeNav();
  });
  // So the router can also dismiss it on navigation.
  registerOverlay(closeNav);

  /* ---------------- Global search ---------------- */
  const search = document.getElementById('global-search');
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/browse?q=${encodeURIComponent(e.target.value.trim())}`);
      e.target.value = '';
    }
  });

  /* ---------------- Notifications ---------------- */
  document
    .getElementById('notif-btn')
    ?.addEventListener('click', openNotifications);

  /* ---------------- Demo menu ---------------- */
  document
    .getElementById('demo-menu-btn')
    ?.addEventListener('click', openDemoMenu);
}

/* ================================================================== *
 * Notifications popover
 * ================================================================== */
function openNotifications() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;
  // Toggle: if already open, close.
  if (btn.getAttribute('aria-expanded') === 'true') return;

  const notifs = getNotifications();
  const panel = document.createElement('div');
  panel.className = 'popover notif-panel';
  panel.id = 'notif-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Notifications');

  const list = notifs.length
    ? notifs
        .map(
          (n) => `
      <button type="button" class="notif ${
        n.read ? '' : 'notif--unread'
      }" data-notif-link="${esc(notificationLink(n))}">
        <span class="stat__icon ${
          n.read ? 'tint-navy' : 'tint-amber'
        }" style="width:34px;height:34px" aria-hidden="true">
          ${icon('bell', { size: 16 })}
        </span>
        <span class="notif__body">
          <span class="notif__text">${esc(n.text)}</span>
          <span class="notif__time">${fmtRelative(n.at)}</span>
        </span>
        ${icon('arrowRight', { size: 15, cls: 'notif__go' })}
      </button>`
        )
        .join('')
    : '<div class="empty" style="padding:28px 16px"><p>No notifications yet.</p></div>';

  panel.innerHTML = `
    <div class="popover__head">
      <h3 id="notif-panel-title">Notifications</h3>
      <button type="button" class="modal__close" data-close aria-label="Close notifications">
        ${icon('x', { size: 18 })}
      </button>
    </div>
    <div class="popover__body">${list}</div>
  `;
  panel.setAttribute('aria-labelledby', 'notif-panel-title');
  document.body.appendChild(panel);
  positionPopover(panel, btn);
  btn.setAttribute('aria-expanded', 'true');

  const releaseTrap = trapFocus(panel);
  let unregister = () => {};
  let readTimer = 0;

  function close() {
    clearTimeout(readTimer);
    releaseTrap();
    panel.remove();
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onOutside, true);
    window.removeEventListener('resize', reposition);
    unregister();
    if (document.contains(btn)) btn.focus({ preventScroll: true });
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }
  function onOutside(e) {
    if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target))
      close();
  }
  function reposition() {
    positionPopover(panel, btn);
  }

  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      close();
      return;
    }
    const entry = e.target.closest('[data-notif-link]');
    if (entry) {
      const dest = entry.dataset.notifLink;
      markNotificationsRead();
      close();
      navigate(dest);
    }
  });

  document.addEventListener('keydown', onKey);
  // Capture-phase so a click anywhere outside closes before other handlers.
  setTimeout(() => document.addEventListener('click', onOutside, true), 0);
  window.addEventListener('resize', reposition);
  unregister = registerOverlay(close);

  // Mark read shortly after opening (so the unread styling is visible briefly).
  readTimer = setTimeout(markNotificationsRead, 1200);
}

/** Position a popover under its trigger, kept within the viewport. */
function positionPopover(panel, trigger) {
  const r = trigger.getBoundingClientRect();
  const width = panel.offsetWidth || 340;
  const margin = 12;
  let left = r.right - width;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const top = Math.min(r.bottom + 8, window.innerHeight - 16);
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

/* ================================================================== *
 * Demo / admin menu (subtle) with destructive reset confirmation
 * ================================================================== */
function openDemoMenu() {
  const btn = document.getElementById('demo-menu-btn');
  if (!btn || btn.getAttribute('aria-expanded') === 'true') return;

  const menu = document.createElement('div');
  menu.className = 'popover demo-menu';
  menu.id = 'demo-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <div class="demo-menu__note">
      This is a frontend prototype. Data is saved in your browser only.
    </div>
    <button type="button" class="demo-menu__item demo-menu__item--danger"
      role="menuitem" data-reset>
      ${icon('logout', { size: 16 })} Reset demo data…
    </button>
  `;
  document.body.appendChild(menu);
  positionDemoMenu(menu, btn);
  btn.setAttribute('aria-expanded', 'true');

  const releaseTrap = trapFocus(menu);
  let unregister = () => {};

  function close() {
    releaseTrap();
    menu.remove();
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onOutside, true);
    unregister();
    if (document.contains(btn)) btn.focus({ preventScroll: true });
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }
  function onOutside(e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) close();
  }

  menu.querySelector('[data-reset]').addEventListener('click', () => {
    close();
    confirmReset();
  });

  document.addEventListener('keydown', onKey);
  setTimeout(() => document.addEventListener('click', onOutside, true), 0);
  unregister = registerOverlay(close);
}

function positionDemoMenu(menu, trigger) {
  const r = trigger.getBoundingClientRect();
  const width = menu.offsetWidth || 240;
  const margin = 12;
  let left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));
  // Prefer opening above the trigger (it sits at the bottom of the sidebar).
  const top = Math.max(margin, r.top - (menu.offsetHeight || 120) - 8);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function confirmReset() {
  openModal({
    title: 'Reset demo data?',
    subtitle: 'This permanently clears your changes in this browser.',
    body: `<p class="muted">The original sample students, chats, and sessions will be
      restored. Anything you created or changed here will be lost. This cannot be undone.</p>`,
    footer: `
      <button class="btn btn--ghost" data-close>Keep my data</button>
      <button class="btn btn--danger-solid" id="confirm-reset" data-autofocus>Reset to sample data</button>`,
    onMount(root, close) {
      root.querySelector('#confirm-reset').addEventListener('click', () => {
        resetDemo();
        close();
        navigate('/');
      });
    },
  });
}
