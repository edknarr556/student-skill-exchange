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
  getSession,
  counterpartId,
  ensureConversation,
  getStudent,
  addNotification,
} from '../store/state.js';

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
 * `onChange` (optional) is called after a mutation so the page can re-render.
 */
export function bindSessionActions(view, onChange) {
  view.addEventListener('click', (e) => {
    const btn = e.target.closest(
      '[data-approve],[data-decline],[data-complete],[data-reopen],[data-open-chat]'
    );
    if (!btn) return;
    const id = btn.dataset.id;
    const session = getSession(id);
    if (!session) return;
    const other = getStudent(counterpartId(session));
    const otherName = other ? other.name.split(' ')[0] : 'them';

    if (btn.hasAttribute('data-approve')) {
      const updated = approveSession(id);
      if (updated.status === 'confirmed') {
        addNotification(
          `Session confirmed with ${otherName} — both of you approved.`
        );
        toast('Both approved — session confirmed! 🎉', 'success');
      } else {
        toast('You approved. Waiting on the other student.', 'info');
      }
    } else if (btn.hasAttribute('data-decline')) {
      declineSession(id);
      toast('Request declined.', 'warn');
    } else if (btn.hasAttribute('data-complete')) {
      completeSession(id);
      toast('Nice — session marked as completed.', 'success');
    } else if (btn.hasAttribute('data-reopen')) {
      reopenSession(id);
      toast('Re-sent your request.', 'info');
    } else if (btn.hasAttribute('data-open-chat')) {
      const convoId = ensureConversation(counterpartId(session));
      navigate(`/messages/${convoId}`);
      return;
    }

    if (onChange) onChange();
    else navigate(window.location.hash.slice(1) || '/'); // re-render current route
  });
}
