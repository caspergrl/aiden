import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../App';
import Logo from './Logo';

// Nav items — keep in sync with /shared/nav.config.js
const NAV_ITEMS = [
  { label: 'Home',       section: null,       path: '/' },
  { label: 'Care',       section: 'care',     path: '/dashboard?section=care' },
  { label: 'Calendar',   section: 'calendar', path: '/dashboard?section=calendar' },
  { label: 'To Do',      section: 'list',     path: '/dashboard?section=list' },
  { label: 'Ask Aiden',  section: 'chat',     path: '/dashboard?section=chat' },
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-rose text-white font-bold text-sm font-serif flex items-center justify-center border-none cursor-pointer flex-shrink-0 hover:bg-rose-dark transition-colors"
        title="My profile"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-card border border-border z-50 overflow-hidden">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-rose flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold font-serif">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink font-sans truncate">{displayName}</p>
              <p className="text-xs text-ink-muted font-sans truncate">{user?.email}</p>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-sans text-ink hover:bg-warm no-underline transition-colors"
            >
              <Settings size={15} className="text-ink-muted flex-shrink-0" />
              Account settings
            </Link>
            <button
              onClick={() => { onSignOut(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-sans text-ink-muted hover:bg-warm bg-transparent border-none cursor-pointer text-left transition-colors"
            >
              <LogOut size={15} className="flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  function isActive(item) {
    if (item.path === '/') return location.pathname === '/';
    const section = new URLSearchParams(location.search).get('section') || 'home';
    return location.pathname === '/dashboard' && section === (item.section || 'home');
  }

  const linkTarget = (item) =>
    item.section && !user ? `/login?redirect=${encodeURIComponent(item.path)}` : item.path;

  function handleSignOut() { signOut(auth); navigate('/login'); }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: scrolled ? '1px solid #ebe2d8' : '1px solid transparent',
      transition: 'all 0.3s',
    }}>
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center no-underline flex-shrink-0">
          <Logo width={80} />
        </Link>

        {/* Desktop nav */}
        <div className="nav-desktop flex items-center gap-7">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.label}
              to={linkTarget(item)}
              className={[
                'text-sm font-semibold no-underline pb-px border-b-2 transition-colors whitespace-nowrap',
                isActive(item)
                  ? 'text-rose-dark border-rose-dark'
                  : 'text-ink border-transparent hover:text-rose',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
          {user && profile?.role === 'admin' && (
            <Link to="/admin" className="text-sm font-semibold text-ink-muted no-underline">Admin</Link>
          )}
        </div>

        {/* Desktop auth */}
        <div className="nav-desktop flex items-center gap-3">
          {user ? (
            <UserAvatar user={user} onSignOut={handleSignOut} />
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink no-underline px-3 py-2 whitespace-nowrap">Sign in</Link>
              <Link to="/login?mode=signup" className="text-sm font-bold text-white no-underline bg-rose-dark rounded-lg px-[18px] py-[7px] whitespace-nowrap hover:bg-rose transition-colors">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(o => !o)} className="nav-burger bg-transparent border-none cursor-pointer p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-white border-t border-border px-6 pt-4 pb-6 flex flex-col">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.label}
              to={linkTarget(item)}
              className={[
                'text-[15px] font-semibold no-underline py-3 border-b border-border',
                isActive(item) ? 'text-rose-dark' : 'text-ink',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 py-3 border-b border-border">
                  <div className="w-8 h-8 rounded-full bg-rose flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold font-serif">
                      {(user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink font-sans truncate">{user?.displayName || user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-ink-muted font-sans truncate">{user?.email}</p>
                  </div>
                </div>
                <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 text-[15px] font-semibold text-ink no-underline py-3">
                  <Settings size={15} /> Account settings
                </Link>
                <button onClick={() => { handleSignOut(); setOpen(false); }} className="flex items-center gap-2 text-[15px] font-semibold text-ink-muted bg-transparent border-none cursor-pointer py-3 px-0 text-left">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" className="text-[15px] font-semibold text-ink no-underline">Sign in</Link>
                <Link to="/login?mode=signup" className="text-[15px] font-bold text-rose-dark no-underline">Get started →</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .nav-burger { display: none; }
        @media (max-width: 767px) {
          .nav-desktop { display: none !important; }
          .nav-burger   { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
