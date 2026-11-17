import { icon } from '../components/icons.js';
import { tutorCard } from '../components/tutorCard.js';
import { sessionRow } from '../components/sessionCard.js';
import { esc } from '../utils.js';
import {
  getCurrentUser,
  getRecommendedTutors,
  getSessionsByStatus,
  getMySessions,
  pendingForMeCount,
  needsMyApproval,
} from '../store/state.js';
import { navigate } from '../router.js';
import { bindTutorActions, bindSessionActions } from './shared.js';

export function renderDashboard() {
  const me = getCurrentUser();
  const first = me.name.split(' ')[0];

  const upcoming = getSessionsByStatus('confirmed')
    .filter((s) => new Date(s.datetime) > new Date())
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const pending = getMySessions()
    .filter((s) => s.status === 'pending')
    .sort((a, b) => Number(needsMyApproval(b)) - Number(needsMyApproval(a)));
  const completedCount = getSessionsByStatus('completed').length;
  const recos = getRecommendedTutors(3);
  const needApproval = pendingForMeCount();

  const stats = [
    {
      n: upcoming.length,
      label: 'Upcoming sessions',
      icon: 'calendar',
      tint: 'tint-navy',
    },
    {
      n: needApproval,
      label: 'Awaiting your approval',
      icon: 'handshake',
      tint: 'tint-amber',
    },
    {
      n: completedCount,
      label: 'Sessions completed',
      icon: 'checkCircle',
      tint: 'tint-green',
    },
    {
      n: me.sessionsTaught,
      label: 'You have taught',
      icon: 'award',
      tint: 'tint-violet',
    },
  ];

  return `
    <div class="page">
      <section class="hero mb">
        <span class="eyebrow" style="color:#9fc7f5">Welcome back</span>
        <h1>Good to see you, ${esc(first)} 👋</h1>
        <p>You have ${
          needApproval
            ? `<strong style="color:#fff">${needApproval} request${
                needApproval > 1 ? 's' : ''
              }</strong> waiting on your approval and `
            : ''
        }${upcoming.length} upcoming session${
    upcoming.length === 1 ? '' : 's'
  }. Find a new tutor or offer your own skills to the campus.</p>
        <div class="hero__actions">
          <button class="btn btn--subtle" data-go="/browse">${icon('compass', {
            size: 17,
          })} Browse skills</button>
          <button class="btn btn--ghost" data-go="/requests">${icon(
            'handshake',
            { size: 17 }
          )} Review requests</button>
          <button class="btn btn--ghost" data-go="/messages">${icon('chat', {
            size: 17,
          })} Open messages</button>
        </div>
      </section>

      <section class="grid grid--cards mb" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        ${stats
          .map(
            (s) => `
          <div class="card stat">
            <span class="stat__icon ${s.tint}">${icon(s.icon, { size: 22 })}</span>
            <div>
              <div class="stat__num">${s.n}</div>
              <div class="stat__label">${s.label}</div>
            </div>
          </div>`
          )
          .join('')}
      </section>

      <div class="dash-grid">
        <div class="stack">
          <section class="card card--pad">
            <div class="card__head">
              <h3>${icon('calendar')} Upcoming sessions</h3>
              <span class="link" data-go="/sessions">View all</span>
            </div>
            ${
              upcoming.length
                ? upcoming
                    .slice(0, 3)
                    .map((s) => sessionRow(s))
                    .join('')
                : emptyState(
                    'calendar',
                    'No upcoming sessions',
                    'Book a tutor from Browse Skills to get started.'
                  )
            }
          </section>

          <section class="card card--pad">
            <div class="card__head">
              <h3>${icon('sparkles')} Recommended for you</h3>
              <span class="link" data-go="/browse">See marketplace</span>
            </div>
            <p class="muted" style="margin:-8px 0 16px;font-size:.86rem">
              Based on the skills you want to learn.
            </p>
            <div class="grid grid--cards">
              ${recos.map(tutorCard).join('')}
            </div>
          </section>
        </div>

        <aside class="stack">
          <section class="card card--pad">
            <div class="card__head">
              <h3>${icon('handshake')} Pending requests</h3>
              ${
                needApproval
                  ? `<span class="badge badge--amber">${needApproval} to review</span>`
                  : ''
              }
            </div>
            ${
              pending.length
                ? pending.map((s) => sessionRow(s)).join('')
                : emptyState(
                    'inbox',
                    'Nothing pending',
                    'Requests awaiting approval will show up here.'
                  )
            }
          </section>

          <section class="card card--pad">
            <div class="card__head"><h3>${icon('trending')} Quick actions</h3></div>
            <div class="stack" style="gap:10px">
              ${quickAction('compass', 'Find a tutor', 'Search the marketplace', '/browse')}
              ${quickAction('handshake', 'Review agreements', 'Approve or negotiate terms', '/requests')}
              ${quickAction('user', 'Edit your profile', 'Update skills & availability', '/profile')}
              ${quickAction('chat', 'Open messages', 'Chat with your tutors', '/messages')}
            </div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function quickAction(ic, title, sub, path) {
  return `
    <button class="row-item" data-go="${path}" style="width:100%;text-align:left;cursor:pointer">
      <span class="stat__icon tint-navy" style="width:40px;height:40px">${icon(
        ic,
        { size: 19 }
      )}</span>
      <div class="row-item__body">
        <div class="row-item__title">${title}</div>
        <div class="muted" style="font-size:.8rem">${sub}</div>
      </div>
      ${icon('arrowRight', { size: 18, cls: '' })}
    </button>`;
}

function emptyState(ic, title, text) {
  return `
    <div class="empty">
      <div class="empty__icon">${icon(ic, { size: 28 })}</div>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>`;
}

export function mountDashboard() {
  const view = document.getElementById('view');
  view.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', () => navigate(el.dataset.go))
  );
  bindTutorActions(view);
  bindSessionActions(view);
}
