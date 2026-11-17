import { icon } from './icons.js';
import {
  avatar,
  esc,
  fmtDateTime,
  termsLabel,
  statusBadge,
} from '../utils.js';
import {
  getStudent,
  counterpartId,
  needsMyApproval,
  CURRENT_USER_ID,
} from '../store/state.js';

/**
 * A session row used on My Sessions, Dashboard and Requests.
 * Action buttons use data attributes resolved by the page/global handler:
 *   [data-approve], [data-decline], [data-complete], [data-open-chat],
 *   [data-view-session]  — each with data-id="<sessionId>".
 */
export function sessionRow(session, { showActions = true } = {}) {
  const other = getStudent(counterpartId(session));
  const iAmTutor = session.tutorId === CURRENT_USER_ID;
  const roleLabel = iAmTutor ? 'You are tutoring' : 'Tutor';
  const badge = statusBadge(session.status);
  const mineToApprove = needsMyApproval(session);

  return `
    <div class="row-item">
      ${avatar(other, 'avatar--sm')}
      <div class="row-item__body">
        <div class="row-item__title">${esc(session.skill)}
          <span class="badge ${badge.cls}" style="margin-left:6px">${
    badge.label
  }</span>
          ${
            mineToApprove
              ? `<span class="badge badge--amber" style="margin-left:4px">Needs your approval</span>`
              : ''
          }
        </div>
        <div class="row-item__sub">
          <span>${icon('user', { size: 14 })} ${roleLabel}: ${esc(
    other ? other.name : 'Unknown'
  )}</span>
          <span>${icon('calendar', { size: 14 })} ${fmtDateTime(
    session.datetime
  )}</span>
          <span>${
            session.type === 'exchange'
              ? icon('swap', { size: 14 })
              : icon('dollar', { size: 14 })
          } ${esc(termsLabel(session))}</span>
        </div>
      </div>
      ${showActions ? actions(session, mineToApprove) : ''}
    </div>
  `;
}

function actions(session, mineToApprove) {
  const id = esc(session.id);
  const buttons = [];

  if (session.status === 'pending' && mineToApprove) {
    buttons.push(
      `<button class="btn btn--success btn--sm" data-approve data-id="${id}">${icon(
        'check',
        { size: 15 }
      )} Approve</button>`
    );
    buttons.push(
      `<button class="btn btn--danger btn--sm" data-decline data-id="${id}">Decline</button>`
    );
  } else if (session.status === 'pending') {
    buttons.push(
      `<span class="badge badge--amber">${icon('hourglass', {
        size: 13,
      })} Awaiting their approval</span>`
    );
    buttons.push(
      `<button class="btn btn--danger btn--sm" data-decline data-id="${id}">Cancel</button>`
    );
  } else if (session.status === 'confirmed') {
    buttons.push(
      `<button class="btn btn--ghost btn--sm" data-open-chat data-id="${id}">${icon(
        'chat',
        { size: 15 }
      )} Message</button>`
    );
    buttons.push(
      `<button class="btn btn--subtle btn--sm" data-complete data-id="${id}">Mark done</button>`
    );
  } else if (session.status === 'declined') {
    buttons.push(
      `<button class="btn btn--ghost btn--sm" data-reopen data-id="${id}">Re-request</button>`
    );
  } else if (session.status === 'completed') {
    buttons.push(
      `<button class="btn btn--ghost btn--sm" data-open-chat data-id="${id}">${icon(
        'chat',
        { size: 15 }
      )} Message</button>`
    );
  }

  return `<div class="row-item__actions">${buttons.join('')}</div>`;
}
