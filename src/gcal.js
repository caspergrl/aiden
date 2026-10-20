/**
 * Google Calendar OAuth (PKCE, Desktop app type — no client secret).
 * Shared helpers for the web/desktop version of Aiden.
 */

const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

export function gcalClientId() {
  return import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || '';
}

function pkceGenerateVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Desktop redirect goes to /account so the Account page can detect and finish the flow
export function gcalRedirectUri() {
  return window.location.origin + '/account';
}

export async function startGoogleCalendarOAuth() {
  const verifier  = pkceGenerateVerifier();
  const challenge = await pkceChallenge(verifier);
  sessionStorage.setItem('gcal_verifier', verifier);
  const params = new URLSearchParams({
    client_id:             gcalClientId(),
    redirect_uri:          gcalRedirectUri(),
    response_type:         'code',
    scope:                 GCAL_SCOPES,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    access_type:           'offline',
    prompt:                'consent',
    state:                 'gcal_connect',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGCalCode(code) {
  const verifier = sessionStorage.getItem('gcal_verifier') || '';
  sessionStorage.removeItem('gcal_verifier');
  const body = new URLSearchParams({
    code,
    client_id:     gcalClientId(),
    redirect_uri:  gcalRedirectUri(),
    grant_type:    'authorization_code',
    code_verifier: verifier,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return resp.json();
}

export async function refreshGCalToken(refreshToken) {
  const body = new URLSearchParams({
    client_id:     gcalClientId(),
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return resp.json();
}

export async function fetchGCalUserEmail(accessToken) {
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await resp.json();
    return data.email || null;
  } catch { return null; }
}

// Safe key for localStorage and Firestore field names
export function gcalTokenKey(email) {
  return 'gcal_' + email.replace(/[.@+]/g, '_');
}

export async function fetchGCalEvents(accessToken, email) {
  const now    = new Date().toISOString();
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const resp = await fetch(
    `/api/google-calendar/calendars/primary/events?` +
    new URLSearchParams({ timeMin: now, timeMax: future, singleEvents: 'true', orderBy: 'startTime', maxResults: '100' }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!resp.ok) throw new Error(`GCal fetch failed: ${resp.status}`);
  const data = await resp.json();
  const key = email ? gcalTokenKey(email) : 'unknown';
  return (data.items || []).map(ev => ({
    id:          `gcal_${key}_${ev.id}`,
    title:       ev.summary || '(No title)',
    date:        ev.start?.dateTime?.slice(0, 10) || ev.start?.date || '',
    time:        ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    notes:       ev.description || '',
    source:      'google_calendar',
    gcalEmail:   email || null,
    gcalEventId: ev.id,
  }));
}
