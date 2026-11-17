/**
 * Shared, delegated action handlers wired onto a container element.
 * Pages call bindTutorActions(view) / bindSessionActions(view) after render.
 */
import { navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { openRequestModal } from '../components/requestModal.js';
import {
  approveSession,
  declineSession,
  completeSession,
  reopenSession,
  restoreSession,
  getSession,
  counterpartId,
  ensureConversation,
  getStudent,
  addNotification,
} from '../store/state.js';

/** Re-render the current route (used after a mutation). */
function rerender(onChange) {
  if (onChange) onChange();
  else navigate(window.location.hash.slice(1) || '/');
}

/** Tutor card buttons: view profile + request session. */
export function bindTutorActions(view) {
  view.addEventListener('click', (e) => {
    const profileBtn = e.target.closest('[data-view-profile]');
    if (profileBtn) {
      navigate(`/profile/${profileBtn.dataset.id}`);
      return;
    }
    const requestBtn = e.target.closest('[data-request]');
    if (requestBtn) {
      openRequestModal(requestBtn.dataset.id);
    }
  });
}

/**
 * Session row buttons: approve / decline / complete / reopen / open chat.
 * Each reversible action captures a snapshot and offers an inline Undo via
 * the toast. `onChange` (optional) is called after a mutation so the page can
 * re-render.
 */
export function bindSessionActions(view, onChange) {
  view.addEventListener('click', (e) => {
    const btn = e.target.closest(
      '[data-approve],[data-decline],[data-complete],[data-reopen],[data-open-chat]'
    );
    if (!btn) return;
    const id = btn.dataset.id;
    const before = getSession(id);
    if (!before) return;
    const other = getStudent(counterpartId(before));
    const otherName = other ? other.name.split(' ')[0] : 'them';
    const wasCancel = before.status === 'pending'; // decline on a pending = cancel

    const undo = () => {
      restoreSession(before);
      rerender(onChange);
      toast('Change undone.', 'info');
    };

    if (btn.hasAttribute('data-approve')) {
      const updated = approveSession(id);
      if (updated.status === 'confirmed') {
        addNotification(
          `Session confirmed with ${otherName} — both of you approved.`
        );
        toast(`Confirmed with ${otherName} — both approved. 🎉`, 'success', {
          onUndo: undo,
        });
      } else {
        toast('You approved. Waiting on the other student.', 'info', {
          onUndo: undo,
        });
      }
    } else if (btn.hasAttribute('data-decline')) {
      declineSession(id);
      toast(
        wasCancel
          ? `Request to ${otherName} cancelled.`
          : `Declined ${otherName}'s request.`,
        'warn',
        { onUndo: undo }
      );
    } else if (btn.hasAttribute('data-complete')) {
      completeSession(id);
      toast('Session marked as completed.', 'success', { onUndo: undo });
    } else if (btn.hasAttribute('data-reopen')) {
      reopenSession(id);
      toast(`Re-sent your request to ${otherName}.`, 'info', { onUndo: undo });
    } else if (btn.hasAttribute('data-open-chat')) {
      const convoId = ensureConversation(counterpartId(before));
      navigate(`/messages/${convoId}`);
      return;
    }

    rerender(onChange);
  });
}
