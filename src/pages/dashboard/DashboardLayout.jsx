import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Home, CalendarDays, ClipboardList, Shield, MessageCircle, Heart, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { auth } from '../../firebase';
import { useAuth } from '../../App';
import { C, serif } from '../../theme';

const NAV = [
  { id: 'home',      label: 'Home',       Icon: Home },
  { id: 'care',      label: 'Care',        Icon: Users },
  { id: 'calendar',  label: 'Calendar',    Icon: CalendarDays },
  { id: 'list',      label: 'My List',     Icon: ClipboardList },
  { id: 'insurance', label: 'Insurance',   Icon: Shield },
  { id: 'chat',      label: 'Ask Aiden',   Icon: MessageCircle },
];

export default function DashboardLayout({ active, setActive, children }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function NavItem({ id, label, Icon }) {
    const isActive = active === id;
    return (
      <button onClick={() => { setActive(id); setMobileOpen(false); }} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: isActive ? C.roseDark : 'transparent',
        color: isActive ? '#fff' : C.muted,
        fontSize: 14, fontWeight: isActive ? 700 : 500,
        transition: 'all 0.15s', textAlign: 'left',
      }}>
        <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
        {label}
      </button>
    );
  }

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px', marginBottom: 32 }}>
        <Heart size={18} color={C.rose} fill={C.rose} />
        <span style={{ fontFamily: serif, fontSize: 22, color: C.text, letterSpacing: -0.5 }}>aiden</span>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV.map(n => <NavItem key={n.id} {...n} />)}
      </div>

      {/* Bottom links */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {profile?.role === 'admin' && (
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: 'none' }}>
            <Shield size={18} strokeWidth={1.8} /> Admin panel
          </Link>
        )}
        <Link to="/account" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: 'none' }}>
          <Settings size={18} strokeWidth={1.8} /> Account
        </Link>
        <button onClick={() => { signOut(auth); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <LogOut size={18} strokeWidth={1.8} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bgWarm }}>

      {/* Desktop sidebar */}
      <div style={{ width: 220, background: '#fff', borderRight: `1px solid ${C.border}`, flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }} className="sidebar-desktop">
        {sidebar}
      </div>

      {/* Mobile header */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#fff', borderBottom: `1px solid ${C.border}`, zIndex: 50, alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={16} color={C.rose} fill={C.rose} />
          <span style={{ fontFamily: serif, fontSize: 20, color: C.text }}>aiden</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {mobileOpen ? <X size={22} color={C.text} /> : <Menu size={22} color={C.text} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(38,32,26,0.4)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ width: 240, height: '100%', background: '#fff' }} onClick={e => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 220, minHeight: '100vh' }} className="main-content">
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-top: 56px; }
        }
      `}</style>
    </div>
  );
}
