import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Menu, X } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../App';
import { C, serif } from '../theme';
import Logo from './Logo';

// Nav items — keep in sync with /shared/nav.config.js
const NAV_ITEMS = [
  { label: 'Home',       section: null,       path: '/' },
  { label: 'Care',       section: 'care',     path: '/dashboard?section=care' },
  { label: 'Calendar',   section: 'calendar', path: '/dashboard?section=calendar' },
  { label: 'To Do',      section: 'list',     path: '/dashboard?section=list' },
  { label: 'Ask Aiden',  section: 'chat',     path: '/dashboard?section=chat' },
];

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

  // A nav item is active if we're on its exact path or on the dashboard with its section
  function isActive(item) {
    if (item.path === '/') return location.pathname === '/';
    const section = new URLSearchParams(location.search).get('section') || 'home';
    return location.pathname === '/dashboard' && section === (item.section || 'home');
  }

  const linkTarget = (item) =>
    item.section && !user ? `/login?redirect=${encodeURIComponent(item.path)}` : item.path;

  const linkStyle = (item) => ({
    fontSize: 14,
    fontWeight: 600,
    color: isActive(item) ? C.roseDark : C.text,
    textDecoration: 'none',
    padding: '4px 2px',
    borderBottom: isActive(item) ? `2px solid ${C.roseDark}` : '2px solid transparent',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <Logo width={80} />
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.label} to={linkTarget(item)} style={linkStyle(item)}>
              {item.label}
            </Link>
          ))}
          {user && profile?.role === 'admin' && (
            <Link to="/admin" style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>Admin</Link>
          )}
        </div>

        {/* Desktop auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
          {user ? (
            <button onClick={() => { signOut(auth); navigate('/login'); }}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none', padding: '7px 14px', whiteSpace: 'nowrap' }}>Sign in</Link>
              <Link to="/login?mode=signup" style={{ fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', background: C.roseDark, borderRadius: 8, padding: '7px 18px', whiteSpace: 'nowrap' }}>Get started</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }} className="burger">
          {open ? <X size={22} color={C.text} /> : <Menu size={22} color={C.text} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.label} to={linkTarget(item)}
              style={{ fontSize: 15, fontWeight: 600, color: isActive(item) ? C.roseDark : C.text, textDecoration: 'none', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: 16 }}>
            {user ? (
              <button onClick={() => { signOut(auth); navigate('/login'); }}
                style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 600, color: C.muted, cursor: 'pointer', textAlign: 'left', padding: '12px 0', width: '100%' }}>
                Sign out
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <Link to="/login" style={{ fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Sign in</Link>
                <Link to="/login?mode=signup" style={{ fontSize: 15, fontWeight: 700, color: C.roseDark, textDecoration: 'none' }}>Get started →</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 780px) { .desktop-nav { display: none !important; } .burger { display: flex !important; } }
      `}</style>
    </nav>
  );
}
