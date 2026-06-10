import { useState, useRef, useEffect } from 'react';
import {
  CheckSquare, Square, Plus, FileText, Image,
  GripVertical, ChevronDown, ChevronRight,
  RotateCcw, Trash2, Download, Upload, AlertCircle, Pencil, X,
} from 'lucide-react';
import {
  ref as storageRef, listAll, getMetadata,
  getDownloadURL, uploadBytes, deleteObject,
} from 'firebase/storage';
import { storage } from '../../firebase';
import { useAuth } from '../../App';
import { C, serif, shadowSm, shadowXs, radius } from '../../theme';

// ─── Helpers ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [C.rose, C.primary, C.sage, C.lavender, C.peach];
function rColor(id) { return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length] ?? C.primary; }

function RecipAvatar({ r, size = 24 }) {
  const col = rColor(r.id);
  const initials = r.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <div title={r.nickname || r.name} style={{
      width: size, height: size, borderRadius: '50%',
      background: col + '22', border: `1.5px solid ${col}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 700, color: col, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function FilterBar({ recipients, filterId, setFilterId }) {
  if (!recipients?.length) return null;
  const options = [{ id: null, label: 'All', r: null }, ...recipients.map(r => ({ id: r.id, label: r.nickname || r.name.split(' ')[0], r }))];
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = filterId === opt.id;
        const col = opt.r ? rColor(opt.r.id) : C.roseDark;
        return (
          <button key={String(opt.id)} onClick={() => setFilterId(opt.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 20, border: `1.5px solid ${active ? col : C.border}`,
            background: active ? col + '15' : 'transparent',
            color: active ? col : C.muted, fontSize: 12, fontWeight: active ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {opt.r && <RecipAvatar r={opt.r} size={16} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RecipSelect({ recipients, value, onChange, label = 'For (optional)' }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: value ? C.text : C.muted, background: '#fff', cursor: 'pointer', outline: 'none' }}>
      <option value="">{label}</option>
      {recipients.map(r => <option key={r.id} value={r.id}>{r.nickname || r.name.split(' ')[0]}</option>)}
    </select>
  );
}

function fileTypeMeta(name = '', contentType = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf' || contentType === 'application/pdf')
    return { label: 'PDF', color: '#e05050', icon: 'file' };
  if (['jpg', 'jpeg'].includes(ext) || contentType.startsWith('image/jpeg'))
    return { label: 'JPG', color: C.primary, icon: 'image' };
  if (ext === 'png' || contentType === 'image/png')
    return { label: 'PNG', color: C.lavender, icon: 'image' };
  return { label: 'File', color: C.mutedLight, icon: 'file' };
}

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

// ─── Component ──────────────────────────────────────────────────────────────────
export default function MyList({ logistics, setLogistics, onUpdateLogistic, onAddLogistic, doctors, onAddDoctor, onUpdateDoctor, onDeleteDoctor, recipients = [] }) {
  const { user } = useAuth();
  const [sub, setSub]         = useState('logistics');
  const [adding, setAdding]   = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newItemRecipId, setNewItemRecipId] = useState(null);
  const [doneOpen, setDoneOpen]   = useState(false);
  const [restoreId, setRestoreId] = useState(null);

  // ── Recipient filter ──────────────────────────────────────────────────────────
  const [filterRecipId, setFilterRecipId] = useState(null);

  // ── Drag state ────────────────────────────────────────────────────────────────
  const dragId              = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  // ── Doctor modal state ────────────────────────────────────────────────────────
  const BLANK_DOC = { name: '', specialty: '', phone: '', address: '', notes: '', recipientId: '' };
  const [doctorModal, setDoctorModal] = useState(null); // null | 'add' | doctor-object (edit)
  const [doctorBuf, setDoctorBuf]     = useState(BLANK_DOC);
  const [deletingDoctor, setDeletingDoctor] = useState(null); // id being confirmed

  function openAddDoctor()    { setDoctorBuf(BLANK_DOC); setDoctorModal('add'); }
  function openEditDoctor(d)  { setDoctorBuf({ name: d.name||'', specialty: d.specialty||'', phone: d.phone||'', address: d.address||'', notes: d.notes||'', recipientId: d.recipientId||'' }); setDoctorModal(d); }
  function closeDoctorModal() { setDoctorModal(null); }

  function saveDoctorModal() {
    if (!doctorBuf.name.trim()) return;
    if (doctorModal === 'add') {
      onAddDoctor?.({ ...doctorBuf, name: doctorBuf.name.trim() });
    } else {
      onUpdateDoctor?.(doctorModal.id, { ...doctorBuf, name: doctorBuf.name.trim() });
    }
    closeDoctorModal();
  }

  // ── Documents state ───────────────────────────────────────────────────────────
  const [docs, setDocs]                 = useState([]);
  const [docsLoading, setDocsLoading]   = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [deletingDoc, setDeletingDoc]   = useState(null);
  const [docError, setDocError]         = useState('');
  const [uploadRecipId, setUploadRecipId] = useState(null);
  const fileInput = useRef(null);

  // Filtered data
  const filteredLogistics = filterRecipId
    ? logistics.filter(l => l.recipientId === filterRecipId)
    : logistics;
  const filteredDoctors = filterRecipId
    ? doctors.filter(d => d.recipientId === filterRecipId)
    : doctors;
  const filteredDocs = filterRecipId
    ? docs.filter(d => d.recipientId === filterRecipId)
    : docs;

  const incomplete = filteredLogistics.filter(l => !l.completed);
  const complete   = filteredLogistics.filter(l => l.completed);
  const allComplete = logistics.filter(l => l.completed);
  const pct = logistics.length === 0 ? 0 : Math.round((allComplete.length / logistics.length) * 100);

  // ── Load documents when tab is opened ────────────────────────────────────────
  useEffect(() => {
    if (sub === 'documents' && user) loadDocs();
  }, [sub, user]);

  async function loadDocs() {
    setDocsLoading(true);
    setDocError('');
    try {
      const folder = storageRef(storage, `documents/${user.uid}`);
      const result = await listAll(folder);
      const items  = await Promise.all(
        result.items.map(async itemRef => {
          const [meta, url] = await Promise.all([getMetadata(itemRef), getDownloadURL(itemRef)]);
          const recipId = meta.customMetadata?.recipientId ? Number(meta.customMetadata.recipientId) : null;
          return {
            fullPath:    itemRef.fullPath,
            ref:         itemRef,
            name:        meta.customMetadata?.originalName ?? itemRef.name,
            size:        meta.size,
            uploadedAt:  meta.timeCreated,
            contentType: meta.contentType,
            recipientId: recipId,
            url,
          };
        })
      );
      items.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      setDocs(items);
    } catch {
      setDocError('Could not load documents. Check your Firebase Storage rules.');
    }
    setDocsLoading(false);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setUploading(true);
    setDocError('');
    try {
      const path = `documents/${user.uid}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, path);
      const customMeta = { originalName: file.name };
      if (uploadRecipId) customMeta.recipientId = String(uploadRecipId);
      await uploadBytes(fileRef, file, { customMetadata: customMeta });
      await loadDocs();
    } catch {
      setDocError('Upload failed — please try again.');
    }
    setUploading(false);
  }

  async function handleDelete(doc) {
    setDocError('');
    try {
      await deleteObject(doc.ref);
      setDocs(prev => prev.filter(d => d.fullPath !== doc.fullPath));
      setDeletingDoc(null);
    } catch {
      setDocError('Could not delete document.');
    }
  }

  function handleDownload(doc) {
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Checklist helpers ─────────────────────────────────────────────────────────
  function handleToggle(item) {
    if (!item.completed) {
      onUpdateLogistic(item.id, { completed: true });
    } else {
      setRestoreId(item.id);
    }
  }
  function confirmRestore(id) {
    onUpdateLogistic(id, { completed: false });
    setRestoreId(null);
  }
  function addItem() {
    if (!newItem.trim()) return;
    onAddLogistic({ title: newItem.trim(), completed: false, note: '', partnerLink: null, recipientId: newItemRecipId ?? null });
    setNewItem('');
    setNewItemRecipId(null);
    setAdding(false);
  }

  // ── Drag helpers ──────────────────────────────────────────────────────────────
  function onDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.closest('[data-drag-item]')?.setAttribute('data-dragging', 'true'), 0);
  }
  function onDragOver(e, id) {
    e.preventDefault();
    if (id !== dragId.current) setDragOverId(id);
  }
  function onDrop(e, targetId) {
    e.preventDefault();
    if (!dragId.current || dragId.current === targetId) { setDragOverId(null); return; }
    setLogistics(prev => {
      const inc  = prev.filter(l => !l.completed);
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 32, maxWidth: 820 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Organisation</p>
        <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5 }}>To Dos</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.bgWarm, borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content', border: `1px solid ${C.border}` }}>
        {[['logistics', 'Checklist'], ['doctors', 'Doctors'], ['documents', 'Documents']].map(([id, label]) => (
          <button key={id} onClick={() => { setSub(id); setFilterRecipId(null); }}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: sub === id ? 700 : 500, color: sub === id ? '#fff' : C.muted, background: sub === id ? C.roseDark : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Checklist ─────────────────────────────────────────────────────────── */}
      {sub === 'logistics' && (
        <>
          {/* Progress */}
          <div style={{ background: '#fff', borderRadius: radius.md, padding: '16px 20px', marginBottom: 20, boxShadow: shadowXs, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>{allComplete.length} of {logistics.length} completed</p>
              <div style={{ width: 240, height: 8, background: C.bgWarm, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose, borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose }}>{pct}%</span>
          </div>

          {/* Filter bar */}
          <FilterBar recipients={recipients} filterId={filterRecipId} setFilterId={setFilterRecipId} />

          {/* Incomplete / draggable items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {incomplete.length === 0 && (
              <p style={{ fontSize: 14, color: C.mutedLight, textAlign: 'center', padding: '20px 0' }}>
                {filterRecipId ? 'No items for this person.' : 'Everything is done 🎉'}
              </p>
            )}
            {incomplete.map(item => {
              const recip = item.recipientId ? recipients.find(r => r.id === item.recipientId) : null;
              return (
                <div key={item.id} data-drag-item draggable
                  onDragStart={e => onDragStart(e, item.id)} onDragOver={e => onDragOver(e, item.id)}
                  onDrop={e => onDrop(e, item.id)} onDragEnd={onDragEnd}
                  style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, borderTop: dragOverId === item.id ? `2px solid ${C.roseDark}` : `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'default', transition: 'border-color 0.12s' }}>
                  <div style={{ flexShrink: 0, marginTop: 2, cursor: 'grab', color: C.border, padding: '0 2px' }}>
                    <GripVertical size={16} />
                  </div>
                  <button onClick={() => handleToggle(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                    <Square size={20} color={C.border} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.title}</p>
                    {item.note && <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{item.note}</p>}
                  </div>
                  {recip && <RecipAvatar r={recip} size={26} />}
                </div>
              );
            })}

            {/* Add item */}
            {adding ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `2px solid ${C.roseDark}` }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New checklist item…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') { setAdding(false); setNewItem(''); setNewItemRecipId(null); } }}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C.text, background: 'none', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {recipients.length > 0 && (
                    <RecipSelect recipients={recipients} value={newItemRecipId} onChange={setNewItemRecipId} />
                  )}
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    <button onClick={addItem} style={{ background: C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Add</button>
                    <button onClick={() => { setAdding(false); setNewItem(''); setNewItemRecipId(null); }} style={{ background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ width: '100%', border: `1px solid ${C.rose}30`, borderRadius: 12, padding: '10px 18px', background: C.roseLight, color: C.roseDark, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={14} /> Add item to checklist
              </button>
            )}
          </div>

          {/* Done section */}
          {complete.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setDoneOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', width: '100%', textAlign: 'left' }}>
                {doneOpen ? <ChevronDown size={16} color={C.muted} /> : <ChevronRight size={16} color={C.muted} />}
                <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Done</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: C.sage, borderRadius: 20, padding: '1px 8px' }}>{complete.length}</span>
              </button>
              {doneOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {complete.map(item => {
                    const isRestoring = restoreId === item.id;
                    const recip = item.recipientId ? recipients.find(r => r.id === item.recipientId) : null;
                    return (
                      <div key={item.id} style={{ background: isRestoring ? '#f9f6f3' : '#fafafa', borderRadius: 14, padding: '12px 18px', border: `1px solid ${C.border}`, opacity: 0.85 }}>
                        {isRestoring ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <RotateCcw size={16} color={C.roseDark} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>Restore <strong>{item.title}</strong> to your checklist?</span>
                            <div style={{ display: 'flex', gap: 8 }}>
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
                            {recip && <RecipAvatar r={recip} size={22} />}
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
        <>
          <FilterBar recipients={recipients} filterId={filterRecipId} setFilterId={setFilterRecipId} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Empty state */}
            {filteredDoctors.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0 20px' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🩺</p>
                <p style={{ fontSize: 14, color: C.mutedLight, marginBottom: 4 }}>
                  {filterRecipId ? 'No doctors for this person.' : 'No doctors added yet.'}
                </p>
                <p style={{ fontSize: 12, color: C.mutedLight }}>Add a doctor to keep their info handy.</p>
              </div>
            )}

            {/* Doctor cards */}
            {filteredDoctors.map(d => {
              const col = rColor(d.recipientId);
              const recip = d.recipientId ? recipients.find(r => r.id === d.recipientId) : null;
              return (
                <div key={d.id} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: `1px solid ${C.border}`, borderLeft: `4px solid ${col}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{d.name}</p>
                        {recip && <RecipAvatar r={recip} size={22} />}
                      </div>
                      {d.specialty && <p style={{ fontSize: 13, color: col, fontWeight: 700, marginTop: 2 }}>{d.specialty}</p>}
                      {d.phone && <a href={`tel:${d.phone}`} style={{ fontSize: 12, color: C.primary, marginTop: 3, display: 'block', textDecoration: 'none', fontWeight: 500 }}>{d.phone}</a>}
                      {d.address && <p style={{ fontSize: 12, color: C.mutedLight }}>{d.address}</p>}
                      {d.notes && <p style={{ fontSize: 12, color: C.muted, marginTop: 4, fontStyle: 'italic' }}>{d.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEditDoctor(d)} style={{ width: 34, height: 34, background: C.bgWarm, border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Pencil size={14} color={C.muted} />
                      </button>
                      {deletingDoctor === d.id ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button onClick={() => { onDeleteDoctor?.(d.id); setDeletingDoctor(null); }} style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                          <button onClick={() => setDeletingDoctor(null)} style={{ background: 'none', border: 'none', fontSize: 12, color: C.muted, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingDoctor(d.id)} style={{ width: 34, height: 34, background: C.bgWarm, border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={14} color={C.muted} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <button onClick={openAddDoctor} style={{ width: '100%', border: `1px solid ${C.rose}30`, borderRadius: 12, padding: '10px 18px', background: C.roseLight, color: C.roseDark, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={14} /> Add a doctor
            </button>
          </div>

          {/* Doctor add/edit modal */}
          {doctorModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={closeDoctorModal}>
              <div style={{ background: 'rgba(38,32,26,0.4)', position: 'absolute', inset: 0 }} />
              <div style={{ background: '#fff', borderRadius: 22, padding: '28px 28px 24px', width: '100%', maxWidth: 480, position: 'relative', zIndex: 1, boxShadow: '0 8px 40px rgba(140,60,40,0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                  <h2 style={{ fontFamily: serif, fontSize: 20, color: C.text, margin: 0 }}>{doctorModal === 'add' ? 'Add a doctor' : 'Edit doctor'}</h2>
                  <button onClick={closeDoctorModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color={C.muted} /></button>
                </div>

                {/* Form fields */}
                {[
                  { key: 'name',      label: 'Name *',       placeholder: 'Dr. Sarah Chen' },
                  { key: 'specialty', label: 'Specialty',    placeholder: 'Cardiologist' },
                  { key: 'phone',     label: 'Phone',        placeholder: '(555) 000-0000' },
                  { key: 'address',   label: 'Address',      placeholder: '123 Main St, Atlanta, GA' },
                  { key: 'notes',     label: 'Notes',        placeholder: 'Any additional info…' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
                    <input
                      value={doctorBuf[key]}
                      onChange={e => setDoctorBuf(b => ({ ...b, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box', background: '#faf9f7' }}
                    />
                  </div>
                ))}

                {/* Recipient */}
                {recipients.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>For</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setDoctorBuf(b => ({ ...b, recipientId: '' }))} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${!doctorBuf.recipientId ? C.rose : C.border}`, background: !doctorBuf.recipientId ? C.roseLight : '#fff', color: !doctorBuf.recipientId ? C.roseDark : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Anyone</button>
                      {recipients.map(r => {
                        const active = doctorBuf.recipientId === r.id;
                        const col = rColor(r.id);
                        return (
                          <button key={r.id} onClick={() => setDoctorBuf(b => ({ ...b, recipientId: r.id }))} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? col : C.border}`, background: active ? col + '18' : '#fff', color: active ? col : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {r.nickname || r.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={closeDoctorModal} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveDoctorModal} disabled={!doctorBuf.name.trim()} style={{ flex: 2, background: doctorBuf.name.trim() ? C.roseDark : C.border, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: doctorBuf.name.trim() ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                    {doctorModal === 'add' ? 'Add doctor' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Documents ─────────────────────────────────────────────────────────── */}
      {sub === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0 32px', gap: 12 }}>
          <p style={{ fontSize: 40 }}>📂</p>
          <p style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: C.text }}>Coming soon!</p>
          <p style={{ fontSize: 14, color: C.mutedLight, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>Document storage is on its way. You'll be able to upload and organize records, insurance cards, and legal docs here.</p>
        </div>
      )}
      {false && (
        <>
          {/* Hidden file input */}
          <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,.pdf" style={{ display: 'none' }} onChange={handleUpload} />

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, color: C.muted }}>Store insurance cards, medical records, and legal documents.</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {recipients.length > 0 && (
                <RecipSelect recipients={recipients} value={uploadRecipId} onChange={setUploadRecipId} label="Tag recipient" />
              )}
              <button onClick={() => fileInput.current?.click()} disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: uploading ? C.border : C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', transition: 'background 0.2s' }}>
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <FilterBar recipients={recipients} filterId={filterRecipId} setFilterId={setFilterRecipId} />

          {/* Error */}
          {docError && (
            <div style={{ background: '#fdf5f5', border: `1px solid ${C.coral}30`, borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color={C.coral} style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: C.coral }}>{docError}</p>
            </div>
          )}

          {/* Loading */}
          {docsLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.roseDark, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* File list */}
          {!docsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredDocs.length === 0 && !docError && (
                <div style={{ textAlign: 'center', padding: '56px 0', color: C.mutedLight }}>
                  <FileText size={36} style={{ marginBottom: 14, opacity: 0.3 }} />
                  <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    {filterRecipId ? 'No documents for this person' : 'No documents yet'}
                  </p>
                  <p style={{ fontSize: 13 }}>
                    {filterRecipId ? 'Upload a document and tag it to this recipient.' : 'Upload a PDF, PNG, or JPG using the button above.'}
                  </p>
                </div>
              )}

              {filteredDocs.map(doc => {
                const meta  = fileTypeMeta(doc.name, doc.contentType);
                const isDel = deletingDoc === doc.fullPath;
                const recip = doc.recipientId ? recipients.find(r => r.id === doc.recipientId) : null;
                return (
                  <div key={doc.fullPath} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}` }}>
                    {isDel ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Trash2 size={15} color={C.coral} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>
                          Delete <strong>{doc.name}</strong>? This cannot be undone.
                        </span>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => handleDelete(doc)}
                            style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                          <button onClick={() => setDeletingDoc(null)}
                            style={{ background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Type icon */}
                        <div style={{ width: 44, height: 44, background: meta.color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {meta.icon === 'image'
                            ? <Image size={20} color={meta.color} />
                            : <FileText size={20} color={meta.color} />}
                        </div>
                        {/* File info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                          <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 2 }}>
                            {meta.label}{doc.size ? ` · ${fmtSize(doc.size)}` : ''} · Uploaded {fmtDate(doc.uploadedAt)}
                          </p>
                        </div>
                        {/* Recipient avatar */}
                        {recip && <RecipAvatar r={recip} size={28} />}
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => handleDownload(doc)} title="Download"
                            style={{ width: 36, height: 36, background: C.primary + '18', border: 'none', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Download size={15} color={C.primaryDark} />
                          </button>
                          <button onClick={() => setDeletingDoc(doc.fullPath)} title="Delete"
                            style={{ width: 36, height: 36, background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fdf0f0'; e.currentTarget.style.color = C.coral; e.currentTarget.style.borderColor = C.coral + '60'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Upload drop zone */}
              {filteredDocs.length > 0 && (
                <button onClick={() => fileInput.current?.click()} disabled={uploading}
                  style={{ width: '100%', border: `1px solid ${C.rose}30`, borderRadius: 12, padding: '10px 18px', background: C.roseLight, color: C.roseDark, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus size={14} /> Upload another document
                </button>
              )}
            </div>
          )}
        </>
      )}{/* end hidden documents block */}

      <style>{`
        [data-drag-item] { user-select: none; }
        [data-drag-item][data-dragging='true'] { opacity: 0.4; }
      `}</style>
    </div>
  );
}
