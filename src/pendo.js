/**
 * Novus by Pendo — lifecycle helpers.
 * The install snippet in index.html loads the agent and defines window.pendo.
 */

// The Google Calendar OAuth flow (src/gcal.js) redirects back to
// /account?code=...&state=gcal_connect. Keep those parameters out of the
// URLs Pendo records. Gated on the callback path so other pages keep any
// `code` or `state` parameters they legitimately use.
const GCAL_CALLBACK_PATH = '/account';
const GCAL_CALLBACK_PARAMS = ['code', 'state'];

function getPendo() {
  return typeof window !== 'undefined' ? window.pendo : undefined;
}

// Firestore Timestamps expose toDate(); dashboard seeding may store ISO strings.
function toIsoDate(value) {
  if (!value) return undefined;
  try {
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
  } catch { /* ignore malformed values */ }
  return undefined;
}

// App entry: boot the SDK exactly once with an anonymous visitor.
export function initPendo() {
  const pendo = getPendo();
  if (!pendo || typeof pendo.initialize !== 'function') return;
  pendo.initialize({
    visitor: { id: '' },
    location: {
      transforms: [{
        attr:   'search',
        action: 'ExcludeKeys',
        data:   (search, url) => (
          url && url.pathname === GCAL_CALLBACK_PATH ? GCAL_CALLBACK_PARAMS : []
        ),
      }],
    },
  });
}

// Sign-in and metadata changes: register the signed-in visitor and their organization.
export function identifyPendo({ user, profile, org, orgRole }) {
  const pendo = getPendo();
  if (!pendo || typeof pendo.identify !== 'function' || !user) return;

  const options = {
    visitor: {
      id:            user.uid,
      email:         profile?.email ?? user.email,
      full_name:     profile?.name,
      role:          profile?.role,
      status:        profile?.status,
      createdAt:     toIsoDate(profile?.createdAt),
      orgId:         profile?.orgId ?? org?.id ?? null,
      orgRole:       orgRole ?? profile?.orgRole ?? null,
      plan:          profile?.plan,
      emailVerified: user.emailVerified,
      seeded:        profile?.seeded,
      notifEmail:    profile?.notifEmail,
      notifSms:      profile?.notifSms,
    },
  };

  if (org?.id) {
    options.account = {
      id:        org.id,
      name:      org.name,
      type:      org.type,
      plan:      org.plan,
      ownerId:   org.ownerId,
      createdAt: toIsoDate(org.createdAt),
    };
  }

  pendo.identify(options);
}

// Sign-out: reset to a fresh anonymous visitor. clearSession isn't part of the
// snippet stub, so it only exists once the agent has loaded.
export function clearPendoSession() {
  const pendo = getPendo();
  if (pendo && typeof pendo.clearSession === 'function') pendo.clearSession();
}
