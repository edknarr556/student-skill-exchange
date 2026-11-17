import { icon } from './icons.js';
import { avatar, esc, fmtRelative } from '../utils.js';
import {
  getCurrentUser,
  pendingForMeCount,
  unreadMessageCount,
  getNotifications,
  unreadNotificationCount,
  markNotificationsRead,
} from '../store/state.js';
import { currentPath, navigate } from '../router.js';
import { openModal } from './modal.js';
import { resetDemo } from '../store/state.js';

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
      item.path === '/'
        ? path === '/'
        : path.startsWith(item.path);
    let badge = '';
    if (item.badge === 'pending' && pending)
      badge = `<span class="nav__badge">${pending}</span>`;
    if (item.badge === 'messages' && unreadMsgs)
      badge = `<span class="nav__badge">${unreadMsgs}</span>`;
    return `
      <a class="nav__link ${active ? 'is-active' : ''}" href="#${item.path}">
        ${icon(item.icon, { size: 19 })}
        <span>${item.label}</span>
        ${badge}
      </a>`;
  }).join('');

  return `
    <div class="app-shell" id="shell">
      <div class="scrim" data-close-nav></div>
      <aside class="sidebar">
        <div class="brand">
          <div class="brand__logo">${icon('book', { size: 21, cls: '' })}</div>
          <div class="brand__name">Skill Exchange<span>Riverside State</span></div>
        </div>
        <nav class="nav">
          <div class="nav__label">Menu</div>
          ${navItems}
        </nav>
        <div class="sidebar__footer">
          <div class="sidebar__card">
            <h4>Prototype demo</h4>
            <p>Data is saved in your browser. Reset to restore the sample content.</p>
            <button class="btn btn--subtle btn--sm btn--block" id="reset-demo">Reset demo data</button>
          </div>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="topbar__menu" id="nav-toggle" aria-label="Open menu">${icon(
            'menu',
            { size: 20 }
          )}</button>
          <div class="topbar__search">
            ${icon('search', { size: 18 })}
            <input id="global-search" type="search" placeholder="Search tutors, skills, subjects…" />
          </div>
          <div class="topbar__right">
            <button class="icon-btn" id="notif-btn" aria-label="Notifications">
              ${icon('bell', { size: 20 })}
              ${unreadNotifs ? '<span class="icon-btn__dot"></span>' : ''}
            </button>
            <a class="topbar__user" href="#/profile">
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

  // Mobile nav
  const toggle = document.getElementById('nav-toggle');
  toggle?.addEventListener('click', () => shell.classList.toggle('nav-open'));
  shell?.querySelector('[data-close-nav]')?.addEventListener('click', () =>
    shell.classList.remove('nav-open')
  );
  // Close mobile nav after navigating
  shell?.querySelectorAll('.nav__link').forEach((a) =>
    a.addEventListener('click', () => shell.classList.remove('nav-open'))
  );

  // Global search -> Browse page with query
  const search = document.getElementById('global-search');
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/browse?q=${encodeURIComponent(e.target.value.trim())}`);
      e.target.value = '';
    }
  });

  // Notifications
  document.getElementById('notif-btn')?.addEventListener('click', openNotifications);

  // Reset demo
  document.getElementById('reset-demo')?.addEventListener('click', () => {
    openModal({
      title: 'Reset demo data?',
      subtitle: 'This restores the original sample students, chats and sessions.',
      body: '<p class="muted">Any changes you made in this browser will be cleared.</p>',
      footer: `
        <button class="btn btn--ghost" data-close>Keep my data</button>
        <button class="btn btn--primary" id="confirm-reset">Reset to sample</button>`,
      onMount(root, close) {
        root.querySelector('#confirm-reset').addEventListener('click', () => {
          resetDemo();
          close();
          navigate('/');
        });
      },
    });
  });
}

function openNotifications() {
  const notifs = getNotifications();
  const list = notifs.length
    ? notifs
        .map(
          (n) => `
      <div class="row-item" style="padding:12px 14px">
        <span class="stat__icon ${n.read ? 'tint-navy' : 'tint-amber'}" style="width:36px;height:36px">
          ${icon('bell', { size: 17 })}
        </span>
        <div class="row-item__body">
          <div style="font-weight:${n.read ? 500 : 600};font-size:.88rem">${esc(
            n.text
          )}</div>
          <div class="muted" style="font-size:.76rem">${fmtRelative(n.at)}</div>
        </div>
      </div>`
        )
        .join('')
    : '<div class="empty"><p>No notifications yet.</p></div>';

  openModal({
    title: 'Notifications',
    body: `<div class="stack" style="gap:8px">${list}</div>`,
    onMount() {
      // Mark read on open; refresh dot on close via route re-render.
      markNotificationsRead();
    },
  });
}
