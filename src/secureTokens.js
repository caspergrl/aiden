/**
 * Secure token storage for OAuth credentials.
 *
 * On iOS/Android: uses Keychain / Keystore via capacitor-secure-storage-plugin.
 * On web: keeps tokens in memory only (session-scoped, never written to disk).
 *
 * Firestore only stores non-sensitive metadata (connected flag, last sync time).
 */

const memoryStore = {};

async function isNative() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch { return false; }
}

export async function saveTokens(service, tokens) {
  const key = `aiden_tokens_${service}`;
  const value = JSON.stringify(tokens);
  if (await isNative()) {
    try {
      const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
      await SecureStoragePlugin.set({ key, value });
      return;
    } catch (e) { console.warn('SecureStorage unavailable, falling back to memory:', e); }
  }
  // Web fallback: memory only (cleared on page unload)
  memoryStore[key] = tokens;
}

export async function loadTokens(service) {
  const key = `aiden_tokens_${service}`;
  if (await isNative()) {
    try {
      const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
      const result = await SecureStoragePlugin.get({ key });
      return result.value ? JSON.parse(result.value) : null;
    } catch { return null; }
  }
  return memoryStore[key] || null;
}

export async function clearTokens(service) {
  const key = `aiden_tokens_${service}`;
  if (await isNative()) {
    try {
      const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
      await SecureStoragePlugin.remove({ key });
    } catch {}
  }
  delete memoryStore[key];
}
