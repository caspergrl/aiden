import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, addDoc, deleteDoc, onSnapshot, orderBy, query, limit, serverTimestamp } from 'firebase/firestore';
import { Home, CalendarDays, ClipboardList, Shield, MessageCircle, Users, Settings, Power, Menu, X, BookMarked, Plus, MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { auth, db } from '../../firebase';
import { useAuth } from '../../App';
import { C } from '../../theme';
import Logo from '../../components/Logo';

const NAV = [
  { id: 'home',      label: 'Home',      Icon: Home },
  { id: 'care',      label: 'Care',      Icon: Users },
  { id: 'calendar',  label: 'Calendar',  Icon: CalendarDays },
  { id: 'todo',      label: 'To Do',     Icon: ClipboardList },
  { id: 'resources', label: 'Resources', Icon: BookMarked },
];

const W_FULL = 220;
const W_ICON = 60;

// Portal tooltip — renders outside the sidebar so overflow:hidden doesn't clip it
function Tip({ label, children }) {
  const [pos, setPos] = useState(null);
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={e => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ top: r.top + r.height / 2, left: r.right + 10 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <span style={{
          position: 'fixed', top: pos.top, left: pos.left,
          transform: 'translateY(-50%)',
          background: 'rgba(28,24,20,0.88)', color: '#fff',
          padding: '5px 10px', borderRadius: 7,
          fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 9999,
        }}>
          {label}
        </span>,
        document.body
      )}
    </div>
  );
}

function HeartLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.0301 6.45257C18.6838 5.99731 18.2513 5.61472 17.7571 5.32667C17.263 5.03863 16.7169 4.85076 16.1502 4.7738C15.5834 4.69685 15.007 4.73231 14.4539 4.87817C13.9009 5.02403 13.382 5.27743 12.9269 5.62388L11.9824 6.34251L11.2638 5.39807C10.5644 4.47885 9.52843 3.87513 8.38386 3.71972C7.2393 3.56431 6.07987 3.86995 5.16065 4.56938C4.24143 5.26882 3.63771 6.30477 3.4823 7.44934C3.32689 8.5939 3.63253 9.75333 4.33196 10.6725L10.3251 18.5488L18.2014 12.5557C18.6566 12.2095 19.0392 11.7769 19.3273 11.2828C19.6153 10.7887 19.8032 10.2426 19.8801 9.67584C19.9571 9.10907 19.9216 8.53269 19.7758 7.97963C19.6299 7.42657 19.3765 6.90767 19.0301 6.45257Z" fill="#904848"/>
    </svg>
  );
}

