/**
 * Token storage for OAuth credentials — web version.
 * Uses localStorage (persists across sessions, same as browser password manager behaviour).
 * Never stores tokens in Firestore or transmits them server-side.
 */
const PREFIX = 'aiden_tokens_';

export async function saveTokens(service, tokens) {
  try { localStorage.setItem(PREFIX + service, JSON.stringify(tokens)); } catch {}
}

export async function loadTokens(service) {
  try {
    const v = localStorage.getItem(PREFIX + service);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export async function clearTokens(service) {
  try { localStorage.removeItem(PREFIX + service); } catch {}
}
