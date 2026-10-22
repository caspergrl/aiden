import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, updateEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, collection, getDocs, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Shield, Trash2, Save, ArrowRight, Heart, Check, Calendar, RefreshCw, Unlink, Building2, Users, ChevronRight, Camera } from 'lucide-react';
import { auth, db, storage } from '../firebase';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, shadow } from '../theme';
import { saveTokens, loadTokens, clearTokens } from '../secureTokens';
import { gcalClientId, gcalTokenKey, startGoogleCalendarOAuth, exchangeGCalCode, fetchGCalUserEmail, refreshGCalToken, fetchGCalEvents } from '../gcal';
import { UpgradeModal, RoleBadge, ORG_TYPES } from './Org';
import { isBusinessAllowed } from '../businessBeta';

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 28px', boxShadow: '0 2px 12px rgba(80,60,40,0.05)', ...style }}>
      {children}
    </div>
  );
}

export default function Account() {
  const { user, profile, setProfile, org, orgRole } = useAuth();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const origName  = profile?.name || '';
  const origEmail = user?.email || '';

  const [fullName,  setFullName]  = useState(origName);
  const [emailEdit, setEmailEdit] = useState(origEmail);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);
  const [profileError, setProfileError]   = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEdit.trim());
  const isDirty = fullName.trim() !== origName || emailEdit.trim() !== origEmail;
  const canSave = isDirty && isEmailValid && !savingProfile;

  const [avatarUrl, setAvatarUrl]     = useState(profile?.avatarUrl || null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [delConfirm, setDelConfirm] = useState('');
  const [deleting, setDeleting]   = useState(false);
  const [delError, setDelError]   = useState('');

  // ── Google Calendar connections ──────────────────────────────────────────────
  const [connStatus, setConnStatus]   = useState({});
  const [connLoading, setConnLoading] = useState(false);
  const [connError, setConnError]     = useState('');
  const [gcalSyncing, setGcalSyncing] = useState({});
  const [gcalExchanging, setGcalExchanging] = useState(false);

  // Load connection metadata from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'connections', 'status')).then(snap => {
      if (snap.exists()) setConnStatus(snap.data());
    });
  }, [user]);

  // Handle OAuth callback — Google redirects back to /account with ?code=...&state=gcal_connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    if (!code || state !== 'gcal_connect' || !user) return;
    window.history.replaceState({}, '', window.location.pathname);
    setGcalExchanging(true);
    (async () => {
      try {
        const tokens = await exchangeGCalCode(code);
        if (tokens.access_token) {
          const email = await fetchGCalUserEmail(tokens.access_token);
          const key   = email ? gcalTokenKey(email) : 'gcal_unknown';
          await saveTokens(key, {
            accessToken:  tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt:    Date.now() + (tokens.expires_in || 3600) * 1000,
          });
          const accountMeta = { email: email || '', connectedAt: Date.now() };
          await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), {
            googleCalendars: { [key]: accountMeta },
          }, { merge: true });
          setConnStatus(p => ({ ...p, googleCalendars: { ...(p.googleCalendars || {}), [key]: accountMeta } }));
        }
      } catch (e) { setConnError('Could not connect Google Calendar — please try again.'); }
      setGcalExchanging(false);
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const gcalAccounts = Object.entries(connStatus.googleCalendars || {})
    .map(([key, meta]) => ({ key, ...meta }))
    .sort((a, b) => (a.connectedAt || 0) - (b.connectedAt || 0));

  async function handleConnectGoogleCalendar() {
    if (!gcalClientId()) {
      setConnError('Google Calendar client ID not configured — add VITE_GOOGLE_CALENDAR_CLIENT_ID to .env');
      return;
    }
    setConnError('');
    await startGoogleCalendarOAuth();
  }

  async function handleDisconnectGoogleCalendar(key, email) {
    setConnLoading(true);
    try {
      await clearTokens(key);
      const updated = { ...(connStatus.googleCalendars || {}) };
      delete updated[key];
      await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), { googleCalendars: updated }, { merge: true });
      setConnStatus(p => {
        const cals = { ...(p.googleCalendars || {}) };
        delete cals[key];
        return { ...p, googleCalendars: cals };
      });
    } catch { setConnError('Could not disconnect — try again.'); }
    setConnLoading(false);
  }

  async function handleSyncGoogleCalendar(key, email) {
    setGcalSyncing(p => ({ ...p, [key]: true })); setConnError('');
    try {
      const stored = await loadTokens(key);
      if (!stored?.accessToken) throw new Error('Not connected — please reconnect Google Calendar.');
      let { accessToken, refreshToken, expiresAt } = stored;
      if (Date.now() > (expiresAt || 0) - 60_000) {
        const refreshed = await refreshGCalToken(refreshToken);
        if (!refreshed.access_token) throw new Error('Session expired — please reconnect Google Calendar.');
        accessToken = refreshed.access_token;
        expiresAt   = Date.now() + (refreshed.expires_in || 3600) * 1000;
        await saveTokens(key, { accessToken, refreshToken, expiresAt });
      }
      const events = await fetchGCalEvents(accessToken, email);
      const meta = { email, connectedAt: connStatus.googleCalendars?.[key]?.connectedAt || Date.now(), lastSync: Date.now(), eventCount: events.length };
      await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), { googleCalendars: { [key]: meta } }, { merge: true });
      setConnStatus(p => ({ ...p, googleCalendars: { ...(p.googleCalendars || {}), [key]: meta } }));
    } catch (e) { setConnError(e.message || 'Sync failed — try reconnecting.'); }
    setGcalSyncing(p => ({ ...p, [key]: false }));
  }

  async function resizeImage(file, maxSize = 200) {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };
      img.src = url;
    });
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const blob = await resizeImage(file, 200);
      const sRef = storageRef(storage, `users/${user.uid}/avatar.jpg`);
      await uploadBytes(sRef, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(sRef);
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url });
      setAvatarUrl(url);
      setProfile(p => ({ ...p, avatarUrl: url }));
    } catch { /* silently ignore upload errors */ }
    setAvatarUploading(false);
  }

  async function saveProfile() {
    if (savingProfile) return;
    setSavingProfile(true); setProfileError(''); setProfileSaved(false);
    try {
      const updates = { name: fullName.trim() };
      await updateDoc(doc(db, 'users', user.uid), updates);
      setProfile(p => ({ ...p, ...updates }));

      if (emailEdit.trim() && emailEdit.trim() !== user.email) {
        await updateEmail(auth.currentUser, emailEdit.trim());
        await updateDoc(doc(db, 'users', user.uid), { email: emailEdit.trim() });
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) {
      const msgs = {
        'auth/requires-recent-login': 'Please sign out and sign in again before changing your email.',
        'auth/email-already-in-use': 'That email is already in use by another account.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setProfileError(msgs[e.code] || 'Could not save — please try again.');
    }
    setSavingProfile(false);
  }

  async function sendReset() {
    setResetting(true);
    await sendPasswordResetEmail(auth, user.email);
    setResetSent(true); setResetting(false);
  }

  // Delete all PHI subcollections before removing the user doc and auth record
  async function deleteAllSubcollections(uid) {
    const subcolls = [
      'recipients', 'appointments', 'doctors',
      'medicationSchedules', 'medicationLogs',
      'logistics', 'resources',
    ];
    for (const sub of subcolls) {
      const snap = await getDocs(collection(db, 'users', uid, sub));
      if (snap.empty) continue;
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }

  async function handleDelete() {
    if (delConfirm !== user.email) return;
    setDeleting(true); setDelError('');
    try {
      await deleteAllSubcollections(user.uid); // wipe all PHI subcollections first
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      navigate('/');
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        setDelError('For security, please sign out and sign in again before deleting your account.');
      } else {
        setDelError('Something went wrong. Please try again.');
      }
      setDeleting(false);
    }
  }

  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'N/A';

  return (
    <div style={{ minHeight: '100vh', background: C.bgWarm }}>
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onUpgraded={() => { setShowUpgrade(false); navigate('/org'); }}
        />
      )}
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '100px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 8 }}>My Account</p>
          <h1 style={{ fontFamily: serif, fontSize: 32, color: C.text, letterSpacing: -0.5 }}>Account settings</h1>
        </div>

        {/* Profile */}
        <Card style={{ marginBottom: 20 }}>
          {/* Avatar + summary row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
            {/* Avatar with upload */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.roseDark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800, overflow: 'hidden' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (profile?.name || user?.email || '?')[0].toUpperCase()
                }
              </div>
              <label title="Upload photo" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: '#fff', border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                {avatarUploading
                  ? <div style={{ width: 10, height: 10, border: '2px solid #ccc', borderTopColor: C.roseDark, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  : <Camera size={12} color={C.muted} />
                }
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
            {/* Name / email / since */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>
                {profile?.name || 'Your name not set'}
              </p>
              <p style={{ fontSize: 13, color: C.muted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
              <p style={{ fontSize: 12, color: C.mutedLight, margin: '2px 0 0' }}>Member since {memberSince}</p>
            </div>
            {profile?.role === 'admin' && (
              <span style={{ marginLeft: 'auto', flexShrink: 0, background: C.roseDark + '15', color: C.roseDark, border: `1px solid ${C.roseDark}30`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>ADMIN</span>
            )}
          </div>

          {/* Edit fields */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Full name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name"
              style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Email address</label>
            <input value={emailEdit} onChange={e => setEmailEdit(e.target.value)} type="email" placeholder="your@email.com"
              style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {profileError && <p style={{ fontSize: 13, color: C.coral, marginBottom: 12 }}>{profileError}</p>}

          <button onClick={saveProfile} disabled={!canSave}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: profileSaved ? '#4a9e7a' : canSave ? C.roseDark : C.border, color: canSave || profileSaved ? '#fff' : C.mutedLight, border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: canSave ? 'pointer' : 'default', transition: 'background 0.3s' }}>
            {profileSaved ? <><Check size={14} /> Saved</> : savingProfile ? 'Saving…' : <><Save size={14} /> Save changes</>}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Card>

        {/* Password */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Shield size={17} color={C.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Password</h2>
          </div>
          {resetSent ? (
            <div style={{ background: '#f0f7f4', border: '1px solid #8ab5a060', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3a6e58', marginBottom: 4 }}>Reset email sent!</p>
              <p style={{ fontSize: 13, color: '#5a8e78', lineHeight: 1.65 }}>Check your inbox at <strong>{user?.email}</strong> for a password reset link.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 1.65 }}>We'll email you a secure link to reset your password.</p>
              <button onClick={sendReset} disabled={resetting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primaryLight, color: C.primaryDark, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {resetting ? 'Sending…' : <><ArrowRight size={14} /> Send password reset email</>}
              </button>
            </>
          )}
        </Card>

        {/* Google Calendar connections */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Calendar size={17} color={C.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Google Calendar</h2>
            {gcalAccounts.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#f0f7f4', color: '#3a6e58', border: '1px solid #8ab5a040', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
                {gcalAccounts.length === 1 ? 'Connected' : `${gcalAccounts.length} accounts`}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 1.65 }}>
            Pull upcoming events from your Google Calendar into Aiden. You stay in control — nothing is written back.
          </p>

          {gcalExchanging && (
            <div style={{ background: '#f0f7f4', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: '#3a6e58' }}>
              Connecting your Google account…
            </div>
          )}

          {connError && (
            <p style={{ fontSize: 13, color: C.coral, marginBottom: 12 }}>{connError}</p>
          )}

          {/* Connected accounts */}
          {gcalAccounts.map(({ key, email, lastSync, eventCount }) => (
            <div key={key} style={{ background: C.bgWarm, borderRadius: 12, padding: '12px 14px', marginBottom: 10, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email || 'Google Account'}
                  </p>
                  {lastSync && (
                    <p style={{ fontSize: 12, color: C.mutedLight, margin: '3px 0 0' }}>
                      Synced {new Date(lastSync).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {eventCount != null && ` · ${eventCount} events`}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleSyncGoogleCalendar(key, email)} disabled={!!gcalSyncing[key]}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 0', fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', opacity: gcalSyncing[key] ? 0.6 : 1 }}>
                  <RefreshCw size={13} /> {gcalSyncing[key] ? 'Syncing…' : 'Sync now'}
                </button>
                <button onClick={() => handleDisconnectGoogleCalendar(key, email)} disabled={connLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 14px', fontSize: 13, color: C.muted, cursor: 'pointer' }}>
                  <Unlink size={13} /> Disconnect
                </button>
              </div>
            </div>
          ))}

          <button onClick={handleConnectGoogleCalendar}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#444', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: gcalAccounts.length ? 4 : 0 }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>G</span>
            {gcalAccounts.length ? 'Add another account' : 'Connect with Google'}
          </button>
        </Card>

        {/* Account type */}
        <Card style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.mutedLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Account type</p>
          {org ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.primary + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={18} color={C.primary} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Business</span>
                    <span style={{ background: C.primary + '18', color: C.primary, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>BUSINESS</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{org.name} · {ORG_TYPES.find(t => t.value === org.type)?.label || org.type}</p>
                </div>
                <RoleBadge role={orgRole} style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </div>
              <button onClick={() => navigate('/org')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Manage team <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.rose + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={18} color={C.roseDark} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Individual</span>
                    <span style={{ background: C.rose + '30', color: C.roseDark, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>INDIVIDUAL</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Up to 3 care recipients</p>
                </div>
              </div>
              {isBusinessAllowed(user?.email) && (
                <button onClick={() => setShowUpgrade(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer' }}>
                  <Building2 size={14} color={C.muted} /> Upgrade to Business
                </button>
              )}
            </>
          )}
        </Card>

        {/* Admin link */}
        {profile?.role === 'admin' && (
          <Card style={{ marginBottom: 20, background: C.roseDark + '08', border: `1px solid ${C.roseDark}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.roseDark, marginBottom: 4 }}>Admin panel</p>
                <p style={{ fontSize: 13, color: C.muted }}>Manage all users, roles, and account statuses.</p>
              </div>
              <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.roseDark, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700 }}>
                Open admin <ArrowRight size={14} />
              </a>
            </div>
          </Card>
        )}

        {/* Delete account */}
        <Card style={{ border: `1px solid ${C.coral}30`, background: '#fffaf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Trash2 size={17} color={C.coral} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Delete account</h2>
          </div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>
            This permanently deletes your account and all associated data. This cannot be undone.
          </p>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>
            Type your email address to confirm: <strong>{user?.email}</strong>
          </label>
          <input value={delConfirm} onChange={e => setDelConfirm(e.target.value)} placeholder={user?.email}
            style={{ width: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', marginBottom: 12 }} />
          {delError && <p style={{ fontSize: 12, color: C.coral, marginBottom: 10 }}>{delError}</p>}
          <button onClick={handleDelete} disabled={delConfirm !== user?.email || deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: delConfirm === user?.email ? C.coral : C.border, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: delConfirm === user?.email ? 'pointer' : 'default', transition: 'background 0.2s' }}>
            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
