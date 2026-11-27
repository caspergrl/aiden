/**
 * Epic SMART on FHIR OAuth (PKCE, public client — no client secret).
 * Uses Epic's sandbox by default; swap the base URL for a specific org's endpoint in production.
 */

const EPIC_BASE      = 'https://fhir.epic.com/interconnect-fhir-oauth';
const EPIC_AUTH_URL  = `${EPIC_BASE}/oauth2/authorize`;
const EPIC_TOKEN_URL = `${EPIC_BASE}/oauth2/token`;
export const EPIC_FHIR_R4 = `${EPIC_BASE}/api/FHIR/R4`;

const EPIC_SCOPES = [
  'openid',
  'fhirUser',
  'launch/patient',
  'patient/Patient.read',
  'patient/Appointment.read',
  'patient/MedicationRequest.read',
  'patient/Condition.read',
  'patient/AllergyIntolerance.read',
  'patient/Observation.read',
].join(' ');

export function epicClientId() {
  return import.meta.env.VITE_EPIC_CLIENT_ID || '';
}

export function epicRedirectUri() {
  return window.location.origin + '/account';
}

function pkceGenerateVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function pkceChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function startEpicOAuth() {
  const verifier  = pkceGenerateVerifier();
  const challenge = await pkceChallenge(verifier);
  sessionStorage.setItem('epic_verifier', verifier);
  // Build the query string manually so forward slashes in scope values are not percent-encoded
  const params = new URLSearchParams({
    client_id:             epicClientId(),
    redirect_uri:          epicRedirectUri(),
    response_type:         'code',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state:                 'epic_connect',
  });
  // Keep literal slashes in scope values — URLSearchParams encodes them as %2F which some Epic endpoints reject
  const scopeParam = EPIC_SCOPES.split(' ').join('+');
  window.location.href = `${EPIC_AUTH_URL}?${params}&scope=${scopeParam}`;
}

export async function exchangeEpicCode(code) {
  const verifier = sessionStorage.getItem('epic_verifier') || '';
  sessionStorage.removeItem('epic_verifier');
  const resp = await fetch(EPIC_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     epicClientId(),
      redirect_uri:  epicRedirectUri(),
      grant_type:    'authorization_code',
      code_verifier: verifier,
    }),
  });
  return resp.json();
}

export async function refreshEpicToken(refreshToken) {
  const resp = await fetch(EPIC_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     epicClientId(),
    }),
  });
  return resp.json();
}

export async function fetchEpicAppointments(accessToken, patientId) {
  const today = new Date().toISOString().slice(0, 10);
  const url   = `${EPIC_FHIR_R4}/Appointment?patient=${patientId}&date=ge${today}&_count=100`;
  const resp  = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept:        'application/fhir+json',
    },
  });
  if (!resp.ok) throw new Error(`Epic FHIR error ${resp.status}`);
  const bundle = await resp.json();
  return (bundle.entry || []).map(e => e.resource).filter(r => r?.resourceType === 'Appointment');
}

export function epicAppointmentToAiden(resource) {
  const start       = resource.start ? new Date(resource.start) : null;
  const practitioner = (resource.participant || []).find(p =>
    p.actor?.reference?.startsWith('Practitioner')
  );
  const title = resource.description
    || (practitioner?.actor?.display ? `With ${practitioner.actor.display}` : 'Epic Appointment');
  return {
    title,
    date:        start ? start.toISOString().slice(0, 10) : '',
    time:        start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    notes:       '',
    recipientId: '',
    source:      'epic_fhir',
    epicId:      resource.id || '',
  };
}
