// ─── Pendo Track Events ───────────────────────────────────────────────────────
// Thin wrapper around the Pendo agent's track() call. It no-ops when the agent
// isn't loaded and swallows tracking errors so analytics never break app flows.
// The Pendo agent attaches the visitor and account automatically, so never pass
// visitorId or accountId as properties.
export function trackEvent(name, properties = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.pendo?.track === 'function') {
      window.pendo.track(name, properties);
    }
  } catch { /* ignore tracking failures */ }
}
