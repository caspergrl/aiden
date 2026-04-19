import { useState, useRef } from 'react';
import {
  CheckSquare, Square, Plus, Phone, FileText,
  ExternalLink, Info, GripVertical, ChevronDown, ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { C, serif } from '../../theme';

const COLORS = [C.rose, C.primary, C.sage, C.lavender, C.peach];
function rColor(recipientId) {
  return COLORS[(recipientId - 1) % COLORS.length] ?? C.primary;
}

const DOCS = [
  { name: 'Medicare Card – Margaret.pdf',       date: 'Mar 10, 2026', color: C.primary },
  { name: 'Advanced Directive – Margaret.pdf',  date: 'Jan 5, 2025',  color: C.sage },
  { name: 'Will – Notarized 2025.pdf',          date: 'Mar 15, 2025', color: C.peach },
  { name: 'Medicaid Approval – Thomas.pdf',     date: 'Nov 20, 2025', color: C.lavender },
  { name: 'HIPAA Authorization Form.pdf',       date: '—',            color: C.mutedLight },
];

export default function MyList({ logistics, setLogistics, doctors }) {
  const [sub, setSub]         = useState('logistics');
  const [adding, setAdding]   = useState(false);
  const [newItem, setNewItem] = useState('');
  const [doneOpen, setDoneOpen]   = useState(false);
  const [restoreId, setRestoreId] = useState(null); // id of done item pending restore confirm

  // ── Drag state ────────────────────────────────────────────────────────────────
  const dragId   = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const incomplete = logistics.filter(l => !l.completed);
  const complete   = logistics.filter(l => l.completed);
  const done       = complete.length;
  const total      = logistics.length;
  const pct        = total === 0 ? 0 : Math.round((done / total) * 100);

  // ── Toggle complete (incomplete → done immediately; done → restore prompt) ───
  function handleToggle(item) {
    if (!item.completed) {
      // Mark as done — move straight to done section
      setLogistics(p => p.map(l => l.id === item.id ? { ...l, completed: true } : l));
    } else {
      // Prompt restore
      setRestoreId(item.id);
    }
  }

  function confirmRestore(id) {
    setLogistics(p => p.map(l => l.id === id ? { ...l, completed: false } : l));
    setRestoreId(null);
  }

  // ── Drag handlers (incomplete items only) ────────────────────────────────────
  function onDragStart(e, id) {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    // Slight delay so the ghost image is rendered before we dim the source
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
          {/* Progress bar */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>{done} of {total} completed</p>
              <div style={{ width: 240, height: 8, background: C.bgWarm, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose, borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: pct >= 75 ? C.sage : pct >= 40 ? C.peach : C.rose }}>{pct}%</span>
          </div>

          {/* ── Incomplete / draggable items ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {incomplete.length === 0 && (
              <p style={{ fontSize: 14, color: C.mutedLight, textAlign: 'center', padding: '20px 0' }}>
                Everything is done 🎉
              </p>
            )}

            {incomplete.map(item => {
              const isOver    = dragOverId === item.id;
              return (
                <div
                  key={item.id}
                  data-drag-item
                  draggable
                  onDragStart={e => onDragStart(e, item.id)}
                  onDragOver={e => onDragOver(e, item.id)}
                  onDrop={e => onDrop(e, item.id)}
                  onDragEnd={onDragEnd}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: '14px 18px',
                    border: `1px solid ${C.border}`,
                    borderTop: isOver ? `2px solid ${C.roseDark}` : `1px solid ${C.border}`,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    cursor: 'default',
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                    boxShadow: isOver ? `0 -2px 0 ${C.roseDark}` : 'none',
                  }}>
                  {/* Drag handle */}
                  <div
                    style={{ flexShrink: 0, marginTop: 2, cursor: 'grab', color: C.border, display: 'flex', alignItems: 'center', padding: '0 2px' }}
                    title="Drag to reorder">
                    <GripVertical size={16} />
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                    <Square size={20} color={C.border} />
                  </button>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.title}</p>
                    {item.note && <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{item.note}</p>}
                    {item.partnerLink === 'trust-will' && (
                      <button style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 8, padding: '5px 12px', color: C.primaryDark, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        <ExternalLink size={11} /> Complete via Trust & Will
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add item */}
            {adding ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `2px solid ${C.roseDark}` }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="New checklist item…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { setLogistics(p => [...p.filter(x => !x.completed), { id: Date.now(), title: newItem.trim(), completed: false, note: '', partnerLink: null }, ...p.filter(x => x.completed)]); setNewItem(''); setAdding(false); } if (e.key === 'Escape') { setAdding(false); setNewItem(''); } }}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C.text, background: 'none' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => { if (newItem.trim()) { setLogistics(p => [...p.filter(x => !x.completed), { id: Date.now(), title: newItem.trim(), completed: false, note: '', partnerLink: null }, ...p.filter(x => x.completed)]); setNewItem(''); setAdding(false); } }}
                    style={{ flex: 1, background: C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Add</button>
                  <button onClick={() => { setAdding(false); setNewItem(''); }}
                    style={{ flex: 1, background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 14, padding: 14, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Plus size={15} /> Add item to checklist
              </button>
            )}
          </div>

          {/* ── Done section ── */}
          {complete.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {/* Collapsible header */}
              <button
                onClick={() => setDoneOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', width: '100%', textAlign: 'left' }}>
                {doneOpen ? <ChevronDown size={16} color={C.muted} /> : <ChevronRight size={16} color={C.muted} />}
                <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Done</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: C.sage, borderRadius: 20, padding: '1px 8px', marginLeft: 2 }}>{complete.length}</span>
              </button>

              {/* Done items list */}
              {doneOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {complete.map(item => {
                    const isRestoring = restoreId === item.id;
                    return (
                      <div key={item.id}
                        style={{ background: isRestoring ? '#f9f6f3' : '#fafafa', borderRadius: 14, padding: '12px 18px', border: `1px solid ${C.border}`, opacity: 0.85, transition: 'background 0.2s' }}>

                        {isRestoring ? (
                          /* ── Restore prompt ── */
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <RotateCcw size={16} color={C.roseDark} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>
                              Restore <strong>{item.title}</strong> to your checklist?
                            </span>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => confirmRestore(item.id)}
                                style={{ background: C.roseDark, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Restore
                              </button>
                              <button onClick={() => setRestoreId(null)}
                                style={{ background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Keep done
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── Normal done row ── */
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <button onClick={() => handleToggle(item)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
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
          <div style={{ background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 16, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Info size={17} color={C.primaryDark} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.primaryDark, marginBottom: 4 }}>Connect Google Drive</p>
              <p style={{ fontSize: 13, color: C.primary, lineHeight: 1.6, marginBottom: 12 }}>Store insurance cards, medical records, and legal documents — all in one secure place.</p>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primaryDark, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <ExternalLink size={13} /> Connect Google Drive
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DOCS.map((doc, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, background: doc.color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color={doc.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                  <p style={{ fontSize: 12, color: C.mutedLight }}>{doc.date}</p>
                </div>
                <ExternalLink size={15} color={C.border} style={{ flexShrink: 0 }} />
              </div>
            ))}
            <button style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 14, padding: 14, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={15} /> Upload document
            </button>
          </div>
        </>
      )}

      {/* Drag-and-drop cursor style */}
      <style>{`
        [data-drag-item] { user-select: none; }
        [data-drag-item][data-dragging='true'] { opacity: 0.4; }
      `}</style>
    </div>
  );
}
