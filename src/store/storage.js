/**
 * Thin LocalStorage wrapper with namespacing and a tiny pub/sub so the UI
 * can react when persisted data changes. Everything is JSON-serialised.
 */
const PREFIX = 'sse:'; // Student Skill Exchange
const listeners = new Set();

export function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.warn(`[storage] failed to read "${key}"`, err);
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    emit(key);
  } catch (err) {
    console.error(`[storage] failed to write "${key}"`, err);
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
  emit(key);
}

export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  emit('*');
}

/** Subscribe to any store change. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(key) {
  listeners.forEach((fn) => {
    try {
      fn(key);
    } catch (err) {
      console.error('[storage] listener error', err);
    }
  });
}

// Keep tabs in sync if the app is open twice.
window.addEventListener('storage', (e) => {
  if (e.key && e.key.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length));
});
