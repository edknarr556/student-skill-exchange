import { icon } from './icons.js';
import { avatar, esc, fmtDateTime, termsLabel, statusBadge } from '../utils.js';
import {
  getSession,
  getStudent,
  needsMyApproval,
  CURRENT_USER_ID,
} from '../store/state.js';

/**
 * Renders the agreement card embedded in a chat message.
 * Shows terms, each participant's approval state, and — importantly — the
 * approve/decline controls only when the current user still needs to act.
 * Buttons use data-approve / data-decline (data-id = session id).
 */
export function agreementCard(sessionId) {
  const session = getSession(sessionId);
  if (!session) return '';

  const tutor = getStudent(session.tutorId);
  const student = getStudent(session.studentId);
  const badge = statusBadge(session.status);
  const mineToApprove = needsMyApproval(session);

  const approvalChip = (user) => {
    const ok = session.approvals[user.id];
    return `<span class="badge ${ok ? 'badge--green' : 'badge--amber'}">
      ${ok ? icon('check', { size: 12 }) : icon('hourglass', { size: 12 })}
      ${esc(user.id === CURRENT_USER_ID ? 'You' : user.name.split(' ')[0])}
      ${ok ? 'approved' : 'pending'}
    </span>`;
  };

  let foot = '';
  if (session.status === 'declined') {
    foot = `<div class="badge badge--red" style="width:100%;justify-content:center;padding:8px">This agreement was declined</div>`;
  } else if (session.status === 'confirmed') {
    foot = `<div class="badge badge--green" style="width:100%;justify-content:center;padding:8px">${icon(
      'checkCircle',
      { size: 14 }
    )} Confirmed — both students approved</div>`;
  } else if (session.status === 'completed') {
    foot = `<div class="badge badge--navy" style="width:100%;justify-content:center;padding:8px">Session completed</div>`;
  } else if (mineToApprove) {
    foot = `
      <div class="agreement__foot">
        <button class="btn btn--success btn--sm" data-approve data-id="${esc(
          session.id
        )}">${icon('check', { size: 15 })} Approve terms</button>
        <button class="btn btn--danger btn--sm" data-decline data-id="${esc(
          session.id
        )}">Decline</button>
      </div>`;
  } else {
    foot = `<div class="badge badge--amber" style="width:100%;justify-content:center;padding:8px">${icon(
      'hourglass',
      { size: 14 }
    )} Waiting for the other student to approve</div>`;
  }

  return `
    <div class="agreement">
      <div class="agreement__head">
        ${icon('handshake', { size: 17 })} Session agreement
        <span class="badge ${badge.cls}" style="margin-left:auto">${
    badge.label
  }</span>
      </div>
      <div class="agreement__body">
        <div class="agreement__grid">
          <div><div class="agreement__k">Skill</div><div class="agreement__v">${esc(
            session.skill
          )}</div></div>
          <div><div class="agreement__k">Tutor</div><div class="agreement__v">${esc(
            tutor ? tutor.name.split(' ')[0] : '—'
          )}</div></div>
          <div><div class="agreement__k">When</div><div class="agreement__v">${fmtDateTime(
            session.datetime
          )}</div></div>
          <div><div class="agreement__k">Duration</div><div class="agreement__v">${
            session.durationMin
          } min</div></div>
          <div><div class="agreement__k">Terms</div><div class="agreement__v">${esc(
            termsLabel(session)
          )}</div></div>
          <div><div class="agreement__k">Requested by</div><div class="agreement__v">${esc(
            student ? student.name.split(' ')[0] : '—'
          )}</div></div>
        </div>
        ${
          session.note
            ? `<p class="muted" style="font-size:.84rem;margin-bottom:12px">“${esc(
                session.note
              )}”</p>`
            : ''
        }
        <div class="agreement__approvals">
          ${approvalChip({ id: session.studentId, name: student?.name || '' })}
          ${approvalChip({ id: session.tutorId, name: tutor?.name || '' })}
        </div>
        ${foot}
      </div>
    </div>
  `;
}
