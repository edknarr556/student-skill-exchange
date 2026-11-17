import { openModal } from './modal.js';
import { icon } from './icons.js';
import { esc, options, toLocalInput } from '../utils.js';
import { toast } from './toast.js';
import {
  getStudent,
  getCurrentUser,
  createSessionRequest,
  postAgreementMessage,
  addNotification,
} from '../store/state.js';
import { navigate } from '../router.js';

/**
 * Open the "Request a session" flow for a given tutor.
 * On submit it creates a pending session (requester pre-approved), posts an
 * agreement card into the chat, and routes the user to Messaging to negotiate.
 */
export function openRequestModal(tutorId, presetSkill) {
  const tutor = getStudent(tutorId);
  const me = getCurrentUser();
  if (!tutor) return;

  const teachSkills = (tutor.skillsTeach || []).map((s) => s.skill);
  const mySkills = (me.skillsTeach || []).map((s) => s.skill);
  const defaultSkill = presetSkill || teachSkills[0] || '';

  const body = `
    <form id="request-form" class="stack" style="gap:2px">
      <div class="row" style="gap:12px; margin-bottom:6px">
        <span class="avatar avatar--sm" style="background:${esc(
          tutor.color
        )}">${esc(initialsOf(tutor.name))}</span>
        <div>
          <strong>${esc(tutor.name)}</strong>
          <div class="muted" style="font-size:.82rem">${esc(
            tutor.major
          )} · $${tutor.rate}/hr</div>
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="rf-skill">Skill you need help with</label>
        <select class="select" id="rf-skill" name="skill" data-autofocus>
          ${options(teachSkills, defaultSkill)}
        </select>
      </div>

      <div class="grid grid--2" style="gap:12px">
        <div class="field">
          <label class="field__label" for="rf-when">Preferred date & time</label>
          <input class="input" type="datetime-local" id="rf-when" name="when"
            value="${toLocalInput(defaultDateTime())}" />
        </div>
        <div class="field">
          <label class="field__label" for="rf-dur">Duration</label>
          <select class="select" id="rf-dur" name="duration">
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60" selected>1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>

      <fieldset class="field choice-fieldset">
        <legend class="field__label">How would you like to pay?</legend>
        <div class="choice-row mb">
          <label class="choice is-selected" for="rf-pay-money">
            <input class="choice__radio" type="radio" id="rf-pay-money"
              name="payType" value="money" checked />
            ${icon('dollar')}
            <span><strong>Monetary payment</strong><small>Pay the tutor's hourly rate</small></span>
          </label>
          <label class="choice" for="rf-pay-exchange">
            <input class="choice__radio" type="radio" id="rf-pay-exchange"
              name="payType" value="exchange" ${
                tutor.openToExchange ? '' : 'disabled'
              } />
            ${icon('swap')}
            <span><strong>Skill exchange</strong><small>${
              tutor.openToExchange
                ? 'Trade a skill of your own'
                : 'Not offered by this tutor'
            }</small></span>
          </label>
        </div>
      </fieldset>

      <div class="field" data-pay="money">
        <label class="field__label" for="rf-price">Offer amount (USD)</label>
        <input class="input" type="number" min="0" step="1" id="rf-price"
          name="price" value="${tutor.rate}" />
        <small class="muted">Tutor's listed rate is $${tutor.rate}/hr. You can propose a different amount to negotiate.</small>
      </div>

      <div class="field" data-pay="exchange" hidden>
        <label class="field__label" for="rf-exchange">Skill you'll teach in return</label>
        <select class="select" id="rf-exchange" name="exchange">
          ${
            mySkills.length
              ? options(mySkills, mySkills[0])
              : '<option value="">(Add skills to your profile first)</option>'
          }
        </select>
      </div>

      <div class="field">
        <label class="field__label" for="rf-note">Message to ${esc(
          firstName(tutor.name)
        )}</label>
        <textarea class="textarea" id="rf-note" name="note" placeholder="What do you want to focus on? Any topics, chapters, or deadlines?"></textarea>
      </div>

      <div class="card card--pad" style="background:var(--sky-soft);border:none">
        <div class="row" style="gap:9px;align-items:flex-start">
          ${icon('info', { size: 18, cls: '' })}
          <p style="font-size:.84rem;color:var(--navy-700);margin:0">
            Sending this creates a <strong>proposed agreement</strong>. The session
            is only confirmed once <strong>both of you approve the terms</strong> — you can
            chat and negotiate first.
          </p>
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn--ghost" data-close>Cancel</button>
    <button class="btn btn--primary" id="rf-submit">${icon('send', {
      size: 16,
    })} Send proposal</button>
  `;

  openModal({
    title: 'Request a tutoring session',
    subtitle: 'Propose the terms, then negotiate in chat before confirming.',
    body,
    footer,
    onMount(rootEl, close) {
      const form = rootEl.querySelector('#request-form');
      const radios = rootEl.querySelectorAll('input[name="payType"]');
      const moneyField = rootEl.querySelector('[data-pay="money"]');
      const exchangeField = rootEl.querySelector('[data-pay="exchange"]');

      function syncPayType() {
        const payType =
          rootEl.querySelector('input[name="payType"]:checked')?.value ||
          'money';
        // Reflect selection on the label cards for the visual state.
        radios.forEach((r) =>
          r.closest('.choice').classList.toggle('is-selected', r.checked)
        );
        moneyField.hidden = payType !== 'money';
        exchangeField.hidden = payType !== 'exchange';
      }
      radios.forEach((r) => r.addEventListener('change', syncPayType));
      syncPayType();

      function submit() {
        const fd = new FormData(form);
        const payType = fd.get('payType') || 'money';
        const skill = fd.get('skill');
        const subject =
          (tutor.skillsTeach.find((s) => s.skill === skill) || {}).subject ||
          tutor.skillsTeach[0]?.subject;
        const whenVal = fd.get('when');
        if (!whenVal) {
          toast('Please choose a date and time.', 'warn');
          return;
        }
        if (payType === 'exchange' && !fd.get('exchange')) {
          toast('Add a skill to your profile to offer a swap.', 'warn');
          return;
        }

        const session = createSessionRequest({
          tutorId: tutor.id,
          skill,
          subject,
          datetime: new Date(whenVal).toISOString(),
          durationMin: Number(fd.get('duration')),
          type: payType,
          price: fd.get('price'),
          exchangeSkill: fd.get('exchange'),
          note: fd.get('note'),
        });

        const convoId = postAgreementMessage(session);
        addNotification(
          `You proposed a ${skill} session to ${firstName(tutor.name)}`,
          `/messages/${convoId}`
        );
        close();
        toast(
          `Proposal sent to ${firstName(
            tutor.name
          )} — negotiate and confirm in chat.`,
          'success'
        );
        navigate(`/messages/${convoId}`);
      }

      // Submit via button click or Enter key within the form.
      rootEl.querySelector('#rf-submit').addEventListener('click', submit);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submit();
      });
    },
  });
}

function defaultDateTime() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(16, 0, 0, 0);
  return d.toISOString();
}
function firstName(name = '') {
  return name.split(' ')[0];
}
function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
