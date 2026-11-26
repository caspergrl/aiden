import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, onSnapshot, orderBy, query, limit, serverTimestamp } from 'firebase/firestore';
import { Home, CalendarDays, ClipboardList, Shield, MessageCircle, Users, Settings, LogOut, Menu, X, BookMarked, Plus } from 'lucide-react';
import { auth, db } from '../../firebase';
import { useAuth } from '../../App';
import { C } from '../../theme';
import Logo from '../../components/Logo';

const NAV = [
  { id: 'home',      label: 'Home',       Icon: Home },
  { id: 'care',      label: 'Care',       Icon: Users },
  { id: 'calendar',  label: 'Calendar',   Icon: CalendarDays },
  { id: 'todo',      label: 'To Do',      Icon: ClipboardList },
  { id: 'resources', label: 'Resources',  Icon: BookMarked },
  { id: 'chat',      label: 'Ask Aiden',  Icon: MessageCircle },
];

export default function DashboardLayout({ active, children }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  async function saveRename(id) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setDoc(doc(db, 'users', user.uid, 'conversations', id), { title: trimmed }, { merge: true }).catch(() => {});
    }
    setRenamingId(null);
  }

  const activeConvId = new URLSearchParams(location.search).get('c');

  useEffect(() => {
    if (!user) return;

    // Migrate old 'askaiden' conversation by writing a title if it has messages
    getDoc(doc(db, 'users', user.uid, 'conversations', 'askaiden')).then(snap => {
      if (snap.exists() && snap.data().messages?.length && !snap.data().title) {
        const firstUserMsg = snap.data().messages.find(m => m.role === 'user');
        const title = firstUserMsg?.text?.slice(0, 60) || 'Earlier conversations';
        setDoc(doc(db, 'users', user.uid, 'conversations', 'askaiden'),
          { title, updatedAt: snap.data().updatedAt || serverTimestamp() }, { merge: true }).catch(() => {});
      }
    }).catch(() => {});

    const q = query(
      collection(db, 'users', user.uid, 'conversations'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // show only user-initiated conversations (not guidance sidecars)
        .filter(c => c.title && !c.id.startsWith('_guidance'));
      setConversations(convs);
    }, (err) => { console.error('conversations onSnapshot error:', err); });
    return unsub;
  }, [user]);

  function NavItem({ id, label, Icon }) {
    const isActive = active === id && id !== 'chat';
    return (
      <button onClick={() => { navigate('/' + id); setMobileOpen(false); }} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
        background: isActive ? '#f5f5f5' : 'transparent',
        color: isActive ? C.text : C.muted,
        fontSize: 14, fontWeight: isActive ? 600 : 400,
        borderLeft: isActive ? `3px solid ${C.rose}` : '3px solid transparent',
        transition: 'all 0.15s', textAlign: 'left',
      }}>
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
        {label}
      </button>
    );
  }

  const isChatActive = active === 'chat';
  // A new chat has no ID, starts with 'new_', or is not yet in the saved list
  const isNewOrUnknownChat = !activeConvId || activeConvId.startsWith('new_') || !conversations.some(c => c.id === activeConvId);

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px' }}>
      {/* Logo */}
      <div style={{ padding: '0 6px', marginBottom: 32 }}>
        <Logo width={80} />
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {NAV.filter(n => n.id !== 'chat').map(n => <NavItem key={n.id} {...n} />)}

        {/* Ask Aiden section */}
        <div style={{ marginTop: 4 }}>
          {/* Ask Aiden header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              onClick={() => { navigate('/chat?c=new_' + Date.now().toString(36)); setMobileOpen(false); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isChatActive && isNewOrUnknownChat ? '#f5f5f5' : 'transparent',
                color: isChatActive ? C.text : C.muted,
                fontSize: 14, fontWeight: isChatActive ? 600 : 400,
                borderLeft: isChatActive && isNewOrUnknownChat ? `3px solid ${C.rose}` : '3px solid transparent',
                transition: 'all 0.15s', textAlign: 'left',
              }}>
              <MessageCircle size={17} strokeWidth={isChatActive ? 2.2 : 1.8} />
              Ask Aiden
            </button>
            <button
              onClick={() => { navigate('/chat?c=new_' + Date.now().toString(36)); setMobileOpen(false); }}
              title="New chat"
              style={{ padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight, borderRadius: 6, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.rose}
              onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}>
              <Plus size={15} />
            </button>
          </div>

          {/* Past conversations */}
          {conversations.length > 0 && (
            <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {conversations.map(c => {
                const isActive = isChatActive && activeConvId === c.id;
                const displayTitle = c.title.length > 18 ? c.title.slice(0, 18) + '…' : c.title;
                return renamingId === c.id ? (
                  <input
                    key={c.id}
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveRename(c.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => saveRename(c.id)}
                    style={{
                      width: '100%', padding: '6px 8px 6px 44px', borderRadius: 6,
                      border: `1px solid ${C.rose}`, outline: 'none',
                      fontSize: 13, color: C.text, background: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <button
                    key={c.id}
                    onClick={() => { navigate(`/chat?c=${c.id}`); setMobileOpen(false); }}
                    onDoubleClick={() => { setRenamingId(c.id); setRenameValue(c.title); }}
                    title={c.title.length > 18 ? c.title : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '7px 16px 7px 44px', borderRadius: 6, border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                      background: isActive ? C.roseLight : 'transparent',
                      color: isActive ? C.roseDark : C.muted,
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      borderLeft: isActive ? `3px solid ${C.rose}` : '3px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.muted; }}>
                    {displayTitle}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom links */}
      <div style={{ borderTop: '1px solid #ebebeb', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        {profile?.role === 'admin' && (
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: 'none' }}>
            <Shield size={18} strokeWidth={1.8} /> Admin panel
          </Link>
        )}
        <Link to="/account" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: 'none' }}>
          <Settings size={18} strokeWidth={1.8} /> Account
        </Link>
        <button onClick={() => { signOut(auth); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <LogOut size={18} strokeWidth={1.8} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>

      {/* Desktop sidebar */}
      <div style={{ width: 220, background: '#fff', borderRight: '1px solid #ebebeb', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }} className="sidebar-desktop">
        {sidebar}
      </div>

      {/* Mobile header */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#fff', borderBottom: '1px solid #ebebeb', zIndex: 50, alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }} className="mobile-header">
        <Logo width={72} />
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
