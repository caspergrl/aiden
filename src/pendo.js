// ─── Pendo Track Events ────────────────────────────────────────────────────────
// Fail-safe access to the Pendo agent's track() API. The agent (window.pendo) is
// added by the Pendo install snippet; until it is present (snippet not installed
// yet, blocked by an ad blocker, …) calls are a no-op, and agent errors are
// swallowed, so analytics can never break an app flow (most calls sit inside
// try blocks whose catch would otherwise report a successful save as failed).
// Only track() is wrapped: use window.pendo directly for initialize/identify.
export const pendo = {
  track(event, properties) {
    try {
      window.pendo?.track(event, properties);
    } catch (e) {
      console.warn(`Pendo track event "${event}" failed:`, e);
    }
  },
};
