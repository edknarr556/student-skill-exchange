import { icon } from '../components/icons.js';
import { sessionRow } from '../components/sessionCard.js';
import {
  getMySessions,
  needsMyApproval,
  counterpartId,
  ensureConversation,
} from '../store/state.js';
import { bindSessionActions } from './shared.js';
import { navigate } from '../router.js';

/**
 * Session Requests & Agreements.
 * Split into: needs my approval / awaiting them / resolved.
 * The business rule (both must approve) is surfaced front and center.
 */
export function renderRequests() {
  const sessions = getMySessions();
  const needMe = sessions.filter(needsMyApproval);
  const awaitingThem = sessions.filter(
    (s) => s.status === 'pending' && !needsMyApproval(s)
  );
  const resolved = sessions
    .filter((s) => s.status !== 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return `
    <div class="page">
      <div class="page__head">
        <div>
          <span class="eyebrow">Agreements</span>
          <h1>Session requests & agreements</h1>
          <p>Both students must approve the terms before a session is confirmed.</p>
        </div>
      </div>

      <section class="card card--pad mb" style="background:linear-gradient(120deg,var(--sky-soft),#fff);border-color:var(--sky-soft)">
        <div class="row" style="gap:12px;align-items:flex-start">
          <span class="stat__icon tint-navy">${icon('handshake', {
            size: 22,
          })}</span>
          <div>
            <h3 style="margin-bottom:2px">How agreements work</h3>
            <p class="muted" style="font-size:.88rem;max-width:70ch">
              A request proposes the skill, time and terms (money or skill swap).
              Chat to negotiate, then <strong>both of you approve</strong>. Only then does the
              session move to <span class="badge badge--green">Confirmed</span>.
            </p>
          </div>
        </div>
      </section>

      <section class="mb">
        <div class="card__head">
          <h3>${icon('bell')} Needs your approval ${
    needMe.length ? `<span class="badge badge--amber">${needMe.length}</span>` : ''
  }</h3>
        </div>
        ${
          needMe.length
            ? needMe.map((s) => sessionRow(s)).join('')
            : emptyState('checkCircle', 'All caught up', 'No agreements are waiting on you right now.')
        }
      </section>

      <section class="mb">
        <div class="card__head">
          <h3>${icon('hourglass')} Awaiting the other student</h3>
        </div>
        ${
          awaitingThem.length
            ? awaitingThem.map((s) => sessionRow(s)).join('')
            : emptyState('clock', 'Nothing pending on their side', 'Proposals waiting on the other student will appear here.')
        }
      </section>

      <section>
        <div class="card__head">
          <h3>${icon('inbox')} Resolved agreements</h3>
        </div>
        ${
          resolved.length
            ? resolved.map((s) => sessionRow(s)).join('')
            : emptyState('inbox', 'No resolved agreements yet', 'Confirmed, declined and completed sessions land here.')
        }
      </section>
    </div>
  `;
}

function emptyState(ic, title, text) {
  return `
    <div class="card card--pad">
      <div class="empty">
        <div class="empty__icon">${icon(ic, { size: 28 })}</div>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
    </div>`;
}

export function mountRequests() {
  const view = document.getElementById('view');
  bindSessionActions(view);
}
