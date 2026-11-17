/**
 * Application state / data-access layer.
 *
 * All reads and mutations go through here so pages never touch LocalStorage
 * directly. This is also where the key business rules live — most importantly:
 * a session can only become "confirmed" once BOTH participants approve it.
 */
import { read, write, subscribe, clearAll } from './storage.js';
import { buildSeed, CURRENT_USER_ID, DATA_VERSION } from './seed.js';

const KEYS = {
  version: 'version',
  students: 'students',
  sessions: 'sessions',
  conversations: 'conversations',
  notifications: 'notifications',
};

/** Seed LocalStorage on first run or when the data schema changes. */
export function initStore() {
  const version = read(KEYS.version);
  if (version !== DATA_VERSION || !read(KEYS.students)) {
    const seed = buildSeed();
    write(KEYS.students, seed.students);
    write(KEYS.sessions, seed.sessions);
    write(KEYS.conversations, seed.conversations);
    write(KEYS.notifications, seed.notifications);
    write(KEYS.version, DATA_VERSION);
  }
}

export function resetDemo() {
  clearAll();
  initStore();
}

export { subscribe, CURRENT_USER_ID };

/* ---------------------------------------------------------------- students */
export function getStudents() {
  return read(KEYS.students, []);
}
export function getStudent(id) {
  return getStudents().find((s) => s.id === id) || null;
}
export function getCurrentUser() {
  return getStudent(CURRENT_USER_ID);
}
export function updateCurrentUser(patch) {
  const students = getStudents().map((s) =>
    s.id === CURRENT_USER_ID ? { ...s, ...patch } : s
  );
  write(KEYS.students, students);
}

/** Tutors = everyone except the current user. */
export function getTutors() {
  return getStudents().filter((s) => s.id !== CURRENT_USER_ID);
}

/* ---------------------------------------------------------------- sessions */
export function getSessions() {
  return read(KEYS.sessions, []);
}
export function getSession(id) {
  return getSessions().find((s) => s.id === id) || null;
}

/** Sessions that involve the current user (as student or tutor). */
export function getMySessions() {
  return getSessions().filter(
    (s) => s.studentId === CURRENT_USER_ID || s.tutorId === CURRENT_USER_ID
  );
}

export function getSessionsByStatus(status) {
  return getMySessions().filter((s) => s.status === status);
}

/** The "other" participant relative to the current user. */
export function counterpartId(session) {
  return session.tutorId === CURRENT_USER_ID
    ? session.studentId
    : session.tutorId;
}

/** Create a new session request. Starts pending; requester auto-approves. */
export function createSessionRequest({
  tutorId,
  skill,
  subject,
  datetime,
  durationMin,
  type,
  price,
  exchangeSkill,
  note,
}) {
  const sessions = getSessions();
  const id = 's-' + Date.now().toString(36);
  const session = {
    id,
    tutorId,
    studentId: CURRENT_USER_ID,
    skill,
    subject,
    datetime,
    durationMin: durationMin || 60,
    type, // 'money' | 'exchange'
    price: type === 'money' ? Number(price) || 0 : 0,
    exchangeSkill: type === 'exchange' ? exchangeSkill || null : null,
    status: 'pending',
    // Requester approves their own terms up front; counterpart must still agree.
    approvals: { [CURRENT_USER_ID]: true, [tutorId]: false },
    note: note || '',
    createdAt: new Date().toISOString(),
  };
  write(KEYS.sessions, [session, ...sessions]);
  return session;
}

function saveSession(updated) {
  const sessions = getSessions().map((s) => (s.id === updated.id ? updated : s));
  write(KEYS.sessions, sessions);
  return updated;
}

/**
 * Restore a previously captured session snapshot (used by Undo). Pass the
 * object returned from getSession() before a mutation; this writes it back
 * verbatim, reverting status + approvals in one shot.
 */
export function restoreSession(snapshot) {
  if (!snapshot) return null;
  const exists = getSession(snapshot.id);
  if (!exists) return null;
  return saveSession({ ...snapshot });
}

/**
 * Record an approval for `userId`. Returns the updated session.
 * BUSINESS RULE: the session only flips to "confirmed" when every
 * participant's approval is true. Until then it stays "pending".
 */
export function approveSession(sessionId, userId = CURRENT_USER_ID) {
  const session = getSession(sessionId);
  if (!session || session.status === 'declined') return session;
  const approvals = { ...session.approvals, [userId]: true };
  const bothApproved = approvals[session.tutorId] && approvals[session.studentId];
  return saveSession({
    ...session,
    approvals,
    status: bothApproved ? 'confirmed' : 'pending',
  });
}

