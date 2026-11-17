import { icon } from './icons.js';

/**
 * Reusable modal dialog.
 *
 * openModal({
 *   title, subtitle,
 *   body: htmlString,
 *   footer: htmlString,
 *   onMount(rootEl, close) {}  // wire up events on the modal DOM
 * })
 *
 * Returns a `close()` function.
 */
export function openModal({ title, subtitle = '', body = '', footer = '', onMount }) {
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title || 'Dialog'}">
      <div class="modal__head">
        <div>
          <h2>${title || ''}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <button class="modal__close" data-close aria-label="Close">${icon('x', {
          size: 20,
        })}</button>
      </div>
      <div class="modal__body">${body}</div>
      ${footer ? `<div class="modal__foot">${footer}</div>` : ''}
    </div>
  `;
  root.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  function close() {
    document.body.style.overflow = '';
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);

  if (onMount) onMount(overlay.querySelector('.modal'), close);
  return close;
}
