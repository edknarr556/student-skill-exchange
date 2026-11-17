import { icon } from './icons.js';
import { registerOverlay, trapFocus } from './overlay.js';

let modalSeq = 0;

/**
 * Reusable, accessible modal dialog.
 *
 * openModal({
 *   title, subtitle,
 *   body: htmlString,
 *   footer: htmlString,
 *   onMount(rootEl, close) {}  // wire up events on the modal DOM
 * })
 *
 * Accessibility:
 *  - role="dialog" + aria-modal, labelled by the title (and described by the
 *    subtitle when present)
 *  - focus is trapped inside while open
 *  - Escape closes
 *  - focus is restored to the element that opened the dialog on close
 *
 * Returns a `close()` function.
 */
export function openModal({ title, subtitle = '', body = '', footer = '', onMount }) {
  const root = document.getElementById('modal-root');
  const opener = document.activeElement; // restore focus here on close
  const id = ++modalSeq;
  const titleId = `modal-title-${id}`;
  const descId = `modal-desc-${id}`;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true"
         aria-labelledby="${titleId}" ${subtitle ? `aria-describedby="${descId}"` : ''}>
      <div class="modal__head">
        <div>
          <h2 id="${titleId}">${title || ''}</h2>
          ${subtitle ? `<p id="${descId}">${subtitle}</p>` : ''}
        </div>
        <button class="modal__close" data-close type="button" aria-label="Close dialog">${icon(
          'x',
          { size: 20 }
        )}</button>
      </div>
      <div class="modal__body">${body}</div>
      ${footer ? `<div class="modal__foot">${footer}</div>` : ''}
    </div>
  `;
  root.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const modalEl = overlay.querySelector('.modal');
  const releaseFocusTrap = trapFocus(modalEl);
  const unregister = registerOverlay(close);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.body.style.overflow = '';
    releaseFocusTrap();
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    unregister();
    // Restore focus to the opener if it is still in the document.
    if (opener && document.contains(opener)) {
      try {
        opener.focus({ preventScroll: true });
      } catch (e) {
        /* ignore */
      }
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);

  if (onMount) onMount(modalEl, close);
  return close;
}