/** Decline / cancel a session. */
export function declineSession(sessionId, userId = CURRENT_USER_ID) {
  const session = getSession(sessionId);
  if (!session) return null;
  return saveSession({
    ...session,
    approvals: { ...session.approvals, [userId]: false },
    status: 'declined',
  });
}

/** Mark a confirmed session complete (e.g. after it happened). */
export function completeSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  return saveSession({ ...session, status: 'completed' });
}

/** Re-open a declined request as pending again (requester re-approves). */
export function reopenSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  return saveSession({
    ...session,
    status: 'pending',
    approvals: { ...session.approvals, [CURRENT_USER_ID]: true },
  });
}

/** True when the current user still needs to act on a pending session. */
export function needsMyApproval(session) {
  return session.status === 'pending' && !session.approvals[CURRENT_USER_ID];
}

/* ----------------------------------------------------------- conversations */
export function getConversations() {
  return read(KEYS.conversations, []);
}
export function getConversation(id) {
  return getConversations().find((c) => c.id === id) || null;
}
export function getConversationWith(userId) {
  return getConversations().find((c) => c.withId === userId) || null;
}

/** Find or create a conversation with a given student, return its id. */
export function ensureConversation(userId) {
  let convo = getConversationWith(userId);
  if (convo) return convo.id;
  const id = 'c-' + userId;
  convo = { id, withId: userId, messages: [] };
  write(KEYS.conversations, [convo, ...getConversations()]);
  return id;
}

export function sendMessage(convoId, { text, kind = 'text', sessionId, from = CURRENT_USER_ID }) {
  const conversations = getConversations().map((c) => {
    if (c.id !== convoId) return c;
    const message = {
      id: 'm-' + Date.now().toString(36),
      from,
      kind,
      text: text || '',
      sessionId: sessionId || null,
      at: new Date().toISOString(),
    };
    return { ...c, messages: [...c.messages, message] };
  });
  write(KEYS.conversations, conversations);
}

/** Post an agreement card for a session into the relevant conversation. */
export function postAgreementMessage(session) {
  const other = counterpartId(session);
  const convoId = ensureConversation(other);
  sendMessage(convoId, { kind: 'agreement', sessionId: session.id });
  return convoId;
}

/* ---------------------------------------------------------- notifications */
export function getNotifications() {
  return read(KEYS.notifications, []);
}
export function unreadNotificationCount() {
  return getNotifications().filter((n) => !n.read).length;
}
export function markNotificationsRead() {
  write(
    KEYS.notifications,
    getNotifications().map((n) => ({ ...n, read: true }))
  );
}
export function addNotification(text, link = null) {
  const n = {
    id: 'n-' + Date.now().toString(36),
    text,
    link, // optional hash route, e.g. '/messages/c-diego'
    at: new Date().toISOString(),
    read: false,
  };
  write(KEYS.notifications, [n, ...getNotifications()]);
}

/** Resolve a sensible destination for a notification that lacks an explicit link. */
export function notificationLink(n) {
  if (n.link) return n.link;
  const t = (n.text || '').toLowerCase();
  if (t.includes('approv') || t.includes('agreement') || t.includes('confirm'))
    return '/requests';
  if (t.includes('replied') || t.includes('message')) return '/messages';
  if (t.includes('session')) return '/sessions';
  return '/';
}

/* -------------------------------------------------------- derived helpers */

/** Count of pending sessions that need the current user's approval. */
export function pendingForMeCount() {
  return getMySessions().filter(needsMyApproval).length;
}

/** Total unread chat messages (messages from others, newest run). */
export function unreadMessageCount() {
  // Prototype heuristic: count conversations whose last message is from the
  // other person (a lightweight "unread" signal without read receipts).
  return getConversations().filter((c) => {
    const last = c.messages[c.messages.length - 1];
    return last && last.from !== CURRENT_USER_ID;
  }).length;
}

/** Recommend tutors by matching the user's "want to learn" list + rating. */
export function getRecommendedTutors(limit = 3) {
  const me = getCurrentUser();
  const wants = new Set((me?.skillsLearn || []).map((s) => s.skill));
  const wantSubjects = new Set((me?.skillsLearn || []).map((s) => s.subject));
  return getTutors()
    .map((t) => {
      const teaches = t.skillsTeach || [];
      const skillMatch = teaches.some((s) => wants.has(s.skill));
      const subjMatch = teaches.some((s) => wantSubjects.has(s.subject));
      const score =
        (skillMatch ? 3 : 0) + (subjMatch ? 1 : 0) + t.rating / 5;
      return { tutor: t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.tutor);
}
