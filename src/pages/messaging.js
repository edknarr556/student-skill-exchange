import { icon } from '../components/icons.js';
import { agreementCard } from '../components/agreementCard.js';
import { avatar, esc, fmtRelative, fmtTime, dayLabel } from '../utils.js';
import { toast } from '../components/toast.js';
import { openRequestModal } from '../components/requestModal.js';
import {
  getConversations,
  getConversation,
  getStudent,
  sendMessage,
  approveSession,
  declineSession,
  addNotification,
  CURRENT_USER_ID,
} from '../store/state.js';
import { navigate } from '../router.js';

export function renderMessaging(params) {
  const convos = getConversations()
    .map((c) => ({ ...c, student: getStudent(c.withId) }))
    .filter((c) => c.student)
    .sort((a, b) => lastAt(b) - lastAt(a));

  const activeId =
    params.id && getConversation(params.id)
      ? params.id
      : convos[0]
      ? convos[0].id
      : null;
  const active = activeId ? getConversation(activeId) : null;
  const activeStudent = active ? getStudent(active.withId) : null;

  return `
    <div class="page" style="max-width:1100px">
      <div class="page__head">
        <div>
          <span class="eyebrow">Inbox</span>
          <h1>Messaging</h1>
          <p>Discuss and negotiate session arrangements before confirming.</p>
        </div>
      </div>

      <div class="messenger ${activeId ? 'show-chat' : ''}" id="messenger" data-active="${
    activeId || ''
  }">
        <div class="convo-list">
          <div class="convo-list__head">
            <h3>Conversations</h3>
            <div class="convo-search">
              ${icon('search', { size: 16 })}
              <input id="convo-search" type="search" placeholder="Search people…" />
            </div>
          </div>
          <div class="convo-scroll" id="convo-scroll">
            ${
              convos.length
                ? convos.map((c) => convoItem(c, activeId)).join('')
                : '<div class="empty"><p>No conversations yet. Start one from a tutor profile.</p></div>'
            }
          </div>
        </div>

        ${
          active
            ? chatPanel(active, activeStudent)
            : `<div class="chat"><div class="chat-empty">
                 <div class="empty__icon" style="margin:0 auto 12px">${icon(
                   'chat',
                   { size: 28 }
                 )}</div>
                 <h3>Select a conversation</h3>
                 <p>Choose someone on the left to see your messages.</p>
               </div></div>`
        }
      </div>
    </div>
  `;
}

function convoItem(c, activeId) {
  const last = c.messages[c.messages.length - 1];
  const preview = last
    ? last.kind === 'agreement'
      ? '📋 Session agreement'
      : (last.from === CURRENT_USER_ID ? 'You: ' : '') + last.text
    : 'No messages yet';
  const unread = last && last.from !== CURRENT_USER_ID && c.id !== activeId;
  return `
    <div class="convo ${c.id === activeId ? 'is-active' : ''}" data-convo="${esc(
    c.id
  )}">
      ${avatar(c.student, 'avatar--sm')}
      <div class="convo__body">
        <div class="convo__row">
          <span class="convo__name">${esc(c.student.name)}</span>
          <span class="convo__time">${last ? fmtRelative(last.at) : ''}</span>
        </div>
        <div class="convo__row">
          <span class="convo__preview">${esc(preview)}</span>
          ${unread ? '<span class="convo__unread">1</span>' : ''}
        </div>
      </div>
    </div>`;
}

