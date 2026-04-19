import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User, Shield, Trash2, Save, ArrowRight, Heart, Check } from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, shadow } from '../theme';

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 28px', boxShadow: '0 2px 12px rgba(80,60,40,0.05)', ...style }}>
      {children}
    </div>
  );
}

export default function Account() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName]           = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [delConfirm, setDelConfirm] = useState('');
  const [deleting, setDeleting]   = useState(false);
  const [delError, setDelError]   = useState('');

  async function saveName() {
    if (!name.trim() || savingName) return;
    setSavingName(true);
    await updateDoc(doc(db, 'users', user.uid), { name: name.trim() });
    setProfile(p => ({ ...p, name: name.trim() }));
    setSavingName(false); setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  }

  async function sendReset() {
    setResetting(true);
    await sendPasswordResetEmail(auth, user.email);
    setResetSent(true); setResetting(false);
  }

  async function handleDelete() {
    if (delConfirm !== user.email) return;
    setDeleting(true); setDelError('');
    try {
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
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '100px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 8 }}>My Account</p>
          <h1 style={{ fontFamily: serif, fontSize: 32, color: C.text, letterSpacing: -0.5 }}>Account settings</h1>
        </div>

        {/* Profile summary */}
        <Card style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.roseDark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
            {(profile?.name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{profile?.name || 'Your name not set'}</p>
            <p style={{ fontSize: 13, color: C.muted }}>{user?.email}</p>
            <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 2 }}>Member since {memberSince}</p>
          </div>
          {profile?.role === 'admin' && (
            <span style={{ marginLeft: 'auto', background: C.roseDark + '15', color: C.roseDark, border: `1px solid ${C.roseDark}30`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>ADMIN</span>
          )}
        </Card>

        {/* Edit name */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <User size={17} color={C.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Profile</h2>
          </div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Display name</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
              style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none' }} />
            <button onClick={saveName} disabled={savingName || !name.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: nameSaved ? C.sage : C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'background 0.3s' }}>
              {nameSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
            </button>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Email address</label>
            <p style={{ fontSize: 14, color: C.muted, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px' }}>{user?.email}</p>
            <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 6 }}>Email cannot be changed here. Contact support if needed.</p>
          </div>
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
