import { icon } from '../components/icons.js';
import { sessionRow } from '../components/sessionCard.js';
import { getMySessions, needsMyApproval } from '../store/state.js';
import { isFuture } from '../utils.js';
import { bindSessionActions } from './shared.js';
import { navigate } from '../router.js';

// Active tab persists across re-renders.
let activeTab = 'upcoming';

export function renderSessions(_params, query) {
  if (query.tab) activeTab = query.tab;
  const all = getMySessions();

  const groups = {
    upcoming: all
      .filter((s) => s.status === 'confirmed' && isFuture(s.datetime))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    pending: all
      .filter((s) => s.status === 'pending')
      .sort((a, b) => Number(needsMyApproval(b)) - Number(needsMyApproval(a))),
    completed: all
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)),
    declined: all
      .filter((s) => s.status === 'declined')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', icon: 'calendar' },
    { key: 'pending', label: 'Pending', icon: 'hourglass' },
    { key: 'completed', label: 'Completed', icon: 'checkCircle' },
    { key: 'declined', label: 'Declined', icon: 'x' },
  ];

  if (!groups[activeTab]) activeTab = 'upcoming';
  const list = groups[activeTab];

  const empties = {
    upcoming: ['calendar', 'No upcoming sessions', 'Confirmed sessions in the future show up here. Browse tutors to book one.'],
    pending: ['hourglass', 'No pending sessions', 'Requests awaiting approval from either side appear here.'],
    completed: ['checkCircle', 'No completed sessions yet', 'Sessions you mark as done will be listed here.'],
    declined: ['x', 'No declined sessions', 'Declined or cancelled requests appear here.'],
  };

  return `
    <div class="page">
      <div class="page__head">
        <div>
          <span class="eyebrow">Schedule</span>
          <h1>My sessions</h1>
          <p>Track everything you're learning and teaching in one place.</p>
        </div>
        <button class="btn btn--primary" data-go="/browse">${icon('plus', {
          size: 17,
        })} Book a session</button>
      </div>

      <div class="tabs">
        ${tabs
          .map(
            (t) => `
          <button class="tab ${t.key === activeTab ? 'is-active' : ''}" data-tab="${
              t.key
            }">
            ${icon(t.icon, { size: 15 })} ${t.label}
            <span class="tab__count">${groups[t.key].length}</span>
          </button>`
          )
          .join('')}
      </div>

      <div id="session-list">
        ${
          list.length
            ? list.map((s) => sessionRow(s)).join('')
            : `<div class="card card--pad"><div class="empty">
                 <div class="empty__icon">${icon(empties[activeTab][0], {
                   size: 28,
                 })}</div>
                 <h3>${empties[activeTab][1]}</h3>
                 <p>${empties[activeTab][2]}</p>
               </div></div>`
        }
      </div>
    </div>
  `;
}

export function mountSessions() {
  const view = document.getElementById('view');
  view.querySelectorAll('[data-tab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      navigate('/sessions');
    })
  );
  view.querySelectorAll('[data-go]').forEach((el) =>
    el.addEventListener('click', () => navigate(el.dataset.go))
  );
  bindSessionActions(view);
}
