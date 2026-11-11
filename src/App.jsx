import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

import Landing         from './pages/Landing';
import ForIndividuals  from './pages/ForIndividuals';
import ForBusinesses   from './pages/ForBusinesses';
import Org             from './pages/Org';
import FAQ           from './pages/FAQ';
import Contact       from './pages/Contact';
import Login         from './pages/Login';
import Account       from './pages/Account';
import Admin         from './pages/Admin';
import Dashboard     from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms         from './pages/Terms';

// ─── Auth context ──────────────────────────────────────────────────────────────
export const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30-minute inactivity logout

function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [org,     setOrg]     = useState(null);
  const [orgRole, setOrgRole] = useState(null);
  const idleTimer = useRef(null);

  // ── Session timeout: sign out after 30 min of inactivity ─────────────────
  function resetIdleTimer() {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => signOut(auth), IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer(); // start the clock
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      clearTimeout(idleTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        const userProfile = snap.exists() ? snap.data() : null;
        setProfile(userProfile);

        if (userProfile?.orgId) {
          // Verify membership is still active (handles removed members)
          const memSnap = await getDoc(doc(db, 'organizations', userProfile.orgId, 'members', u.uid));
          if (!memSnap.exists()) {
            // Removed from org — clean up user doc
            await updateDoc(doc(db, 'users', u.uid), { orgId: null, orgRole: null }).catch(() => {});
            setOrg(null); setOrgRole(null);
          } else {
            const orgSnap = await getDoc(doc(db, 'organizations', userProfile.orgId));
            setOrg(orgSnap.exists() ? { id: orgSnap.id, ...orgSnap.data() } : null);
            setOrgRole(memSnap.data().role || null);
          }
        } else {
          // Check for a pending invite matching this email
          try {
            const q = query(
              collection(db, 'orgInvites'),
              where('email', '==', u.email),
              where('status', '==', 'pending'),
            );
            const inviteSnap = await getDocs(q);
            if (!inviteSnap.empty) {
              const inviteDoc = inviteSnap.docs[0];
              const invite    = inviteDoc.data();
              const batch     = writeBatch(db);
              batch.set(doc(db, 'organizations', invite.orgId, 'members', u.uid), {
                uid: u.uid, email: u.email, name: userProfile?.name || '',
                role: invite.role, addedAt: serverTimestamp(), addedBy: invite.invitedBy,
              });
              batch.update(doc(db, 'users', u.uid), { orgId: invite.orgId, orgRole: invite.role });
              batch.update(inviteDoc.ref, { status: 'accepted', acceptedAt: serverTimestamp() });
              await batch.commit();
              const orgSnap = await getDoc(doc(db, 'organizations', invite.orgId));
              setOrg(orgSnap.exists() ? { id: orgSnap.id, ...orgSnap.data() } : null);
              setOrgRole(invite.role);
            } else {
              setOrg(null); setOrgRole(null);
            }
          } catch {
            setOrg(null); setOrgRole(null);
          }
        }
      } else {
        setProfile(null);
        setOrg(null);
        setOrgRole(null);
      }
    });
  }, []);

  return (
    <AuthCtx.Provider value={{ user, profile, setProfile, org, setOrg, orgRole, setOrgRole, loading: user === undefined }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─── Email verification wall ───────────────────────────────────────────────────
function VerifyEmailWall({ user }) {
  const [sent, setSent]       = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  async function resend() {
    if (cooldown) return;
    try { await sendEmailVerification(user); } catch { /* rate-limited */ }
    setSent(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60000);
  }

  async function checkVerified() {
    setChecking(true);
    try {
      await user.reload();
      // Force a token refresh — this triggers onAuthStateChanged with the updated
      // user object (new reference), which causes ProtectedRoute to re-evaluate
      // emailVerified. Without this, reload() mutates the user in place but React
      // never sees a new reference so the wall doesn't dismiss.
      await user.getIdToken(true);
    } catch { /* ignore — onAuthStateChanged handles the rest */ }
    setChecking(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #fdf6f5 0%, #ffffff 60%)', padding: 24 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 4px 32px rgba(80,40,30,0.08)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fdf0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c06060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <h2 style={{ fontFamily: '"Lora", Georgia, serif', fontSize: 22, color: '#26201a', marginBottom: 10 }}>Verify your email</h2>
        <p style={{ fontSize: 14, color: '#8a7a6a', lineHeight: 1.65, marginBottom: 28 }}>
          We sent a verification link to <strong>{user.email}</strong>. Click the link in that email to continue.
        </p>
        {sent && (
          <p style={{ fontSize: 13, color: '#5a8a6a', background: '#f0f7f4', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            Verification email sent — check your inbox.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={checkVerified} disabled={checking}
            style={{ background: '#b05050', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: checking ? 'default' : 'pointer', opacity: checking ? 0.7 : 1 }}>
            {checking ? 'Checking…' : "I've verified — continue"}
          </button>
          <button onClick={resend} disabled={cooldown}
            style={{ background: 'none', border: '1px solid #ede5d8', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 600, color: cooldown ? '#b4aca2' : '#26201a', cursor: cooldown ? 'default' : 'pointer' }}>
            {cooldown ? 'Email sent (wait 60s to resend)' : 'Resend verification email'}
          </button>
          <button onClick={() => signOut(auth)}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#b4aca2', cursor: 'pointer', padding: '6px 0' }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  // Block access if an admin has disabled this account
  if (profile?.status === 'disabled') return <Navigate to="/login" replace />;
  // Require email verification (Google sign-in users are always verified)
  if (!user.emailVerified) return <VerifyEmailWall user={user} />;
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/account" replace />;
  return children;
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #ede5d8', borderTopColor: '#904848', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<Landing />} />
          <Route path="/individuals"  element={<ForIndividuals />} />
          <Route path="/businesses"   element={<ForBusinesses />} />
          <Route path="/faq"          element={<FAQ />} />
          <Route path="/contact"      element={<Contact />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/home"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/care"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/calendar"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/todo"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/account"   element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/org"       element={<ProtectedRoute><Org /></ProtectedRoute>} />
          <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/privacy"   element={<PrivacyPolicy />} />
          <Route path="/terms"     element={<Terms />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