export default function DashboardLayout({ active, children, fullWidth = false }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [chatsCollapsed, setChatsCollapsed] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('[data-conv-menu]')) setMenuOpenId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function saveRename(id) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setDoc(doc(db, 'users', user.uid, 'conversations', id), { title: trimmed }, { merge: true }).catch(() => {});
    }
    setRenamingId(null);
  }

  function startRename(id, title) {
    setMenuOpenId(null);
    setRenamingId(id);
    setRenameValue(title);
  }

  async function deleteConv(id) {
    setMenuOpenId(null);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', id));
      if (activeConvId === id) navigate('/chat');
    } catch (e) { console.error(e); }
  }

  async function duplicateConv(id) {
    setMenuOpenId(null);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid, 'conversations', id));
      if (!snap.exists()) return;
      const data = snap.data();
      const newRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
        title: `${(data.title || 'Chat').slice(0, 50)} (copy)`,
        messages: data.messages || [],
        updatedAt: serverTimestamp(),
        ...(data.recipientId ? { recipientId: data.recipientId } : {}),
      });
      navigate(`/chat?c=${newRef.id}`);
    } catch (e) { console.error(e); }
  }

  const activeConvId = new URLSearchParams(location.search).get('c');

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'conversations', 'askaiden')).then(snap => {
      if (snap.exists() && snap.data().messages?.length && !snap.data().title) {
        const firstUserMsg = snap.data().messages.find(m => m.role === 'user');
        const title = firstUserMsg?.text?.slice(0, 60) || 'Earlier conversations';
        setDoc(doc(db, 'users', user.uid, 'conversations', 'askaiden'),
          { title, updatedAt: snap.data().updatedAt || serverTimestamp() }, { merge: true }).catch(() => {});
      }
    }).catch(() => {});

    const q = query(collection(db, 'users', user.uid, 'conversations'), orderBy('updatedAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.title && !c.id.startsWith('_guidance')));
    }, err => { console.error('conversations onSnapshot error:', err); });
    return unsub;
  }, [user]);

  const isChatActive = active === 'chat';
  const isNewOrUnknownChat = !activeConvId || activeConvId.startsWith('new_') || !conversations.some(c => c.id === activeConvId);

  function makeSidebar(isCollapsed, onNavClick = () => {}, showToggle = false) {
    const p = isCollapsed ? '20px 8px' : '20px 12px';

    function navBtn(id, label, Icon) {
      const isActive = active === id;
      const btn = (
        <button
          onClick={() => { navigate('/' + id); onNavClick(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 12,
            padding: isCollapsed ? '10px 0' : '10px 16px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isActive ? '#f5f5f5' : 'transparent',
            color: isActive ? C.text : C.muted,
            fontSize: 14, fontWeight: isActive ? 600 : 400,
            transition: 'all 0.15s', textAlign: 'left',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9f9f9'; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
          {!isCollapsed && label}
        </button>
      );
      return isCollapsed
        ? <Tip key={id} label={label}>{btn}</Tip>
        : <div key={id}>{btn}</div>;
    }

    function bottomLink(to, label, Icon) {
      const id = to.replace('/', '');
      const isActive = active === id;
      const sharedStyle = {
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: isCollapsed ? 0 : 12,
        padding: isCollapsed ? '10px 0' : '10px 16px',
        borderRadius: 12, fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? C.text : C.muted,
        background: isActive ? '#f5f5f5' : 'none',
        textDecoration: 'none', width: '100%', textAlign: 'left',
      };
      const inner = <><Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />{!isCollapsed && label}</>;
      const el = <Link to={to} style={sharedStyle}>{inner}</Link>;
      return isCollapsed
        ? <Tip key={to} label={label}>{el}</Tip>
        : <div key={to}>{el}</div>;
    }

    function bottomBtn(label, Icon, onClick, id = '') {
      const isActive = active === id;
      const btn = (
        <button
          onClick={onClick}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 12,
            padding: isCollapsed ? '10px 0' : '10px 16px',
            borderRadius: 12, fontSize: 14,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? C.text : C.muted,
            background: isActive ? '#f5f5f5' : 'none',
            border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9f9f9'; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? '#f5f5f5' : 'none'; }}
        >
          <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
          {!isCollapsed && label}
        </button>
      );
      return isCollapsed
        ? <Tip key={label} label={label}>{btn}</Tip>
        : <div key={label}>{btn}</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: p }}>

        {/* Logo row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          marginBottom: 32, padding: isCollapsed ? 0 : '0 4px',
        }}>
          {isCollapsed
            ? (
              <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <HeartLogo />
              </button>
            )
            : <Logo width={80} />
          }
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {NAV.map(n => navBtn(n.id, n.label, n.Icon))}

          {/* Ask Aiden */}
          <div style={{ marginTop: 4 }}>
            {isCollapsed ? (
              <Tip label="Ask Aiden">
                <button
                  onClick={() => { navigate('/chat?c=new_' + Date.now().toString(36)); onNavClick(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isChatActive && isNewOrUnknownChat ? '#f5f5f5' : 'transparent',
                    color: isChatActive ? C.text : C.muted, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!(isChatActive && isNewOrUnknownChat)) e.currentTarget.style.background = '#f9f9f9'; }}
                  onMouseLeave={e => { if (!(isChatActive && isNewOrUnknownChat)) e.currentTarget.style.background = 'transparent'; }}
                >
                  <MessageCircle size={17} strokeWidth={isChatActive ? 2.2 : 1.8} />
                </button>
              </Tip>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => { navigate('/chat?c=new_' + Date.now().toString(36)); onNavClick(); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: isChatActive && isNewOrUnknownChat ? '#f5f5f5' : 'transparent',
                      color: isChatActive ? C.text : C.muted,
                      fontSize: 14, fontWeight: isChatActive ? 600 : 400,
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!(isChatActive && isNewOrUnknownChat)) e.currentTarget.style.background = '#f9f9f9'; }}
                    onMouseLeave={e => { if (!(isChatActive && isNewOrUnknownChat)) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <MessageCircle size={17} strokeWidth={isChatActive ? 2.2 : 1.8} />
                    Ask Aiden
                  </button>
                  {conversations.length > 0 && (
                    <button
                      onClick={() => setChatsCollapsed(c => !c)}
                      title={chatsCollapsed ? 'Expand chats' : 'Collapse chats'}
                      style={{ padding: '6px 6px', background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight, borderRadius: 6, flexShrink: 0, transition: 'transform 0.2s', transform: chatsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.text}
                      onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}>
                      <ChevronDown size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/chat?c=new_' + Date.now().toString(36)); onNavClick(); }}
                    title="New chat"
                    style={{ padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight, borderRadius: 6, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.rose}
                    onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}>
                    <Plus size={15} />
                  </button>
                </div>

                {conversations.length > 0 && !chatsCollapsed && (
                  <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {conversations.map(c => {
                      const isActive = isChatActive && activeConvId === c.id;
                      const displayTitle = c.title.length > 18 ? c.title.slice(0, 18) + '…' : c.title;
                      if (renamingId === c.id) {
                        return (
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
                              fontSize: 13, color: C.text, background: '#fff', boxSizing: 'border-box',
                            }}
                          />
                        );
                      }
                      return (
                        <div key={c.id} data-conv-menu="1" style={{ position: 'relative' }} className="conv-row">
                          <button
                            onClick={() => { navigate(`/chat?c=${c.id}`); onNavClick(); }}
                            onDoubleClick={() => startRename(c.id, c.title)}
                            title={c.title.length > 18 ? c.title : undefined}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center',
                              padding: '7px 30px 7px 44px', borderRadius: 6, border: 'none',
                              cursor: 'pointer', textAlign: 'left',
                              background: isActive ? C.roseLight : 'transparent',
                              color: isActive ? C.roseDark : C.muted,
                              fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.1s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = C.text; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = C.muted; }}>
                            {displayTitle}
                          </button>
                          <button
                            data-conv-menu="1"
                            onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === c.id ? null : c.id); }}
                            className="conv-more-btn"
                            style={{
                              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                              padding: '3px 5px', background: 'none', border: 'none', cursor: 'pointer',
                              color: menuOpenId === c.id ? C.text : C.mutedLight, borderRadius: 4, lineHeight: 1,
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = C.text}
                            onMouseLeave={e => { if (menuOpenId !== c.id) e.currentTarget.style.color = C.mutedLight; }}>
                            <MoreHorizontal size={13} />
                          </button>
                          {menuOpenId === c.id && (
                            <div data-conv-menu="1" style={{
                              position: 'absolute', left: 44, top: '100%', zIndex: 200,
                              background: '#fff', borderRadius: 8,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 148,
                              overflow: 'hidden', marginTop: 2,
                            }}>
                              {[
                                { label: 'Rename',    action: () => startRename(c.id, c.title) },
                                { label: 'Duplicate', action: () => duplicateConv(c.id) },
                                { label: 'Delete',    action: () => deleteConv(c.id), danger: true },
                              ].map(item => (
                                <button key={item.label} onClick={item.action} style={{
                                  width: '100%', padding: '9px 14px', border: 'none', background: '#fff',
                                  fontSize: 13, cursor: 'pointer', textAlign: 'left',
                                  color: item.danger ? '#c0392b' : C.text,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom links */}
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {profile?.role === 'admin' && bottomLink('/admin', 'Admin panel', Shield)}
          {bottomBtn('Settings', SlidersHorizontal, () => { navigate('/settings'); onNavClick(); }, 'settings')}
          {bottomLink('/account', 'Account', Settings)}
          {bottomBtn('Sign out', Power, () => { signOut(auth); navigate('/login'); })}

          {/* Collapse / expand toggle — desktop only, same padding keeps icon at same X */}
          {showToggle && <Tip label={isCollapsed ? 'Expand menu' : 'Collapse menu'}>
            <button
              onClick={toggleCollapsed}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: isCollapsed ? 0 : 12,
                padding: '10px 16px',
                borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 500,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
            >
              {isCollapsed
                ? <ChevronRight size={18} strokeWidth={1.8} />
                : <ChevronLeft size={18} strokeWidth={1.8} />}
              {!isCollapsed && 'Collapse menu'}
            </button>
          </Tip>}
        </div>
      </div>
    );
  }

  const sidebarW = collapsed ? W_ICON : W_FULL;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7' }}>

      {/* Desktop sidebar */}
      <div
        className="sidebar-desktop"
        style={{
          width: sidebarW, background: '#fff', flexShrink: 0,
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          overflowY: 'auto', overflowX: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        {makeSidebar(collapsed, () => {}, true)}
      </div>

      {/* Mobile header */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: '#fff', zIndex: 50, alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }} className="mobile-header">
        <Logo width={72} />
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {mobileOpen ? <X size={22} color={C.text} /> : <Menu size={22} color={C.text} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(38,32,26,0.4)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ width: 240, height: '100%', background: '#fff' }} onClick={e => e.stopPropagation()}>
            {makeSidebar(false, () => setMobileOpen(false))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className="main-content"
        style={{ flex: 1, marginLeft: sidebarW, minHeight: '100vh', transition: 'margin-left 0.2s ease' }}
      >
        {fullWidth ? children : (
          <div className="page-wrap">{children}</div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-top: 56px; transition: none !important; }
        }
        .conv-more-btn { opacity: 0; }
        .conv-row:hover .conv-more-btn { opacity: 1; }
        .page-wrap { max-width: 960px; margin: 0 auto; }
        .page-body { padding: 40px 48px; }
        @media (max-width: 1024px) { .page-body { padding: 32px 32px; } }
        @media (max-width: 768px) { .page-body { padding: 20px 16px; } }
        .cal-layout { display: flex; flex-direction: row; gap: 24px; align-items: flex-start; }
        @media (max-width: 768px) { .cal-layout { flex-direction: column; } }
      `}</style>
    </div>
  );
}
