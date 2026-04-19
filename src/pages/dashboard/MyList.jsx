import { useState, useRef } from 'react';
import {
  CheckSquare, Square, Plus, Phone, FileText,
  ExternalLink, Info, GripVertical, ChevronDown, ChevronRight,
  RotateCcw, CloudOff, RefreshCw, Trash2, Upload, LogOut,
  HardDrive, FileUp, AlertCircle,
} from 'lucide-react';
import { C, serif } from '../../theme';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';

// ─── Trust & Will ───────────────────────────────────────────────────────────────
const TW_URLS = {
  'Will (ensure it\'s notarized)':   'https://trustandwill.com/learn/online-will?utm_source=aiden&utm_medium=app',
  'Advanced Directive / Living Will':'https://trustandwill.com/learn/advance-directive?utm_source=aiden&utm_medium=app',
  'Durable Power of Attorney':       'https://trustandwill.com/learn/durable-power-of-attorney?utm_source=aiden&utm_medium=app',
  'Healthcare Proxy Designation':    'https://trustandwill.com/learn/healthcare-proxy?utm_source=aiden&utm_medium=app',
};
function twUrl(title) {
  return TW_URLS[title] ?? `https://trustandwill.com?utm_source=aiden&utm_medium=app`;
}

// ─── Google Drive helpers ───────────────────────────────────────────────────────
const MIME_META = {
  'application/pdf':                                    { label: 'PDF',   color: '#e05050' },
  'application/vnd.google-apps.document':               { label: 'Doc',   color: C.primary },
  'application/vnd.google-apps.spreadsheet':            { label: 'Sheet', color: C.sage },
  'application/vnd.google-apps.presentation':           { label: 'Slide', color: C.peach },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':   { label: 'Word',  color: C.primary },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':         { label: 'Excel', color: C.sage },
  'image/png':   { label: 'Image', color: C.lavender },
  'image/jpeg':  { label: 'Image', color: C.lavender },
};
function mimeMeta(mimeType) { return MIME_META[mimeType] ?? { label: 'File', color: C.mutedLight }; }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtSize(bytes) {
  if (!bytes) return '';
  const b = parseInt(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const COLORS = [C.rose, C.primary, C.sage, C.lavender, C.peach];
function rColor(recipientId) { return COLORS[(recipientId - 1) % COLORS.length] ?? C.primary; }

export default function MyList({ logistics, setLogistics, doctors }) {
  const [sub, setSub]         = useState('logistics');
  const [adding, setAdding]   = useState(false);
  const [newItem, setNewItem] = useState('');
  const [doneOpen, setDoneOpen]   = useState(false);
  const [restoreId, setRestoreId] = useState(null);

  // ── Drag state ────────────────────────────────────────────────────────────────
  const dragId              = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  // ── Google Drive ──────────────────────────────────────────────────────────────
  const drive      = useGoogleDrive();
  const fileInput  = useRef(null);
  const [deleting, setDeleting] = useState(null); // fileId pending delete confirm

  const incomplete = logistics.filter(l => !l.completed);
  const complete   = logistics.filter(l => l.completed);
  const done       = complete.length;
  const total      = logistics.length;
  const pct        = total === 0 ? 0 : Math.round((done / total) * 100);

  // ── Checklist handlers ────────────────────────────────────────────────────────
  function handleToggle(item) {
    if (!item.completed) {
      setLogistics(p => p.map(l => l.id === item.id ? { ...l, completed: true } : l));
    } else {
      setRestoreId(item.id);
    }
  }
  function confirmRestore(id) {
    setLogistics(p => p.map(l => l.id === id ? { ...l, completed: false } : l));
    setRestoreId(null);
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  function onDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.closest('[data-drag-item]')?.setAttribute('data-dragging', 'true'), 0);
  }
  function onDragOver(e, id) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragId.current) setDragOverId(id);
  }
  function onDrop(e, targetId) {
    e.preventDefault();
    if (!dragId.current || dragId.current === targetId) { setDragOverId(null); return; }
    setLogistics(prev => {
      const inc = prev.filter(l => !l.completed);
      const comp = prev.filter(l => l.completed);
      const from = inc.findIndex(l => l.id === dragId.current);
      const to   = inc.findIndex(l => l.id === targetId);
      if (from === -1 || to === -1) return prev;
      const reordered = [...inc];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return [...reordered, ...comp];
    });
    setDragOverId(null);
    dragId.current = null;
  }
  function onDragEnd(e) {
    e.target.closest('[data-drag-item]')?.removeAttribute('data-dragging');
    setDragOverId(null);
    dragId.current = null;
  }

  // ── Drive upload ──────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) { drive.upload(file); e.target.value = ''; }
  }

  return (
    <div style={{ padding: 32, maxWidth: 820 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Organisation</p>
        <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5 }}>My List</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.bgWarm, borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content', border: `1px solid ${C.border}` }}>
        {[['logistics','Checklist'],['doctors','Doctors'],['documents','Documents']].map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: sub === id ? 700 : 500, color: sub === id ? '#fff' : C.muted, background: sub === id ? C.roseDark : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Checklist ─────────────────────────────────────────────────────────── */}
      {sub === 'logistics' && (
        <>
          {/* Progress */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>{done} of {total} completed</p>
              <div style={{ width: 240, height: 8, background: C.bgWarm, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose, borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose }}>{pct}%</span>
          </div>

          {/* Incomplete / draggable */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {incomplete.length === 0 && (
              <p style={{ fontSize: 14, color: C.mutedLight, textAlign: 'center', padding: '20px 0' }}>Everything is done 🎉</p>
            )}
            {incomplete.map(item => (
              <div key={item.id} data-drag-item draggable
                onDragStart={e => onDragStart(e, item.id)} onDragOver={e => onDragOver(e, item.id)}
                onDrop={e => onDrop(e, item.id)} onDragEnd={onDragEnd}
                style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, borderTop: dragOverId === item.id ? `2px solid ${C.roseDark}` : `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'default', transition: 'border-color 0.12s' }}>
                <div style={{ flexShrink: 0, marginTop: 2, cursor: 'grab', color: C.border, display: 'flex', padding: '0 2px' }} title="Drag to reorder">
                  <GripVertical size={16} />
                </div>
                <button onClick={() => handleToggle(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                  <Square size={20} color={C.border} />
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.title}</p>
                  {item.note && <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{item.note}</p>}
                  {item.partnerLink === 'trust-will' && (
                    <a href={twUrl(item.title)} target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0f4ee', border: '1px solid #b8d0a8', borderRadius: 8, padding: '5px 12px', color: '#3d6b30', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e3edde'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f0f4ee'}>
                      <ExternalLink size={11} />
                      Complete via Trust &amp; Will
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* Add item */}
            {adding ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `2px solid ${C.roseDark}` }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New checklist item…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { setLogistics(p => [...p.filter(x => !x.completed), { id: Date.now(), title: newItem.trim(), completed: false, note: '', partnerLink: null }, ...p.filter(x => x.completed)]); setNewItem(''); setAdding(false); } if (e.key === 'Escape') { setAdding(false); setNewItem(''); } }}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C.text, background: 'none' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => { if (newItem.trim()) { setLogistics(p => [...p.filter(x => !x.completed), { id: Date.now(), title: newItem.trim(), completed: false, note: '', partnerLink: null }, ...p.filter(x => x.completed)]); setNewItem(''); setAdding(false); } }} style={{ flex: 1, background: C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Add</button>
                  <button onClick={() => { setAdding(false); setNewItem(''); }} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 14, padding: 14, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={15} /> Add item to checklist
              </button>
            )}
          </div>

          {/* Done section */}
          {complete.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setDoneOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', width: '100%', textAlign: 'left' }}>
                {doneOpen ? <ChevronDown size={16} color={C.muted} /> : <ChevronRight size={16} color={C.muted} />}
                <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Done</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: C.sage, borderRadius: 20, padding: '1px 8px', marginLeft: 2 }}>{complete.length}</span>
              </button>
              {doneOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {complete.map(item => {
                    const isRestoring = restoreId === item.id;
                    return (
                      <div key={item.id} style={{ background: isRestoring ? '#f9f6f3' : '#fafafa', borderRadius: 14, padding: '12px 18px', border: `1px solid ${C.border}`, opacity: 0.85 }}>
                        {isRestoring ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <RotateCcw size={16} color={C.roseDark} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>Restore <strong>{item.title}</strong> to your checklist?</span>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => confirmRestore(item.id)} style={{ background: C.roseDark, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Restore</button>
                              <button onClick={() => setRestoreId(null)} style={{ background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Keep done</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <button onClick={() => handleToggle(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                              <CheckSquare size={20} color={C.sage} />
                            </button>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: 500, color: C.mutedLight, textDecoration: 'line-through' }}>{item.title}</p>
                              {item.note && <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 2 }}>{item.note}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Doctors ───────────────────────────────────────────────────────────── */}
      {sub === 'doctors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {doctors.map(d => {
            const col = rColor(d.recipientId);
            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: `1px solid ${C.border}`, borderLeft: `4px solid ${col}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{d.name}</p>
                  <p style={{ fontSize: 13, color: col, fontWeight: 700, marginTop: 2 }}>{d.specialty}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{d.phone}</p>
                  <p style={{ fontSize: 12, color: C.mutedLight }}>{d.address}</p>
                  {d.notes && <p style={{ fontSize: 12, color: C.muted, marginTop: 4, fontStyle: 'italic' }}>{d.notes}</p>}
                </div>
                <a href={`tel:${d.phone}`} style={{ width: 42, height: 42, background: col + '18', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>
                  <Phone size={16} color={col} />
                </a>
              </div>
            );
          })}
          <button style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 16, padding: 16, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Plus size={15} /> Add a doctor
          </button>
        </div>
      )}

      {/* ── Documents ─────────────────────────────────────────────────────────── */}
      {sub === 'documents' && (
        <>
          {/* Hidden file input */}
          <input ref={fileInput} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* ── Not configured ── */}
          {!drive.isConfigured && (
            <div style={{ background: '#fffbf0', border: `1px solid #e8d080`, borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12 }}>
              <AlertCircle size={18} color="#b08020" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#7a5a10', marginBottom: 4 }}>Google Drive setup required</p>
                <p style={{ fontSize: 13, color: '#9a7a20', lineHeight: 1.6, marginBottom: 8 }}>
                  Add <code style={{ background: '#f5e8a0', padding: '1px 5px', borderRadius: 4 }}>VITE_GOOGLE_CLIENT_ID</code> to your <code style={{ background: '#f5e8a0', padding: '1px 5px', borderRadius: 4 }}>.env</code> file to enable Google Drive.
                </p>
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#b08020', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  <ExternalLink size={12} /> Open Google Cloud Console
                </a>
              </div>
            </div>
          )}

          {/* ── Not connected ── */}
          {drive.isConfigured && !drive.connected && (
            <div style={{ background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, background: C.primary + '20', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HardDrive size={20} color={C.primaryDark} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: C.primaryDark, marginBottom: 4 }}>Connect Google Drive</p>
                  <p style={{ fontSize: 13, color: C.primary, lineHeight: 1.65, marginBottom: 16 }}>
                    Securely store and access insurance cards, medical records, advance directives, and legal documents — all in one place. Aiden only accesses files you upload through this app.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={drive.connect}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.primaryDark, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Error banner ── */}
          {drive.error && (
            <div style={{ background: '#fdf5f5', border: `1px solid ${C.coral}30`, borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color={C.coral} style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: C.coral, flex: 1 }}>{drive.error}</p>
              <button onClick={() => drive.refresh()} style={{ background: 'none', border: 'none', color: C.coral, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* ── Connected: toolbar ── */}
          {drive.connected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.sage }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Google Drive connected</span>
                <span style={{ fontSize: 12, color: C.muted }}>{drive.files.length} file{drive.files.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={drive.refresh} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Refresh
                </button>
                <button onClick={() => fileInput.current?.click()} disabled={drive.uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.roseDark, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: drive.uploading ? 'default' : 'pointer', opacity: drive.uploading ? 0.7 : 1 }}>
                  <FileUp size={13} /> {drive.uploading ? 'Uploading…' : 'Upload file'}
                </button>
                <button onClick={drive.disconnect} title="Disconnect Google Drive"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
                  <LogOut size={13} /> Disconnect
                </button>
              </div>
            </div>
          )}

          {/* ── Loading spinner ── */}
          {drive.loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.roseDark, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Connected: file list ── */}
          {drive.connected && !drive.loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drive.files.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: C.mutedLight }}>
                  <Upload size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>No documents yet</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Upload your first file using the button above.</p>
                </div>
              ) : (
                drive.files.map(file => {
                  const meta = mimeMeta(file.mimeType);
                  const isDeletingThis = deleting === file.id;
                  return (
                    <div key={file.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}` }}>
                      {isDeletingThis ? (
                        /* Delete confirmation */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <Trash2 size={15} color={C.coral} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>
                            Remove <strong>{file.name}</strong> from Drive?
                          </span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { drive.deleteFile(file.id); setDeleting(null); }}
                              style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                            <button onClick={() => setDeleting(null)}
                              style={{ background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 42, height: 42, background: meta.color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={18} color={meta.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                            <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 2 }}>
                              {meta.label}{file.size ? ` · ${fmtSize(file.size)}` : ''} · Modified {fmtDate(file.modifiedTime)}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {file.webViewLink && (
                              <a href={file.webViewLink} target="_blank" rel="noopener noreferrer"
                                style={{ width: 34, height: 34, background: C.primary + '18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                                title="Open in Google Drive">
                                <ExternalLink size={14} color={C.primaryDark} />
                              </a>
                            )}
                            <button onClick={() => setDeleting(file.id)}
                              style={{ width: 34, height: 34, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fdf0f0'; e.currentTarget.style.color = C.coral; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; }}
                              title="Remove from Drive">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Upload drop zone (always visible when connected) */}
              <button onClick={() => fileInput.current?.click()} disabled={drive.uploading}
                style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 14, padding: 16, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={15} /> Upload document
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        [data-drag-item] { user-select: none; }
        [data-drag-item][data-dragging='true'] { opacity: 0.4; }
      `}</style>
    </div>
  );
}
