import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

import Landing       from './pages/Landing';
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

// createdAt is a Firestore Timestamp, but the legacy seeding path in Dashboard.jsx wrote an
// ISO string — accept both so Pendo always receives an ISO 8601 date (or nothing).
function toIsoDate(ts) {
  if (!ts) return undefined;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
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
    let signedIn = false;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        signedIn = true;
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.exists() ? snap.data() : null;
        setProfile(data);
        // Skip if the user signed out (or another user signed in) while the profile was loading
        if (auth.currentUser?.uid === u.uid) {
          pendo.identify({
            visitor: {
              id:        u.uid,
              email:     u.email,
              full_name: data?.name,
              role:      data?.role,
              status:    data?.status,
              createdAt: toIsoDate(data?.createdAt),
            },
          });
        }
      } else {
        setProfile(null);
        // Only on an actual sign-out: resetting on every signed-out page load would turn each
        // anonymous visit into a new visitor. clearSession isn't part of the snippet's stub, so
        // it only exists once the agent has loaded (it may never load behind an ad blocker).
        if (signedIn && typeof pendo.clearSession === 'function') pendo.clearSession();
        signedIn = false;
      }
    });
  }, []);

  return (
    <AuthCtx.Provider value={{ user, profile, setProfile, loading: user === undefined }}>
      {children}
    </AuthCtx.Provider>
  );
}

// ─── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  // Block access if an admin has disabled this account
  if (profile?.status === 'disabled') return <Navigate to="/login" replace />;
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
          <Route path="/"        element={<Landing />} />
          <Route path="/faq"     element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/home"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/care"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/calendar"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/todo"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/account"   element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/privacy"   element={<PrivacyPolicy />} />
          <Route path="/terms"     element={<Terms />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
