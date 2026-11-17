import { icon } from './icons.js';

/**
 * Lightweight toast notifications.
 * toast('Session confirmed!', 'success')
 */
const ICONS = { success: 'check', info: 'info', warn: 'bell' };

export function toast(message, type = 'success', ms = 3200) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <span class="toast__icon">${icon(ICONS[type] || 'info', { size: 16 })}</span>
    <span>${message}</span>
  `;
  root.appendChild(el);

  const remove = () => {
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  const timer = setTimeout(remove, ms);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}
