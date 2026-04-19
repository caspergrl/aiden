import { useState, useEffect, useRef } from 'react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, setDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  Users, Search, Plus, Edit2, Trash2, X, Check, Shield,
  ChevronDown, AlertCircle, RefreshCw,
} from 'lucide-react';
import { db, auth } from '../firebase';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, shadow } from '../theme';

// ─── helpers ──────────────────────────────────────────────────────────────────
const ROLES    = ['user', 'admin'];
const STATUSES = ['active', 'disabled'];

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Avatar({ name, email, size = 36 }) {
  const ch = (name || email || '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: C.roseDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, flexShrink: 0 }}>{ch}</div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}30`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
  );
}

// ─── User modal (create / edit) ───────────────────────────────────────────────
function UserModal({ user: u, onClose, onSave }) {
  const isNew = !u;
  const [name,     setName]     = useState(u?.name     || '');
  const [email,    setEmail]    = useState(u?.email    || '');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState(u?.role     || 'user');
  const [status,   setStatus]   = useState(u?.status   || 'active');
  const [notes,    setNotes]    = useState(u?.notes    || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleSave() {
    if (!email.trim()) { setError('Email is required.'); return; }
    if (isNew && !password.trim()) { setError('Password is required for new users.'); return; }
    setSaving(true); setError('');
    try {
      if (isNew) {
        const { user: fbUser } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'users', fbUser.uid), {
          uid: fbUser.uid, email: email.trim(), name: name.trim(),
          role, status, notes: notes.trim(), createdAt: serverTimestamp(),
        });
        onSave({ uid: fbUser.uid, email: email.trim(), name: name.trim(), role, status, notes: notes.trim(), createdAt: null });
      } else {
        await updateDoc(doc(db, 'users', u.uid), { name: name.trim(), role, status, notes: notes.trim() });
        onSave({ ...u, name: name.trim(), role, status, notes: notes.trim() });
      }
      onClose();
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
      };
      setError(msgs[e.code] || e.message || 'Something went wrong.');
    }
    setSaving(false);
  }

  const inputStyle = { width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,32,26,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(40,30,20,0.22)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: serif, fontSize: 22, color: C.text }}>{isNew ? 'Add user' : 'Edit user'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email {!isNew && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(read only)</span>}</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" disabled={!isNew} style={{ ...inputStyle, opacity: isNew ? 1 : 0.6 }} />
          </div>
          {isNew && (
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" style={inputStyle} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes (internal)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any admin notes about this user…" rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fdf5f5', border: `1px solid ${C.coral}30`, borderRadius: 10, padding: '10px 14px', marginTop: 16 }}>
            <AlertCircle size={15} color={C.coral} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: C.coral }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, background: C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : isNew ? 'Create user' : 'Save changes'}
          </button>
          <button onClick={onClose} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ user: u, onClose, onDelete }) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (confirm !== u.email) return;
    setDeleting(true);
    await deleteDoc(doc(db, 'users', u.uid));
    onDelete(u.uid);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,32,26,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(40,30,20,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: serif, fontSize: 20, color: C.text }}>Delete user</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 6 }}>
          This will permanently delete <strong style={{ color: C.text }}>{u.name || u.email}</strong>'s profile data from Aiden. Their Firebase Auth account remains. This cannot be undone.
        </p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>Type <strong>{u.email}</strong> to confirm:</p>
        <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={u.email}
          style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDelete} disabled={confirm !== u.email || deleting}
            style={{ flex: 1, background: confirm === u.email ? C.coral : C.border, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: confirm === u.email ? 'pointer' : 'default' }}>
            {deleting ? 'Deleting…' : 'Delete user'}
          </button>
          <button onClick={onClose} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main admin page ───────────────────────────────────────────────────────────
