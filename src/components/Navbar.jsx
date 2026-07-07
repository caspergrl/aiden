import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../App';
import { C, serif } from '../theme';
import Logo from './Logo';

// Nav items — keep in sync with /shared/nav.config.js
const NAV_ITEMS = [
  { label: 'Home',       path: '/'          },
  { label: 'Care',       path: '/care'      },
  { label: 'Calendar',   path: '/calendar'  },
  { label: 'To Do',      path: '/todo'      },
  { label: 'Ask Aiden',  path: '/chat'      },
];

function UserAvatar({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initial = (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Account';

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="My profile"
        style={{ width: 36, height: 36, borderRadius: '50%', background: C.rose, color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: serif, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}
      >
        {initial}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 240, background: '#fff', borderRadius: 18, boxShadow: '0 4px 28px rgba(140,60,40,0.13)', border: `1px solid ${C.border}`, zIndex: 200, overflow: 'hidden' }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.rose, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontFamily: serif, fontSize: 15 }}>{initial}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
          {/* Actions */}
          <div style={{ padding: '4px 0' }}>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 14, color: C.text, textDecoration: 'none' }}
            >
              <Settings size={15} color={C.muted} /> Account settings
            </Link>
            <button
              onClick={() => { onSignOut(); setOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 14, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, profile } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  function isActive(item) {
    if (item.path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname === item.path;
  }

  const linkTarget = (item) =>
    item.path !== '/' && !user ? `/login?redirect=${encodeURIComponent(item.path)}` : item.path;

  const navLinkStyle = (item) => ({
    fontSize: 14, fontWeight: 600,
    color: isActive(item) ? C.roseDark : C.text,
    textDecoration: 'none',
    paddingBottom: 2,
    borderBottom: isActive(item) ? `2px solid ${C.roseDark}` : '2px solid transparent',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
  });

  function handleSignOut() { signOut(auth); navigate('/login'); }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-desktop">
          {user && NAV_ITEMS.map(item => (
            <Link key={item.label} to={linkTarget(item)} style={navLinkStyle(item)}>{item.label}</Link>
          ))}
          {user && profile?.role === 'admin' && (
            <Link to="/admin" style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>Admin</Link>
          )}
        </div>

        {/* Desktop auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="nav-desktop">
          {user ? (
            <UserAvatar user={user} onSignOut={handleSignOut} />
          ) : (
            <>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none', padding: '7px 14px' }}>Sign in</Link>
              <Link to="/login?mode=signup" style={{ fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none', background: C.roseDark, borderRadius: 8, padding: '7px 18px' }}>Get started</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(o => !o)} className="nav-burger" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {open ? <X size={22} color={C.text} /> : <Menu size={22} color={C.text} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#fff', borderTop: `1px solid ${C.border}`, padding: '12px 24px 24px', display: 'flex', flexDirection: 'column' }}>
          {user && NAV_ITEMS.map(item => (
            <Link key={item.label} to={linkTarget(item)} style={{ fontSize: 15, fontWeight: 600, color: isActive(item) ? C.roseDark : C.text, textDecoration: 'none', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: user ? 16 : 0 }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 4 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.rose, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontFamily: serif, fontSize: 14 }}>
                      {(user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{user?.displayName || user?.email?.split('@')[0]}</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{user?.email}</p>
                  </div>
                </div>
                <Link to="/account" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none', padding: '12px 0' }}>
                  <Settings size={15} color={C.muted} /> Account settings
                </Link>
                <button onClick={() => { handleSignOut(); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', textAlign: 'left' }}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/login" style={{ fontSize: 15, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Sign in</Link>
                <Link to="/login?mode=signup" style={{ fontSize: 15, fontWeight: 700, color: C.roseDark, textDecoration: 'none' }}>Get started →</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .nav-burger { display: none; }
        @media (max-width: 767px) {
          .nav-desktop { display: none !important; }
          .nav-burger   { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
