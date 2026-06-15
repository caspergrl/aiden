import { useState } from 'react';
import {
  Link2, Plus, Trash2, Share2, ExternalLink, X,
  Search, Mail, MessageSquare, Pencil, Check, BookMarked,
} from 'lucide-react';
import { C, serif, shadowSm, radius } from '../../theme';

const CATEGORIES = ['Medical', 'Legal', 'Caregiver Support', 'Financial', 'Community', 'Other'];

function normalizeUrl(u) {
  if (!u) return u;
  return /^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`;
}

function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()); }
function isPhone(s) { return /^[\d\s\-+().]{7,}$/.test(s.trim()); }
function fmtPhone(s) { return s.replace(/\D/g, ''); }

// ─── Add / Edit resource modal ─────────────────────────────────────────────────
function ResourceModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    url:         initial?.url         || '',
    description: initial?.description || '',
    category:    initial?.category    || '',
  });
  const [urlErr, setUrlErr] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); if (k === 'url') setUrlErr(''); }

  function handleSave() {
    if (!form.title.trim()) return;
    if (!form.url.trim()) { setUrlErr('Please enter a URL.'); return; }
    onSave({ ...form, url: normalizeUrl(form.url) });
    onClose();
  }

  const inp = (placeholder, key, type = 'text', multiline = false) => {
    const shared = {
      value: form[key],
      onChange: e => set(key, e.target.value),
      placeholder,
      style: {
        width: '100%', border: `1px solid ${key === 'url' && urlErr ? '#c85c55' : C.border}`,
        borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.text,
        outline: 'none', background: '#fff', boxSizing: 'border-box',
        fontFamily: 'inherit', resize: multiline ? 'vertical' : 'none',
      },
    };
    return multiline ? <textarea rows={3} {...shared} /> : <input type={type} {...shared} />;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(38,32,26,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: serif, fontSize: 22, color: C.text }}>{initial ? 'Edit resource' : 'Add resource link'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color={C.muted} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Title *</label>
            {inp('e.g. Medicare Plan Finder', 'title')}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>URL *</label>
            {inp('https://example.com', 'url', 'url')}
            {urlErr && <p style={{ fontSize: 12, color: '#c85c55', marginTop: 4 }}>{urlErr}</p>}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description</label>
            {inp('Optional — what is this link for?', 'description', 'text', true)}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => set('category', form.category === c ? '' : c)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${form.category === c ? C.rose : C.border}`, background: form.category === c ? C.roseLight : '#fafafa', color: form.category === c ? C.roseDark : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', border: `1px solid ${C.border}`, borderRadius: 12, background: '#fff', color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!form.title.trim() || !form.url.trim()}
            style={{ flex: 2, padding: '11px 0', border: 'none', borderRadius: 12, background: form.title.trim() && form.url.trim() ? `linear-gradient(135deg, ${C.rose}, ${C.roseDark})` : C.border, color: '#fff', fontSize: 14, fontWeight: 700, cursor: form.title.trim() && form.url.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}>
            {initial ? 'Save changes' : 'Add link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ resource, recipients, onClose }) {
  const [method, setMethod]         = useState('sms'); // 'sms' | 'email'
  const [selRecip, setSelRecip]     = useState([]);    // recipient ids
  const [customInput, setCustomInput] = useState('');
  const [customList, setCustomList] = useState([]);    // { contact, method }
  const [sent, setSent]             = useState(false);

  // Recipients that have the relevant contact info for the current method
  const eligibleRecips = recipients.filter(r => method === 'sms' ? r.phone : r.email);

  function toggleRecip(id) {
    setSelRecip(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val) return;
    if (customList.find(c => c.contact === val)) { setCustomInput(''); return; }
    const detectedMethod = isEmail(val) ? 'email' : 'sms';
    setCustomList(p => [...p, { contact: val, method: detectedMethod }]);
    setCustomInput('');
  }

  function removeCustom(contact) { setCustomList(p => p.filter(c => c.contact !== contact)); }

  function buildMsg() {
    const body = `${resource.title}\n${resource.url}${resource.description ? `\n\n${resource.description}` : ''}`;
    return body;
  }

  function share() {
    const msg = buildMsg();
    const encoded = encodeURIComponent(msg);

    // Collect all targets
    const smsTargets  = [
      ...selRecip.filter(id => { const r = recipients.find(x => x.id === id); return r?.phone; }).map(id => recipients.find(x => x.id === id).phone),
      ...customList.filter(c => c.method === 'sms').map(c => c.contact),
    ];
    const emailTargets = [
      ...selRecip.filter(id => { const r = recipients.find(x => x.id === id); return r?.email; }).map(id => recipients.find(x => x.id === id).email),
      ...customList.filter(c => c.method === 'email').map(c => c.contact),
    ];

    if (emailTargets.length) {
      const subj = encodeURIComponent(`Resource: ${resource.title}`);
      const body = encodeURIComponent(`Hi,\n\nI wanted to share this resource with you:\n\n${resource.title}\n${resource.url}${resource.description ? `\n\n${resource.description}` : ''}\n\nSent via Aiden`);
      window.open(`mailto:${emailTargets.join(',')}?subject=${subj}&body=${body}`);
    }
    // SMS — open one at a time (browser limitation)
    smsTargets.forEach((phone, i) => {
      const num = fmtPhone(phone);
      setTimeout(() => window.open(`sms:${num}?body=${encoded}`), i * 300);
    });

    setSent(true);
    setTimeout(onClose, 1200);
  }

  const hasTargets = selRecip.length > 0 || customList.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(38,32,26,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: serif, fontSize: 20, color: C.text, marginBottom: 4 }}>Share link</h2>
            <p style={{ fontSize: 13, color: C.muted }}>{resource.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <X size={18} color={C.muted} />
          </button>
        </div>

        {/* Link preview */}
        <div style={{ background: C.bgWarm, borderRadius: 12, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link2 size={14} color={C.roseDark} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.url}</span>
        </div>

        {/* Method toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'sms', Icon: MessageSquare, label: 'SMS' }, { id: 'email', Icon: Mail, label: 'Email' }].map(({ id, Icon, label }) => (
            <button key={id} onClick={() => { setMethod(id); setSelRecip([]); }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 0', borderRadius: 12, border: `2px solid ${method === id ? C.rose : C.border}`, background: method === id ? C.roseLight : '#fff', color: method === id ? C.roseDark : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Recipient chips */}
        {eligibleRecips.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Care recipients</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {eligibleRecips.map(r => {
                const active = selRecip.includes(r.id);
                return (
                  <button key={r.id} onClick={() => toggleRecip(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? C.rose : C.border}`, background: active ? C.roseLight : '#fafafa', color: active ? C.roseDark : C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {active && <Check size={12} />}
                    <span>{r.nickname || r.name.split(' ')[0]}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>{method === 'sms' ? r.phone : r.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom contact input */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Add a contact</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
              placeholder={method === 'sms' ? 'Phone number' : 'Email address'}
              style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 14px', fontSize: 14, color: C.text, outline: 'none', background: '#fff' }}
            />
            <button onClick={addCustom} disabled={!customInput.trim()}
              style={{ background: customInput.trim() ? C.roseDark : C.border, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, cursor: customInput.trim() ? 'pointer' : 'default', fontSize: 13 }}>
              Add
            </button>
          </div>
          {/* Custom contacts list */}
          {customList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
              {customList.map(({ contact, method: m }) => (
                <span key={contact} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: C.text }}>
                  {m === 'email' ? <Mail size={11} color={C.muted} /> : <MessageSquare size={11} color={C.muted} />}
                  {contact}
                  <button onClick={() => removeCustom(contact)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: C.muted }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Send */}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 15, fontWeight: 700, color: C.sage }}>
            ✓ Opened in your {method === 'email' ? 'email app' : 'messages app'}
          </div>
        ) : (
          <button onClick={share} disabled={!hasTargets}
            style={{ width: '100%', padding: '13px 0', border: 'none', borderRadius: 14, background: hasTargets ? `linear-gradient(135deg, ${C.rose}, ${C.roseDark})` : C.border, color: '#fff', fontSize: 15, fontWeight: 700, cursor: hasTargets ? 'pointer' : 'default', transition: 'background 0.15s' }}>
            Share link
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Resources page ───────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  Medical:            { bg: '#e8f2fb', color: '#4a7aaa' },
  Legal:              { bg: '#ede8f8', color: '#7a5aaa' },
  'Caregiver Support': { bg: '#fdf0f0', color: '#c85c55' },
  Financial:          { bg: '#e8f4ec', color: '#4a8a5a' },
  Community:          { bg: '#fef5e4', color: '#a07030' },
  Other:              { bg: '#f0f0f4', color: '#7a7a8c' },
};

export default function Resources({ resources, onAdd, onUpdate, onDelete, recipients }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [shareItem, setShareItem]   = useState(null);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = resources.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.url.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    const matchesCat    = !filterCat || r.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const usedCats = [...new Set(resources.map(r => r.category).filter(Boolean))];

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      {showAdd && (
        <ResourceModal
          onClose={() => setShowAdd(false)}
          onSave={data => { onAdd({ ...data, createdAt: new Date().toISOString() }); setShowAdd(false); }}
        />
      )}
      {editItem && (
        <ResourceModal
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSave={data => { onUpdate(editItem.id, data); setEditItem(null); }}
        />
      )}
      {shareItem && (
        <ShareModal resource={shareItem} recipients={recipients} onClose={() => setShareItem(null)} />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Library</p>
        <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5, marginBottom: 6 }}>Resource Links</h1>
        <p style={{ fontSize: 14, color: C.muted }}>Save and share helpful links with your care recipients</p>
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} color={C.mutedLight} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…"
            style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px 10px 38px', fontSize: 14, color: C.text, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg, ${C.rose}, ${C.roseDark})`, border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Add link
        </button>
      </div>

      {/* Category filter */}
      {usedCats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={() => setFilterCat('')}
            style={{ padding: '4px 14px', borderRadius: 20, border: `1.5px solid ${!filterCat ? C.rose : C.border}`, background: !filterCat ? C.roseLight : '#fafafa', color: !filterCat ? C.roseDark : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            All
          </button>
          {usedCats.map(c => {
            const active = filterCat === c;
            const style  = CATEGORY_COLORS[c] || CATEGORY_COLORS.Other;
            return (
              <button key={c} onClick={() => setFilterCat(active ? '' : c)}
                style={{ padding: '4px 14px', borderRadius: 20, border: `1.5px solid ${active ? style.color : C.border}`, background: active ? style.bg : '#fafafa', color: active ? style.color : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* Resource cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BookMarked size={36} color={C.border} style={{ marginBottom: 14 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              {resources.length === 0 ? 'No links saved yet' : 'No results found'}
            </p>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              {resources.length === 0 ? 'Add your first resource link to get started.' : 'Try a different search or category.'}
            </p>
            {resources.length === 0 && (
              <button onClick={() => setShowAdd(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.roseLight, border: 'none', borderRadius: 12, padding: '10px 20px', color: C.roseDark, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={15} /> Add your first link
              </button>
            )}
          </div>
        )}

        {filtered.map(res => {
          const catStyle = res.category ? (CATEGORY_COLORS[res.category] || CATEGORY_COLORS.Other) : null;
          const isConfirming = confirmDel === res.id;
          return (
            <div key={res.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: '18px 20px', boxShadow: shadowSm, transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,60,40,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = shadowSm}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 14, background: catStyle ? catStyle.bg : C.bgWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Link2 size={18} color={catStyle ? catStyle.color : C.muted} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{res.title}</p>
                    {res.category && catStyle && (
                      <span style={{ background: catStyle.bg, color: catStyle.color, borderRadius: 10, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{res.category}</span>
                    )}
                  </div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.roseDark, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: res.description ? 6 : 0, wordBreak: 'break-all' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                    <ExternalLink size={11} style={{ flexShrink: 0 }} />
                    {res.url}
                  </a>
                  {res.description && (
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 4 }}>{res.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {isConfirming ? (
                    <>
                      <button onClick={() => { onDelete(res.id); setConfirmDel(null); }}
                        style={{ padding: '6px 12px', borderRadius: 10, background: '#fdf0f0', border: `1px solid ${C.rose}40`, color: C.rose, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Remove
                      </button>
                      <button onClick={() => setConfirmDel(null)}
                        style={{ padding: '6px 12px', borderRadius: 10, background: '#fafafa', border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <ActionBtn Icon={Share2} label="Share" onClick={() => setShareItem(res)} color={C.rose} />
                      <ActionBtn Icon={Pencil} label="Edit"  onClick={() => setEditItem(res)}  color={C.muted} />
                      <ActionBtn Icon={Trash2} label="Delete" onClick={() => setConfirmDel(res.id)} color={C.muted} />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ Icon, label, onClick, color }) {
  return (
    <button onClick={onClick} title={label}
      style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color, transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '12'; e.currentTarget.style.borderColor = color + '40'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = C.border; }}>
      <Icon size={14} />
    </button>
  );
}