export default function Admin() {
  const { user: me } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRole]   = useState('all');
  const [statusFilter, setStatus] = useState('all');

  const [editUser,   setEditUser]   = useState(null);  // null = closed, false = new, obj = editing
  const [deleteUser, setDeleteUser] = useState(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
    const matchR = roleFilter   === 'all' || u.role   === roleFilter;
    const matchS = statusFilter === 'all' || u.status === statusFilter;
    return matchQ && matchR && matchS;
  });

  const stats = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin').length,
    active:   users.filter(u => u.status === 'active').length,
    disabled: users.filter(u => u.status === 'disabled').length,
  };

  const roleColor  = r => r === 'admin'    ? C.roseDark : C.primary;
  const statColor  = s => s === 'active'   ? C.sage     : C.coral;

  const filterBtn = (val, cur, fn) => ({
    background: cur === val ? C.roseDark : C.bgWarm,
    color:      cur === val ? '#fff'     : C.muted,
    border: `1px solid ${cur === val ? C.roseDark : C.border}`,
    borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bgWarm }}>
      <Navbar />

      {editUser !== null && (
        <UserModal
          user={editUser === false ? null : editUser}
          onClose={() => setEditUser(null)}
          onSave={saved => {
            if (editUser === false) {
              setUsers(u => [saved, ...u]);
            } else {
              setUsers(u => u.map(x => x.uid === saved.uid ? saved : x));
            }
          }}
        />
      )}

      {deleteUser && (
        <DeleteModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDelete={uid => setUsers(u => u.filter(x => x.uid !== uid))}
        />
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 8 }}>Admin</p>
            <h1 style={{ fontFamily: serif, fontSize: 32, color: C.text, letterSpacing: -0.5 }}>User management</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: C.muted, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setEditUser(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={14} /> Add user
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total users',   value: stats.total,    color: C.primary },
            { label: 'Admins',        value: stats.admins,   color: C.roseDark },
            { label: 'Active',        value: stats.active,   color: C.sage },
            { label: 'Disabled',      value: stats.disabled, color: C.coral },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(80,60,40,0.04)' }}>
              <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>{loading ? '—' : value}</p>
              <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={15} color={C.mutedLight} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 14, color: C.text, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.mutedLight, fontWeight: 600, alignSelf: 'center' }}>Role:</span>
            {['all', 'user', 'admin'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={filterBtn(r, roleFilter, setRole)}>{r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.mutedLight, fontWeight: 600, alignSelf: 'center' }}>Status:</span>
            {['all', 'active', 'disabled'].map(s => (
              <button key={s} onClick={() => setStatus(s)} style={filterBtn(s, statusFilter, setStatus)}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(80,60,40,0.05)' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: C.mutedLight }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <p>Loading users…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: C.mutedLight }}>
              <Users size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>{search || roleFilter !== 'all' || statusFilter !== 'all' ? 'No users match your filters.' : 'No users yet. Add one above.'}</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.bgWarm }}>
                {['User', 'Role', 'Status', 'Joined', ''].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 800, color: C.mutedLight, letterSpacing: 0.7, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filtered.map(u => (
                <div key={u.uid} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bgWarm}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>

                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <Avatar name={u.name} email={u.email} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || <span style={{ color: C.mutedLight, fontStyle: 'italic' }}>No name</span>}</p>
                      <p style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      {u.uid === me?.uid && <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, background: C.primaryLight, borderRadius: 4, padding: '1px 6px' }}>YOU</span>}
                    </div>
                  </div>

                  {/* Role */}
                  <div><Badge label={u.role || 'user'} color={roleColor(u.role)} /></div>

                  {/* Status */}
                  <div><Badge label={u.status || 'active'} color={statColor(u.status)} /></div>

                  {/* Joined */}
                  <p style={{ fontSize: 12, color: C.muted }}>{fmtDate(u.createdAt)}</p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditUser(u)} title="Edit user"
                      style={{ width: 32, height: 32, background: C.primaryLight, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Edit2 size={13} color={C.primaryDark} />
                    </button>
                    <button onClick={() => setDeleteUser(u)} title="Delete user" disabled={u.uid === me?.uid}
                      style={{ width: 32, height: 32, background: u.uid === me?.uid ? C.bgWarm : '#fdf5f5', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: u.uid === me?.uid ? 'not-allowed' : 'pointer', opacity: u.uid === me?.uid ? 0.4 : 1 }}>
                      <Trash2 size={13} color={C.coral} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div style={{ padding: '12px 20px', background: C.bgWarm, borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 12, color: C.mutedLight }}>
                  Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Note */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 12, padding: '14px 16px', marginTop: 20 }}>
          <Shield size={15} color={C.primaryDark} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: C.primaryDark, lineHeight: 1.65 }}>
            <strong>Note:</strong> Deleting a user here removes their Aiden profile data only. Their Firebase Auth account remains active. To fully revoke access, disable their status or delete the account from Firebase Console.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
