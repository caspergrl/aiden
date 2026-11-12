// Pendo Track Events helper.
// Sends a Track Event through the Pendo agent when it is loaded on the page.
// Tracking must never break app behavior, so a missing agent or an agent error is ignored.
export function trackEvent(name, properties = {}) {
  try {
    if (typeof window !== 'undefined' && window.pendo && typeof window.pendo.track === 'function') {
      window.pendo.track(name, properties);
    }
  } catch (e) {
    console.warn('Pendo track failed:', name, e);
  }
}
