import { icon, starFilled } from '../components/icons.js';
import { avatar, esc, initials, fmtDate, termsLabel } from '../utils.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { openRequestModal } from '../components/requestModal.js';
import {
  getStudent,
  getCurrentUser,
  updateCurrentUser,
  getSessions,
  CURRENT_USER_ID,
  ensureConversation,
} from '../store/state.js';
import { AVAILABILITY } from '../store/seed.js';
import { navigate } from '../router.js';

export function renderProfile(params) {
  const id = params.id || CURRENT_USER_ID;
  const student = getStudent(id);
  const isMe = id === CURRENT_USER_ID;
  if (!student)
    return `<div class="page"><div class="empty"><h3>Student not found</h3></div></div>`;

  const history = getSessions()
    .filter(
      (s) =>
        (s.tutorId === id || s.studentId === id) &&
        (s.status === 'completed' || s.status === 'confirmed')
    )
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    .slice(0, 6);

  return `
    <div class="page">
      ${
        !isMe
          ? `<button class="btn btn--ghost btn--sm mb" data-back>${icon(
              'arrowLeft',
              { size: 16 }
            )} Back</button>`
          : ''
      }

      <section class="card card--pad mb">
        <div class="profile-head">
          ${avatar(student, 'avatar--lg')}
          <div class="profile-head__info">
            <div class="row wrap" style="gap:10px">
              <h1 style="margin:0">${esc(student.name)}</h1>
              <span class="badge badge--navy">${esc(student.year)}</span>
            </div>
            <p class="muted" style="margin-top:4px">
              ${icon('book', { size: 14 })} ${esc(student.major)} ·
              ${icon('mapPin', { size: 14 })} ${esc(student.university)}
            </p>
            <div class="profile-stats">
              <div class="profile-stat">
                <b>${student.rating.toFixed(1)} ${starFilled(16)}</b>
                <span>${student.reviews} reviews</span>
              </div>
              <div class="profile-stat">
                <b>${student.sessionsTaught}</b>
                <span>sessions taught</span>
              </div>
              <div class="profile-stat">
                <b>$${student.rate}<span style="font-size:.8rem">/hr</span></b>
                <span>${
                  student.openToExchange ? 'or skill swap' : 'tutoring rate'
                }</span>
              </div>
            </div>
          </div>
          <div class="stack" style="gap:8px">
            ${
              isMe
                ? `<button class="btn btn--primary" id="edit-profile">${icon(
                    'edit',
                    { size: 16 }
                  )} Edit profile</button>`
                : `<button class="btn btn--primary" data-request-tutor>${icon(
                    'calendar',
                    { size: 16 }
                  )} Request session</button>
                   <button class="btn btn--ghost" data-message-tutor>${icon(
                     'chat',
                     { size: 16 }
                   )} Message</button>`
            }
          </div>
        </div>
        <div class="divider"></div>
        <p style="max-width:70ch">${esc(student.bio)}</p>
      </section>

      <div class="grid grid--2 mb">
        <section class="card card--pad">
          <div class="card__head"><h3>${icon('award')} Skills offered</h3></div>
          <div class="stack" style="gap:10px">
            ${student.skillsTeach
              .map(
                (s) => `
              <div class="row" style="justify-content:space-between">
                <div>
                  <span class="tag tag--teach">${esc(s.skill)}</span>
                  <span class="muted" style="font-size:.8rem;margin-left:6px">${esc(
                    s.subject
                  )}</span>
                </div>
                <span class="badge">${esc(s.level)}</span>
              </div>`
              )
              .join('')}
          </div>
        </section>

        <section class="card card--pad">
          <div class="card__head"><h3>${icon('target')} Wants to learn</h3></div>
          ${
            student.skillsLearn.length
              ? `<div class="tutor__tags">${student.skillsLearn
                  .map(
                    (s) =>
                      `<span class="tag tag--learn">${esc(s.skill)}</span>`
                  )
                  .join('')}</div>`
              : '<p class="muted">No learning goals listed yet.</p>'
          }
          <div class="card__head mt"><h3>${icon('clock')} Availability</h3></div>
          <div class="avail-grid">
            ${(student.availability || [])
              .map((a) => `<span class="avail-chip">${esc(a)}</span>`)
              .join('')}
          </div>
        </section>
      </div>

      <section class="card card--pad">
        <div class="card__head">
          <h3>${icon('calendar')} ${isMe ? 'Your tutoring history' : 'Recent sessions'}</h3>
        </div>
        ${
          history.length
            ? `<div class="timeline">${history
                .map((s) => {
                  const done = s.status === 'completed';
                  const counterpart = getStudent(
                    s.tutorId === id ? s.studentId : s.tutorId
                  );
                  const role = s.tutorId === id ? 'Taught' : 'Learned';
                  return `
                  <div class="timeline__item ${done ? 'timeline__item--done' : ''}">
                    <span class="timeline__dot"></span>
                    <div class="timeline__title">${role} ${esc(
                    s.skill
                  )} ${
                    counterpart
                      ? `<span class="muted" style="font-weight:500">with ${esc(
                          counterpart.name
                        )}</span>`
                      : ''
                  }</div>
                    <div class="timeline__meta">${fmtDate(s.datetime)} · ${esc(
                    termsLabel(s)
                  )} · ${done ? 'Completed' : 'Upcoming'}</div>
                  </div>`;
                })
                .join('')}</div>`
            : '<p class="muted">No session history yet.</p>'
        }
      </section>
    </div>
  `;
}

