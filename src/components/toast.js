import { icon } from './icons.js';
import { esc } from '../utils.js';

/**
 * Lightweight toast notifications.
 *
 *   toast('Session confirmed!', 'success')
 *   toast('Request declined.', 'warn', { onUndo: () => reopen() })
 *
 * Options:
 *   ms     — auto-dismiss delay (default 3400, or 6000 when an Undo is shown)
 *   onUndo — if provided, renders an "Undo" action; clicking it runs the
 *            callback and dismisses the toast.
 */
const ICONS = { success: 'check', info: 'info', warn: 'bell' };

export function toast(message, type = 'success', opts = {}) {
  // Back-compat: third arg used to be a number (ms).
  if (typeof opts === 'number') opts = { ms: opts };
  const { onUndo = null } = opts;
  const ms = opts.ms || (onUndo ? 6000 : 3400);

  const root = document.getElementById('toast-root');
  if (!root) return;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', type === 'warn' ? 'alert' : 'status');
  el.setAttribute('aria-live', type === 'warn' ? 'assertive' : 'polite');
  el.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icon(
      ICONS[type] || 'info',
      { size: 16 }
    )}</span>
    <span class="toast__msg">${esc(message)}</span>
    ${
      onUndo
        ? '<button type="button" class="toast__undo" data-undo>Undo</button>'
        : '<button type="button" class="toast__dismiss" data-dismiss aria-label="Dismiss notification">' +
          icon('x', { size: 15 }) +
          '</button>'
    }
  `;
  root.appendChild(el);

  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // Fallback in case animationend doesn't fire.
    setTimeout(() => el.remove(), 400);
  };
  const timer = setTimeout(remove, ms);

  const undoBtn = el.querySelector('[data-undo]');
  if (undoBtn) {
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        onUndo();
      } finally {
        remove();
      }
    });
  }
  el.querySelector('[data-dismiss]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    remove();
  });

  return remove;
}
