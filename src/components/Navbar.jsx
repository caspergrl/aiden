import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Menu, X, Heart } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../App';
import { C, serif } from '../theme';

export default function Navbar() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const active = (path) => location.pathname === path;
  const linkStyle = (path) => ({
    fontSize: 14, fontWeight: 600,
    color: active(path) ? C.roseDark : C.text,
    textDecoration: 'none',
    padding: '4px 2px',
    borderBottom: active(path) ? `2px solid ${C.roseDark}` : '2px solid transparent',
    transition: 'color 0.2s',
  });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      transition: 'all 0.3s',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Heart size={18} color={C.rose} fill={C.rose} />
          <span style={{ fontFamily: serif, fontSize: 22, color: C.text, letterSpacing: -0.5 }}>aiden</span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          <Link to="/" style={linkStyle('/')}>Home</Link>
          <Link to="/faq" style={linkStyle('/faq')}>FAQ</Link>
          {user && profile?.role === 'admin' && (
            <Link to="/admin" style={linkStyle('/admin')}>Admin</Link>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
              <Link to="/account" style={linkStyle('/account')}>My Account</Link>
              <button onClick={() => { signOut(auth); navigate('/'); }}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none', padding: '7px 16px' }}>Sign in</Link>
              <Link to="/login?mode=signup" style={{ fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', background: C.roseDark, borderRadius: 8, padding: '7px 18px' }}>Get started</Link>
            </div>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }} className="burger">
          {open ? <X size={22} color={C.text} /> : <Menu size={22} color={C.text} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Link to="/" style={{ fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Home</Link>
          <Link to="/faq" style={{ fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>FAQ</Link>
          {user && profile?.role === 'admin' && (
            <Link to="/admin" style={{ fontSize: 15, fontWeight: 600, color: C.roseDark, textDecoration: 'none' }}>Admin</Link>
          )}
          {user ? (
            <>
              <Link to="/account" style={{ fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>My Account</Link>
              <button onClick={() => { signOut(auth); navigate('/'); }} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 600, color: C.muted, cursor: 'pointer', textAlign: 'left', padding: 0 }}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Sign in</Link>
              <Link to="/login?mode=signup" style={{ fontSize: 15, fontWeight: 700, color: C.roseDark, textDecoration: 'none' }}>Get started →</Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 700px) { .desktop-nav { display: none !important; } .burger { display: flex !important; } }
      `}</style>
    </nav>
  );
}