export function mountProfile(params) {
  const view = document.getElementById('view');
  const id = params.id || CURRENT_USER_ID;

  view.querySelector('[data-back]')?.addEventListener('click', () =>
    history.length > 1 ? history.back() : navigate('/browse')
  );
  view.querySelector('[data-request-tutor]')?.addEventListener('click', () =>
    openRequestModal(id)
  );
  view.querySelector('[data-message-tutor]')?.addEventListener('click', () => {
    const convoId = ensureConversation(id);
    navigate(`/messages/${convoId}`);
  });
  view
    .querySelector('#edit-profile')
    ?.addEventListener('click', openEditProfile);
}

function openEditProfile() {
  const me = getCurrentUser();

  const body = `
    <form id="edit-form" class="stack" style="gap:2px">
      <div class="field">
        <label class="field__label" for="e-name">Full name</label>
        <input class="input" id="e-name" value="${esc(me.name)}" />
      </div>
      <div class="grid grid--2" style="gap:12px">
        <div class="field">
          <label class="field__label" for="e-major">Major</label>
          <input class="input" id="e-major" value="${esc(me.major)}" />
        </div>
        <div class="field">
          <label class="field__label" for="e-year">Year</label>
          <select class="select" id="e-year">
            ${['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
              .map(
                (y) =>
                  `<option${y === me.year ? ' selected' : ''}>${y}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="e-bio">Bio</label>
        <textarea class="textarea" id="e-bio">${esc(me.bio)}</textarea>
      </div>
      <div class="grid grid--2" style="gap:12px">
        <div class="field">
          <label class="field__label" for="e-rate">Hourly rate (USD)</label>
          <input class="input" type="number" min="0" id="e-rate" value="${
            me.rate
          }" />
        </div>
        <div class="field">
          <label class="field__label">Open to skill exchange?</label>
          <label class="choice ${me.openToExchange ? 'is-selected' : ''}" id="e-exchange" style="margin-top:2px">
            ${icon('swap')}
            <span><strong>Accept skill swaps</strong><small>Trade tutoring instead of money</small></span>
          </label>
        </div>
      </div>
      <div class="field">
        <label class="field__label">Availability</label>
        <div class="avail-grid" id="e-avail">
          ${AVAILABILITY.map((a) => {
            const on = (me.availability || []).includes(a);
            return `<button type="button" class="avail-chip" data-avail="${esc(
              a
            )}" style="${
              on
                ? ''
                : 'background:var(--gray-100);color:var(--gray-500)'
            }">${esc(a)}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="e-teach">Skills you offer (one per line, "Skill · Subject · Level")</label>
        <textarea class="textarea" id="e-teach">${me.skillsTeach
          .map((s) => `${s.skill} · ${s.subject} · ${s.level}`)
          .join('\n')}</textarea>
      </div>
      <div class="field">
        <label class="field__label" for="e-learn">Skills you want to learn (one per line, "Skill · Subject")</label>
        <textarea class="textarea" id="e-learn">${me.skillsLearn
          .map((s) => `${s.skill} · ${s.subject}`)
          .join('\n')}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn--ghost" data-close>Cancel</button>
    <button class="btn btn--primary" id="save-profile">${icon('check', {
      size: 16,
    })} Save changes</button>`;

  openModal({
    title: 'Edit your profile',
    subtitle: 'Changes are saved to your browser.',
    body,
    footer,
    onMount(root, close) {
      let openToExchange = me.openToExchange;
      const exChoice = root.querySelector('#e-exchange');
      exChoice.addEventListener('click', () => {
        openToExchange = !openToExchange;
        exChoice.classList.toggle('is-selected', openToExchange);
      });

      const availSet = new Set(me.availability || []);
      root.querySelectorAll('[data-avail]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const a = btn.dataset.avail;
          if (availSet.has(a)) {
            availSet.delete(a);
            btn.style.cssText =
              'background:var(--gray-100);color:var(--gray-500)';
          } else {
            availSet.add(a);
            btn.style.cssText = '';
          }
        });
      });

      root.querySelector('#save-profile').addEventListener('click', () => {
        const name = root.querySelector('#e-name').value.trim() || me.name;
        const skillsTeach = parseLines(
          root.querySelector('#e-teach').value,
          3,
          ['skill', 'subject', 'level'],
          { level: 'Intermediate' }
        );
        const skillsLearn = parseLines(
          root.querySelector('#e-learn').value,
          2,
          ['skill', 'subject'],
          {}
        );
        updateCurrentUser({
          name,
          major: root.querySelector('#e-major').value.trim() || me.major,
          year: root.querySelector('#e-year').value,
          bio: root.querySelector('#e-bio').value.trim(),
          rate: Number(root.querySelector('#e-rate').value) || me.rate,
          openToExchange,
          availability: [...availSet],
          skillsTeach: skillsTeach.length ? skillsTeach : me.skillsTeach,
          skillsLearn,
        });
        close();
        toast('Profile updated.', 'success');
        navigate('/profile');
      });
    },
  });
}

/** Parse "A · B · C" lines into objects keyed by `keys`. */
function parseLines(text, minParts, keys, defaults) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('·').map((p) => p.trim());
      const obj = { ...defaults };
      keys.forEach((k, i) => {
        if (parts[i]) obj[k] = parts[i];
      });
      if (!obj.skill) obj.skill = parts[0] || 'Skill';
      if (!obj.subject) obj.subject = 'General';
      return obj;
    });
}
