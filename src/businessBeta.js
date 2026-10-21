// Gate the Business upgrade feature to a comma-separated allowlist of emails.
// Set VITE_BUSINESS_BETA_EMAILS in production to restrict access.
// If the var is not set (e.g. local dev), the feature is open to everyone.
const raw = import.meta.env.VITE_BUSINESS_BETA_EMAILS;

const allowedEmails = raw
  ? raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  : null; // null = open to all

export function isBusinessAllowed(email) {
  if (!allowedEmails) return true; // no restriction set
  return allowedEmails.includes((email || '').toLowerCase());
}
