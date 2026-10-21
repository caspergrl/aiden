import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, writeBatch, serverTimestamp, addDoc,
} from 'firebase/firestore';
import {
  Building2, Users, Plus, X, Mail, ArrowLeft,
  Check, Trash2, Shield, Save, Crown,
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { C, serif, shadow } from '../theme';

export const ORG_TYPES = [
  { value: 'personal_care_home',    label: 'Personal care home' },
  { value: 'assisted_living',       label: 'Assisted living facility' },
  { value: 'skilled_nursing',       label: 'Skilled nursing facility' },
  { value: 'home_care_agency',      label: 'Home care agency' },
  { value: 'other',                 label: 'Other' },
];

const ROLE_INFO = {
  owner:     { label: 'Owner',     color: '#7a4a3a', bg: '#fdf0ec' },
  admin:     { label: 'Admin',     color: '#4a6d8e', bg: '#dde8f5' },
  caregiver: { label: 'Caregiver', color: '#3a6e58', bg: '#e4f0eb' },
  viewer:    { label: 'Viewer',    color: '#8a7d76', bg: '#f5f2ee' },
};

export function RoleBadge({ role }) {
  const info = ROLE_INFO[role] || ROLE_INFO.viewer;
  return (
    <span style={{ background: info.bg, color: info.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
      {info.label}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 28px', boxShadow: '0 2px 12px rgba(80,60,40,0.05)', ...style }}>
      {children}
    </div>
  );
}

// ── Upgrade to Business modal ───────────────────────────────────────────────
export function UpgradeModal({ onClose, onUpgraded }) {
  const { user, profile, setProfile, setOrg, setOrgRole } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleCreate() {
    if (!orgName.trim() || !orgType) return;
    setLoading(true); setError('');
    try {
      const orgId    = crypto.randomUUID();
      const batch    = writeBatch(db);
      const orgRef   = doc(db, 'organizations', orgId);
      const memRef   = doc(db, 'organizations', orgId, 'members', user.uid);
      const userRef  = doc(db, 'users', user.uid);

      batch.set(orgRef, {
        name: orgName.trim(), type: orgType, ownerId: user.uid,
        plan: 'business', createdAt: serverTimestamp(),
      });
      batch.set(memRef, {
        uid: user.uid, email: user.email, name: profile?.name || '',
        role: 'owner', addedAt: serverTimestamp(), addedBy: user.uid,
      });
      batch.update(userRef, { orgId, orgRole: 'owner', plan: 'business' });
      await batch.commit();

      const newOrg = { id: orgId, name: orgName.trim(), type: orgType, ownerId: user.uid, plan: 'business' };
      setOrg(newOrg);
      setOrgRole('owner');
      setProfile(p => ({ ...p, orgId, orgRole: 'owner', plan: 'business' }));
      onUpgraded?.();
    } catch (e) {
      console.error('create org:', e);
      setError('Could not create organization. Please try again.');
    }
    setLoading(false);
  }

  const ready = !loading && orgName.trim() && orgType;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,30,20,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', maxWidth: 480, width: '100%', boxShadow: shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 6 }}>Business Account</p>
            <h2 style={{ fontFamily: serif, fontSize: 26, color: C.text, letterSpacing: -0.5 }}>Set up your organization</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: C.bgWarm, borderRadius: 14, padding: '16px 18px', marginBottom: 24 }}>
          {[
            'Invite your care team and assign roles',
            'Role-based permissions (admin, caregiver, viewer)',
            'Centralized account for your facility',
            'Manage all team members in one place',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#4a9e7a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={10} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 13, color: C.text }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Organization name</label>
            <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Sunrise Care Home"
              style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Organization type</label>
            <select value={orgType} onChange={e => setOrgType(e.target.value)}
              style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: orgType ? C.text : C.mutedLight, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="" disabled>Select type…</option>
              {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: C.coral, marginTop: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!ready}
            style={{ flex: 2, background: ready ? C.roseDark : C.border, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: ready ? 'pointer' : 'default', transition: 'background 0.2s' }}>
            {loading ? 'Creating…' : 'Create organization'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Organization management page ────────────────────────────────────────────
export default function Org() {
  const { user, org, orgRole, setOrg, setOrgRole, setProfile } = useAuth();
  const navigate = useNavigate();

  const [members,       setMembers]       = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [editName, setEditName]           = useState(org?.name || '');
  const [editType, setEditType]           = useState(org?.type || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved,  setSettingsSaved]  = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('caregiver');
  const [inviting,    setInviting]    = useState(false);
  const [inviteMsg,   setInviteMsg]   = useState({ type: '', text: '' });

  const [changingRole, setChangingRole] = useState({});
  const [removing,     setRemoving]     = useState({});

  const [showDissolve,    setShowDissolve]    = useState(false);
  const [dissolveConfirm, setDissolveConfirm] = useState('');
  const [dissolving,      setDissolving]      = useState(false);

  const canAdmin = orgRole === 'owner' || orgRole === 'admin';
  const isOwner  = orgRole === 'owner';

  useEffect(() => {
    if (org) { setEditName(org.name || ''); setEditType(org.type || ''); }
  }, [org]);

  useEffect(() => {
    if (!org?.id) return;
    loadMembers();
    if (canAdmin) loadInvites();
  }, [org?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMembers() {
    setLoadingMembers(true);
    const snap = await getDocs(collection(db, 'organizations', org.id, 'members'));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoadingMembers(false);
  }

  async function loadInvites() {
    const q = query(collection(db, 'orgInvites'), where('orgId', '==', org.id), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    setPendingInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function saveSettings() {
    if (!editName.trim() || !editType || savingSettings) return;
    setSavingSettings(true);
    await updateDoc(doc(db, 'organizations', org.id), { name: editName.trim(), type: editType });
    setOrg(o => ({ ...o, name: editName.trim(), type: editType }));
    setSavingSettings(false); setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true); setInviteMsg({ type: '', text: '' });
    try {
      if (members.find(m => m.email?.toLowerCase() === email)) {
        setInviteMsg({ type: 'error', text: 'This person is already a member.' });
        setInviting(false); return;
      }
      if (pendingInvites.find(i => i.email?.toLowerCase() === email)) {
        setInviteMsg({ type: 'error', text: 'An invite is already pending for this email.' });
        setInviting(false); return;
      }
      const ref = await addDoc(collection(db, 'orgInvites'), {
        orgId: org.id, orgName: org.name, email,
        role: inviteRole, invitedBy: user.uid, invitedByEmail: user.email,
        createdAt: serverTimestamp(), status: 'pending',
      });
      setPendingInvites(p => [...p, { id: ref.id, orgId: org.id, orgName: org.name, email, role: inviteRole, invitedBy: user.uid, invitedByEmail: user.email, status: 'pending' }]);
      setInviteMsg({ type: 'success', text: `Invite sent to ${email}. They'll join automatically when they sign in to Aiden.` });
      setInviteEmail('');
    } catch (e) {
      console.error('invite:', e);
      setInviteMsg({ type: 'error', text: 'Could not send invite. Please try again.' });
    }
    setInviting(false);
  }

  async function cancelInvite(inviteId) {
    await updateDoc(doc(db, 'orgInvites', inviteId), { status: 'cancelled' });
    setPendingInvites(p => p.filter(i => i.id !== inviteId));
  }

  async function changeRole(memberId, newRole) {
    setChangingRole(p => ({ ...p, [memberId]: true }));
    try {
      await updateDoc(doc(db, 'organizations', org.id, 'members', memberId), { role: newRole });
      setMembers(p => p.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (e) { console.error('changeRole:', e); }
    setChangingRole(p => ({ ...p, [memberId]: false }));
  }

  async function removeMember(memberId) {
    setRemoving(p => ({ ...p, [memberId]: true }));
    try {
      await deleteDoc(doc(db, 'organizations', org.id, 'members', memberId));
      setMembers(p => p.filter(m => m.id !== memberId));
      // If removing self, clear local org state
      if (memberId === user.uid) {
        await updateDoc(doc(db, 'users', user.uid), { orgId: null, orgRole: null });
        setOrg(null); setOrgRole(null);
        setProfile(p => ({ ...p, orgId: null, orgRole: null }));
        navigate('/account');
      }
    } catch (e) { console.error('removeMember:', e); }
    setRemoving(p => ({ ...p, [memberId]: false }));
  }

  async function dissolveOrg() {
    if (dissolveConfirm !== org.name || dissolving) return;
    setDissolving(true);
    try {
      const batch = writeBatch(db);
      members.forEach(m => {
        batch.delete(doc(db, 'organizations', org.id, 'members', m.id));
      });
      batch.delete(doc(db, 'organizations', org.id));
      batch.update(doc(db, 'users', user.uid), { orgId: null, orgRole: null, plan: 'personal' });
      await batch.commit();
      for (const inv of pendingInvites) {
        await updateDoc(doc(db, 'orgInvites', inv.id), { status: 'cancelled' });
      }
      setOrg(null); setOrgRole(null);
      setProfile(p => ({ ...p, orgId: null, orgRole: null, plan: 'personal' }));
      navigate('/account');
    } catch (e) { console.error('dissolveOrg:', e); }
    setDissolving(false);
  }

  const orgTypeLabel = ORG_TYPES.find(t => t.value === org?.type)?.label || org?.type || '';
  const roleOrder    = { owner: 0, admin: 1, caregiver: 2, viewer: 3 };
  const sortedMembers = [...members].sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));

  if (!org) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgWarm }}>
        <Navbar />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: C.muted }}>
            You're not part of an organization.{' '}
            <a href="/account" style={{ color: C.roseDark, fontWeight: 700 }}>Go to account settings</a>
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgWarm }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '100px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => navigate('/account')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.mutedLight, fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
            <ArrowLeft size={14} /> Account settings
          </button>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: C.roseDark, textTransform: 'uppercase', marginBottom: 8 }}>Business Account</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: serif, fontSize: 32, color: C.text, letterSpacing: -0.5 }}>{org.name}</h1>
            <span style={{ background: C.roseDark + '18', color: C.roseDark, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>BUSINESS</span>
          </div>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {orgTypeLabel} · <RoleBadge role={orgRole} />
          </p>
        </div>

        {/* Team members */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Users size={17} color={C.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Team members</h2>
            <span style={{ marginLeft: 'auto', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: C.muted }}>{members.length}</span>
          </div>

          {loadingMembers ? (
            <p style={{ fontSize: 13, color: C.mutedLight }}>Loading…</p>
          ) : sortedMembers.map(member => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: member.role === 'owner' ? C.roseDark : C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                {(member.name || member.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.name || member.email}
                  {member.id === user.uid && <span style={{ fontSize: 12, color: C.mutedLight, fontWeight: 400, marginLeft: 6 }}>(you)</span>}
                </p>
                {member.name && <p style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {canAdmin && member.role !== 'owner' ? (
                  <select value={member.role} onChange={e => changeRole(member.id, e.target.value)} disabled={!!changingRole[member.id]}
                    style={{ background: ROLE_INFO[member.role]?.bg || C.bgWarm, color: ROLE_INFO[member.role]?.color || C.muted, border: 'none', borderRadius: 20, padding: '4px 10px 4px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', outline: 'none' }}>
                    <option value="admin">Admin</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <RoleBadge role={member.role} />
                )}
                {canAdmin && member.id !== user.uid && member.role !== 'owner' && (
                  <button onClick={() => removeMember(member.id)} disabled={!!removing[member.id]}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mutedLight, padding: 4, display: 'flex', alignItems: 'center', opacity: removing[member.id] ? 0.4 : 1 }}
                    title="Remove member">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {!loadingMembers && members.length === 0 && (
            <p style={{ fontSize: 13, color: C.mutedLight }}>No members yet.</p>
          )}
        </Card>

        {/* Invite */}
        {canAdmin && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Mail size={17} color={C.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Invite a team member</h2>
            </div>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 1.65 }}>
              They'll automatically join your organization the next time they sign in to Aiden with that email address.
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" type="email"
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                style={{ flex: 1, minWidth: 200, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none' }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 13, color: C.text, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <option value="admin">Admin</option>
                <option value="caregiver">Caregiver</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: inviting || !inviteEmail.trim() ? C.border : C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: inviting || !inviteEmail.trim() ? 'default' : 'pointer', transition: 'background 0.2s' }}>
              <Plus size={15} /> {inviting ? 'Sending…' : 'Send invite'}
            </button>
            {inviteMsg.text && (
              <p style={{ fontSize: 13, color: inviteMsg.type === 'error' ? C.coral : '#4a9e7a', marginTop: 10 }}>{inviteMsg.text}</p>
            )}

            {pendingInvites.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>Pending invites</p>
                {pendingInvites.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{inv.email}</p>
                      <p style={{ fontSize: 12, color: C.muted }}>Invited as <RoleBadge role={inv.role} /></p>
                    </div>
                    <button onClick={() => cancelInvite(inv.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: C.muted, cursor: 'pointer', flexShrink: 0 }}>
                      <X size={12} /> Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Permissions reference */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Shield size={17} color={C.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Roles & permissions</h2>
          </div>
          {[
            { role: 'owner',     desc: 'Full control — org settings, all members, and all data.' },
            { role: 'admin',     desc: 'Invite/remove members, edit org settings, and manage all care data.' },
            { role: 'caregiver', desc: 'Add, edit, and view all care recipients and their information.' },
            { role: 'viewer',    desc: 'Read-only access to care recipients. Cannot make changes.' },
          ].map(({ role, desc }) => (
            <div key={role} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ paddingTop: 1 }}><RoleBadge role={role} /></div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, flex: 1, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </Card>

        {/* Org settings */}
        {canAdmin && (
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Building2 size={17} color={C.primary} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Organization settings</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Organization name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Organization type</label>
                <select value={editType} onChange={e => setEditType(e.target.value)}
                  style={{ width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <button onClick={saveSettings} disabled={savingSettings || !editName.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: settingsSaved ? '#4a9e7a' : C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 700, cursor: savingSettings ? 'default' : 'pointer', transition: 'background 0.3s' }}>
                  {settingsSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save changes</>}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Leave org (non-owner) */}
        {!isOwner && (
          <Card style={{ border: `1px solid ${C.coral}30`, background: '#fffaf9' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>Leave organization</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>
              You'll be removed from the team and lose access to shared data.
            </p>
            <button onClick={() => removeMember(user.uid)} disabled={!!removing[user.uid]}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: removing[user.uid] ? 0.7 : 1 }}>
              Leave organization
            </button>
          </Card>
        )}

        {/* Dissolve org (owner only) */}
        {isOwner && (
          <Card style={{ border: `1px solid ${C.coral}30`, background: '#fffaf9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Trash2 size={17} color={C.coral} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Dissolve organization</h2>
            </div>
            {!showDissolve ? (
              <>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>
                  Permanently removes the organization and reverts all members to personal accounts. This cannot be undone.
                </p>
                <button onClick={() => setShowDissolve(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.coral}60`, color: C.coral, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Dissolve organization
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 14 }}>
                  Type the organization name to confirm: <strong>{org.name}</strong>
                </p>
                <input value={dissolveConfirm} onChange={e => setDissolveConfirm(e.target.value)} placeholder={org.name}
                  style={{ width: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setShowDissolve(false); setDissolveConfirm(''); }}
                    style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={dissolveOrg} disabled={dissolveConfirm !== org.name || dissolving}
                    style={{ background: dissolveConfirm === org.name ? C.coral : C.border, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: dissolveConfirm === org.name ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                    {dissolving ? 'Dissolving…' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
