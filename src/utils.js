/** Small presentation + formatting helpers shared across pages. */

/** Escape text for safe insertion into innerHTML. */
export function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Initials from a full name, e.g. "Amara Okafor" -> "AO". */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase();
}

/** Render an avatar (image if present, else coloured initials). */
export function avatar(student, cls = '') {
  if (!student) return '';
  const base = `avatar ${cls}`.trim();
  if (student.avatar) {
    return `<span class="${base}"><img src="${esc(student.avatar)}" alt="${esc(
      student.name
    )}"/></span>`;
  }
  return `<span class="${base}" style="background:${esc(
    student.color || '#2447a3'
  )}">${esc(initials(student.name))}</span>`;
}

const DAY = 86400000;

/** Human date like "Thu, May 9". */
export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Human time like "4:30 PM". */
export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Thu, May 9 · 4:30 PM" */
export function fmtDateTime(iso) {
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}

/** Relative label for chat/notifications: "just now", "3h", "2d", or date. */
export function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return fmtDate(iso);
}

/** Group chat day separator label. */
export function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor(
    (today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / DAY
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/** True if an ISO datetime is in the future. */
export function isFuture(iso) {
  return new Date(iso).getTime() > Date.now();
}

/** Terms summary for a session, e.g. "$21 / hr" or "Skill swap: Python". */
export function termsLabel(session) {
  if (session.type === 'exchange') {
    return session.exchangeSkill
      ? `Skill swap · ${session.exchangeSkill}`
      : 'Skill swap';
  }
  return `$${session.price} payment`;
}

/** Badge class + label for a session status. */
export function statusBadge(status) {
  const map = {
    pending: { cls: 'badge--amber', label: 'Pending' },
    confirmed: { cls: 'badge--green', label: 'Confirmed' },
    declined: { cls: 'badge--red', label: 'Declined' },
    completed: { cls: 'badge--navy', label: 'Completed' },
  };
  return map[status] || { cls: '', label: status };
}

/** Build an <option> list from values, marking `selected`. */
export function options(values, selected) {
  return values
    .map(
      (v) =>
        `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(
          v
        )}</option>`
    )
    .join('');
}

/** Datetime-local input value (YYYY-MM-DDTHH:mm) from a Date/ISO. */
export function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
