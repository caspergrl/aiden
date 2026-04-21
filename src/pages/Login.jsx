import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuth } from '../App';
import { C, serif } from '../theme';

const ERR = {
  'auth/user-not-found':      'No account found with that email.',
  'auth/wrong-password':      'Incorrect password.',
  'auth/email-already-in-use':'An account with this email already exists.',
  'auth/weak-password':       'Password must be at least 6 characters.',
  'auth/invalid-email':       'Please enter a valid email address.',
  'auth/invalid-credential':  'Incorrect email or password.',
};

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode]           = useState(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const { user: u } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Create Firestore user doc
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid, email: u.email, name: name.trim() || '',
          role: 'user', status: 'active', createdAt: serverTimestamp(),
        });
      }
      navigate('/dashboard');
    } catch (e) {
      setError(ERR[e.code] || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (e) {
      setError(ERR[e.code] || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  const switchMode = (m) => { setMode(m); setError(''); setResetSent(false); };

  const input = (props) => ({
    width: '100%', background: C.bgWarm, border: `1.5px solid ${C.border}`,
    borderRadius: 13, padding: '13px 16px', fontSize: 15, color: C.text, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...props,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5ede8 0%, #ede5f5 60%, #f5ede8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 40px' }}>

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 36 }}>
        <Heart size={20} color={C.rose} fill={C.rose} />
        <span style={{ fontFamily: serif, fontSize: 26, color: C.text, letterSpacing: -0.5 }}>aiden</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 8px 48px rgba(140,60,40,0.13), 0 1px 8px rgba(140,60,40,0.06)' }}>

        {/* ─── Forgot password ─── */}
        {mode === 'forgot' ? (
          <>
            <h1 style={{ fontFamily: serif, fontSize: 24, color: C.text, marginBottom: 6 }}>Reset password</h1>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.65 }}>Enter your email and we'll send a reset link.</p>

            {resetSent ? (
              <div style={{ background: '#f0f7f4', border: '1px solid #8ab5a060', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#3a6e58', marginBottom: 4 }}>Check your inbox</p>
                <p style={{ fontSize: 13, color: '#5a8e78', lineHeight: 1.65 }}>A reset link was sent to <strong>{email}</strong>. Check spam if you don't see it.</p>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={input({ marginBottom: 16 })} />
                {error && <p style={{ fontSize: 12, color: C.coral, background: '#fdf5f5', padding: '8px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</p>}
                <button type="submit" disabled={loading || !email.trim()} style={{ width: '100%', background: loading || !email.trim() ? C.border : C.roseDark, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: loading || !email.trim() ? 'default' : 'pointer', letterSpacing: 0.3 }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}
            <button onClick={() => switchMode('signin')} style={{ width: '100%', background: 'none', border: 'none', marginTop: 18, color: C.muted, fontSize: 13, cursor: 'pointer' }}>
              ← <span style={{ color: C.roseDark, fontWeight: 700 }}>Back to sign in</span>
            </button>
          </>
        ) : (
          /* ─── Sign in / Sign up ─── */
          <>
            <h1 style={{ fontFamily: serif, fontSize: 24, color: C.text, marginBottom: 4 }}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>
              {mode === 'signin' ? 'Sign in to access your Aiden account.' : 'Start managing caregiving with clarity.'}
            </p>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Your name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Holly Chen" autoComplete="name" style={input({})} />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={input({})} />
              </div>

              <div style={{ marginBottom: 4, position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} style={input({ paddingRight: 44 })} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'signin' && (
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                  <button type="button" onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', color: C.roseDark, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <p style={{ fontSize: 12, color: C.coral, background: '#fdf5f5', padding: '8px 12px', borderRadius: 8, margin: '12px 0' }}>{error}</p>}

              <button type="submit" disabled={loading || !email.trim() || !password.trim()}
                style={{ width: '100%', background: loading || !email.trim() || !password.trim() ? C.border : C.roseDark, color: '#fff', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16, transition: 'background 0.2s', letterSpacing: 0.3 }}>
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 22 }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} style={{ background: 'none', border: 'none', color: C.roseDark, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