function chatPanel(convo, student) {
  return `
    <div class="chat">
      <div class="chat__head">
        <button class="chat__back" data-back-list aria-label="Back">${icon(
          'arrowLeft',
          { size: 18 }
        )}</button>
        ${avatar(student, 'avatar--sm')}
        <div class="chat__head-info">
          <div class="chat__head-name">${esc(student.name)}</div>
          <div class="chat__head-sub">${esc(student.major)} · ${esc(
    student.year
  )}</div>
        </div>
        <button class="btn btn--ghost btn--sm" data-view-profile data-id="${esc(
          student.id
        )}">${icon('user', { size: 15 })} Profile</button>
        <button class="btn btn--primary btn--sm" data-propose data-id="${esc(
          student.id
        )}">${icon('handshake', { size: 15 })} Propose session</button>
      </div>

      <div class="chat__body" id="chat-body">
        ${renderMessages(convo)}
      </div>

      <div class="chat__foot">
        <textarea class="chat__input" id="chat-input" rows="1"
          placeholder="Write a message… negotiate terms, ask questions."></textarea>
        <button class="chat__send" id="chat-send" aria-label="Send">${icon(
          'send',
          { size: 19 }
        )}</button>
      </div>
    </div>`;
}

function renderMessages(convo) {
  let lastDay = '';
  return convo.messages
    .map((m) => {
      const day = dayLabel(m.at);
      const sep =
        day !== lastDay
          ? `<div class="chat__day">${day}</div>`
          : '';
      lastDay = day;

      if (m.kind === 'agreement') {
        return sep + agreementCard(m.sessionId);
      }
      const mine = m.from === CURRENT_USER_ID;
      return (
        sep +
        `<div class="bubble ${mine ? 'bubble--me' : 'bubble--them'}">
          ${esc(m.text)}
          <span class="bubble__time">${fmtTime(m.at)}</span>
        </div>`
      );
    })
    .join('');
}

function lastAt(c) {
  const last = c.messages[c.messages.length - 1];
  return last ? new Date(last.at).getTime() : 0;
}

export function mountMessaging(params) {
  const view = document.getElementById('view');
  const messenger = view.querySelector('#messenger');
  const activeId = messenger?.dataset.active || null;

  // Switch conversation
  view.querySelectorAll('[data-convo]').forEach((el) =>
    el.addEventListener('click', () =>
      navigate(`/messages/${el.dataset.convo}`)
    )
  );

  // Mobile back to list
  view.querySelector('[data-back-list]')?.addEventListener('click', () =>
    navigate('/messages')
  );

  // Filter conversation list
  const search = view.querySelector('#convo-search');
  search?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    view.querySelectorAll('.convo').forEach((el) => {
      const name = el.querySelector('.convo__name').textContent.toLowerCase();
      el.style.display = name.includes(q) ? '' : 'none';
    });
  });

  // Profile + propose buttons in chat header
  view.querySelector('[data-view-profile]')?.addEventListener('click', (e) => {
    navigate(`/profile/${e.currentTarget.dataset.id}`);
  });
  view.querySelector('[data-propose]')?.addEventListener('click', (e) => {
    openRequestModal(e.currentTarget.dataset.id);
  });

  // Scroll chat to bottom
  const body = view.querySelector('#chat-body');
  if (body) body.scrollTop = body.scrollHeight;

  // Send message
  const input = view.querySelector('#chat-input');
  const send = view.querySelector('#chat-send');
  function doSend() {
    const text = input.value.trim();
    if (!text || !activeId) return;
    sendMessage(activeId, { text });
    navigate(`/messages/${activeId}`); // re-render
  }
  send?.addEventListener('click', doSend);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });
  // Auto-grow textarea
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  // Approve / decline agreement cards inside chat
  view.querySelector('#chat-body')?.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('[data-approve]');
    const declineBtn = e.target.closest('[data-decline]');
    if (approveBtn) {
      const updated = approveSession(approveBtn.dataset.id);
      const other = getStudent(
        updated.tutorId === CURRENT_USER_ID
          ? updated.studentId
          : updated.tutorId
      );
      if (updated.status === 'confirmed') {
        addNotification(
          `Session confirmed with ${other?.name.split(' ')[0]} — both approved.`
        );
        toast('Both approved — session confirmed! 🎉', 'success');
      } else {
        toast('You approved. Waiting on the other student.', 'info');
      }
      if (activeId) navigate(`/messages/${activeId}`);
    } else if (declineBtn) {
      declineSession(declineBtn.dataset.id);
      toast('Agreement declined.', 'warn');
      if (activeId) navigate(`/messages/${activeId}`);
    }
  });
}
