import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Check, Phone, X,
  Search, Pencil, AlertTriangle, CalendarDays, Shield, Users,
} from 'lucide-react';
import { C, serif, shadowSm, radius } from '../../theme';
import { INSURANCE_INFO, CAREGIVING_RECS } from '../../data';

const COLORS = [C.rose, C.primary, C.sage, C.lavender, C.peach];
function rColor(id, recipients) {
  const idx = recipients ? recipients.findIndex(r => r.id === id) : 0;
  return COLORS[idx % COLORS.length];
}
function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }
function fmt24(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// ─── Common conditions ──────────────────────────────────────────────────────────
const COMMON_CONDITIONS = [
  "Alzheimer's Disease","Anemia","Anxiety Disorder","Arthritis","Asthma",
  "Atrial Fibrillation","Autism Spectrum Disorder","Cancer",
  "Chronic Kidney Disease","Chronic Pain","COPD","Congestive Heart Failure",
  "Coronary Artery Disease","Dementia","Depression","Diabetes (Type 1)",
  "Diabetes (Type 2)","Epilepsy","GERD / Acid Reflux","Glaucoma",
  "Heart Disease","High Cholesterol","Hypertension","Hypothyroidism",
  "Irritable Bowel Syndrome","Liver Disease","Lupus","Macular Degeneration",
  "Memory Loss","Multiple Sclerosis","Neuropathy","Obesity","Osteoarthritis",
  "Osteoporosis","Parkinson's Disease","Peripheral Artery Disease",
  "Post-Stroke Recovery","Rheumatoid Arthritis","Sleep Apnea","Stroke",
  "Thyroid Disease","Vascular Dementia",
];

// ─── Shared UI ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>{children}</p>;
}
function Card({ children, style }) {
  return <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadowSm, padding: 20, marginBottom: 14, ...style }}>{children}</div>;
}
function ModalWrap({ onClose, children, maxWidth = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,32,26,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(40,30,20,0.2)' }}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <h2 style={{ fontFamily: serif, fontSize: 22, color: C.text }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
    </div>
  );
}
function ModalActions({ onConfirm, confirmLabel, onClose, danger }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
      <button onClick={onConfirm} style={{ flex: 1, background: danger ? C.coral : C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{confirmLabel}</button>
      <button onClick={onClose} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
    </div>
  );
}
const inp = { width: '100%', background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' };
const lbl = (text) => <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{text}</p>;

// ─── Conditions picker ──────────────────────────────────────────────────────────
function ConditionsPicker({ selected, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const trimmed = query.trim();
  const filtered = COMMON_CONDITIONS.filter(c => c.toLowerCase().includes(trimmed.toLowerCase()) && !selected.includes(c));
  const canAdd = trimmed.length > 1 && !COMMON_CONDITIONS.some(c => c.toLowerCase() === trimmed.toLowerCase()) && !selected.includes(trimmed);

  function toggle(c) { onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]); }
  function addCustom() { onChange([...selected, trimmed]); setQuery(''); }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map(c => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.roseLight, border: `1px solid ${C.rose}40`, borderRadius: 20, padding: '4px 10px 4px 12px', fontSize: 12, fontWeight: 600, color: C.roseDark }}>
              {c}
              <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: C.roseDark, opacity: 0.6 }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Search size={14} color={C.mutedLight} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (canAdd) addCustom(); else if (filtered[0]) { toggle(filtered[0]); setQuery(''); } } if (e.key === 'Escape') setOpen(false); }}
          placeholder="Search conditions…" style={{ ...inp, paddingLeft: 34 }} />
      </div>
      {open && (filtered.length > 0 || canAdd) && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 8px 32px rgba(40,30,20,0.12)', zIndex: 400, maxHeight: 220, overflowY: 'auto' }}>
          {filtered.map(c => (
            <button key={c} onMouseDown={e => { e.preventDefault(); toggle(c); setQuery(''); }}
              style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => e.currentTarget.style.background = C.bgWarm} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {c}{selected.includes(c) && <Check size={14} color={C.sage} />}
            </button>
          ))}
          {canAdd && (
            <button onMouseDown={e => { e.preventDefault(); addCustom(); }}
              style={{ width: '100%', background: 'none', border: 'none', borderTop: filtered.length ? `1px solid ${C.border}` : 'none', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: C.roseDark, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = C.roseLight} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Plus size={14} /> Add "{trimmed}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared recipient form ──────────────────────────────────────────────────────
function RecipientForm({ values, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>{lbl('Full name *')}<input value={values.name} onChange={e => onChange('name', e.target.value)} placeholder="Margaret Chen" style={inp} /></div>
        <div>{lbl('Nickname')}<input value={values.nickname} onChange={e => onChange('nickname', e.target.value)} placeholder="Mom" style={inp} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>{lbl('Age')}<input type="number" value={values.age} onChange={e => onChange('age', e.target.value)} placeholder="78" style={inp} /></div>
        <div>{lbl('Relationship')}<input value={values.relationship} onChange={e => onChange('relationship', e.target.value)} placeholder="Parent, Sibling…" style={inp} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>{lbl('Email')}<input type="email" value={values.email} onChange={e => onChange('email', e.target.value)} placeholder="email@example.com" style={inp} /></div>
        <div>{lbl('Phone')}<input value={values.phone} onChange={e => onChange('phone', e.target.value)} placeholder="(555) 123-4567" style={inp} /></div>
      </div>
      <div>{lbl('Conditions')}<ConditionsPicker selected={values.conditions} onChange={v => onChange('conditions', v)} /></div>
      <div>{lbl('Medications (comma-separated)')}<input value={values.medications} onChange={e => onChange('medications', e.target.value)} placeholder="Metformin, Lisinopril…" style={inp} /></div>
      <div>{lbl('Notes')}<textarea value={values.notes} onChange={e => onChange('notes', e.target.value)} placeholder="Anything important to remember…" rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
    </div>
  );
}

// ─── Add Recipient Modal ────────────────────────────────────────────────────────
function AddRecipientModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', nickname: '', age: '', relationship: '', email: '', phone: '', conditions: [], medications: '', notes: '' });
  const [error, setError] = useState('');
  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }
  function handleAdd() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    onAdd({ id: Date.now(), name: form.name.trim(), nickname: form.nickname.trim() || form.name.split(' ')[0], age: parseInt(form.age) || 0, relationship: form.relationship.trim() || 'Family', email: form.email.trim(), phone: form.phone.trim(), photo: null, conditions: form.conditions, medications: form.medications.split(',').map(s => s.trim()).filter(Boolean), insurancePlans: [], notes: form.notes.trim(), importantNumbers: [] });
    onClose();
  }
  return (
    <ModalWrap onClose={onClose} maxWidth={520}>
      <ModalHeader title="Add care recipient" onClose={onClose} />
      <RecipientForm values={form} onChange={set} />
      {error && <p style={{ fontSize: 13, color: C.coral, marginTop: 12 }}>{error}</p>}
      <ModalActions onConfirm={handleAdd} confirmLabel="Add recipient" onClose={onClose} />
    </ModalWrap>
  );
}

// ─── Edit Recipient Modal ───────────────────────────────────────────────────────
function EditRecipientModal({ recipient, onClose, onSave }) {
  const [form, setForm] = useState({ name: recipient.name, nickname: recipient.nickname, age: String(recipient.age), relationship: recipient.relationship, email: recipient.email, phone: recipient.phone, conditions: [...recipient.conditions], medications: recipient.medications.join(', '), notes: recipient.notes });
  const [error, setError] = useState('');
  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }
  function handleSave() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    onSave({ ...recipient, name: form.name.trim(), nickname: form.nickname.trim() || form.name.split(' ')[0], age: parseInt(form.age) || 0, relationship: form.relationship.trim() || 'Family', email: form.email.trim(), phone: form.phone.trim(), conditions: form.conditions, medications: form.medications.split(',').map(s => s.trim()).filter(Boolean), notes: form.notes.trim() });
    onClose();
  }
  return (
    <ModalWrap onClose={onClose} maxWidth={520}>
      <ModalHeader title={`Edit ${recipient.name.split(' ')[0]}`} onClose={onClose} />
      <RecipientForm values={form} onChange={set} />
      {error && <p style={{ fontSize: 13, color: C.coral, marginTop: 12 }}>{error}</p>}
      <ModalActions onConfirm={handleSave} confirmLabel="Save changes" onClose={onClose} />
    </ModalWrap>
  );
}

// ─── Delete Confirm Modal ───────────────────────────────────────────────────────
function DeleteConfirmModal({ recipient, onClose, onDelete }) {
  return (
    <ModalWrap onClose={onClose} maxWidth={420}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fdf0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={24} color={C.coral} />
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 22, color: C.text }}>Remove {recipient.name.split(' ')[0]}?</h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>This will permanently remove <strong>{recipient.name}</strong> and all of their information. This cannot be undone.</p>
      </div>
      <ModalActions onConfirm={() => { onDelete(recipient.id); onClose(); }} confirmLabel="Yes, remove" onClose={onClose} danger />
    </ModalWrap>
  );
}

// ─── Add Care Team Member Modal ─────────────────────────────────────────────────
function AddDoctorModal({ recipientId, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', specialty: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState('');
  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }
  function handleAdd() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    onAdd({ id: Date.now(), recipientId, name: form.name.trim(), specialty: form.specialty.trim(), phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim() });
    onClose();
  }
  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title="Add care team member" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>{lbl('Name *')}<input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Sarah Kim" style={inp} /></div>
          <div>{lbl('Specialty')}<input value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="Primary Care" style={inp} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>{lbl('Phone')}<input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 200-1000" style={inp} /></div>
          <div>{lbl('Address / Location')}<input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Suite 1" style={inp} /></div>
        </div>
        <div>{lbl('Notes')}<textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this provider…" rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
      </div>
      {error && <p style={{ fontSize: 13, color: C.coral, marginTop: 12 }}>{error}</p>}
      <ModalActions onConfirm={handleAdd} confirmLabel="Add to care team" onClose={onClose} />
    </ModalWrap>
  );
}

// ─── Manage Insurance Modal ─────────────────────────────────────────────────────
function ManageInsuranceModal({ recipient, onClose, onSave }) {
  const [plans, setPlans] = useState([...recipient.insurancePlans]);
  function toggle(key) { setPlans(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]); }
  return (
    <ModalWrap onClose={onClose} maxWidth={460}>
      <ModalHeader title="Insurance plans" onClose={onClose} />
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, marginTop: -16 }}>Select all plans that apply to {recipient.nickname}.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(INSURANCE_INFO).map(([key, info]) => {
          const active = plans.includes(key);
          return (
            <button key={key} onClick={() => toggle(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: active ? info.bg : '#fafafa', border: `2px solid ${active ? info.color : C.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{info.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{info.name}</p>
                <p style={{ fontSize: 12, color: C.muted }}>{info.parts[0].name}</p>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: active ? info.color : 'transparent', border: `2px solid ${active ? info.color : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {active && <Check size={12} color="#fff" />}
              </div>
            </button>
          );
        })}
      </div>
      <ModalActions onConfirm={() => { onSave({ ...recipient, insurancePlans: plans }); onClose(); }} confirmLabel="Save" onClose={onClose} />
    </ModalWrap>
  );
}

// ─── Add Appointment Modal ──────────────────────────────────────────────────────
function AddAppointmentModal({ recipientId, doctors, onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', date: '', time: '', doctor: '', location: '' });
  const [error, setError] = useState('');
  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }
  function handleAdd() {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.date)         { setError('Date is required.'); return; }
    onAdd({ id: Date.now(), recipientId, title: form.title.trim(), date: form.date, time: fmt24(form.time), doctor: form.doctor.trim(), location: form.location.trim() });
    onClose();
  }
  const listId = `doc-list-${recipientId}`;
  return (
    <ModalWrap onClose={onClose}>
      <ModalHeader title="Add appointment" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>{lbl('Title *')}<input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Cardiology Follow-up" style={inp} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>{lbl('Date *')}<input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} /></div>
          <div>{lbl('Time')}<input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={inp} /></div>
        </div>
        <div>
          {lbl('Doctor / Provider')}
          <input value={form.doctor} onChange={e => set('doctor', e.target.value)} placeholder="Dr. Sarah Kim" list={listId} style={inp} />
          <datalist id={listId}>{doctors.map(d => <option key={d.id} value={d.name} />)}</datalist>
        </div>
        <div>{lbl('Location')}<input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City Medical Center, Suite 302" style={inp} /></div>
      </div>
      {error && <p style={{ fontSize: 13, color: C.coral, marginTop: 12 }}>{error}</p>}
      <ModalActions onConfirm={handleAdd} confirmLabel="Add appointment" onClose={onClose} />
    </ModalWrap>
  );
}

// ─── Add Important Number Modal ─────────────────────────────────────────────────
function AddPhoneModal({ onClose, onAdd }) {
  const [label, setLabel]   = useState('');
  const [number, setNumber] = useState('');
  const [error, setError]   = useState('');
  function handleAdd() {
    if (!label.trim() || !number.trim()) { setError('Both fields are required.'); return; }
    onAdd({ label: label.trim(), number: number.trim() });
    onClose();
  }
  return (
    <ModalWrap onClose={onClose} maxWidth={400}>
      <ModalHeader title="Add phone number" onClose={onClose} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>{lbl('Label *')}<input value={label} onChange={e => setLabel(e.target.value)} placeholder="Dr. Kim's office" style={inp} /></div>
        <div>{lbl('Phone number *')}<input value={number} onChange={e => setNumber(e.target.value)} placeholder="(555) 200-1000" style={inp} /></div>
      </div>
      {error && <p style={{ fontSize: 13, color: C.coral, marginTop: 12 }}>{error}</p>}
      <ModalActions onConfirm={handleAdd} confirmLabel="Add number" onClose={onClose} />
    </ModalWrap>
  );
}

// ─── Small delete button ────────────────────────────────────────────────────────
function DelBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#fdf0f0'; e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.color = C.coral; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
      <Trash2 size={13} />
    </button>
  );
}

// ─── Recipient detail view ──────────────────────────────────────────────────────
function RecipientDetail({ r, onBack, onEdit, onDelete, doctors, setDoctors, appointments, setAppointments, recipients }) {
  const [tab, setTab]               = useState('overview');
  const [showEdit, setShowEdit]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [showAppt, setShowAppt]     = useState(false);
  const [showPhone, setShowPhone]   = useState(false);
  const [showAllAppts, setShowAllAppts] = useState(false);

  const col       = rColor(r.id, recipients);
  const myDoctors = doctors.filter(d => d.recipientId === r.id);
  const myAppts   = appointments
    .filter(a => a.recipientId === r.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const visibleAppts = showAllAppts ? myAppts : myAppts.slice(0, 4);

  return (
    <div style={{ maxWidth: 800 }}>
      {showEdit     && <EditRecipientModal recipient={r} onClose={() => setShowEdit(false)} onSave={u => { onEdit(u); setShowEdit(false); }} />}
      {showDelete   && <DeleteConfirmModal recipient={r} onClose={() => setShowDelete(false)} onDelete={() => { onDelete(r.id); onBack(); }} />}
      {showDoctor   && <AddDoctorModal recipientId={r.id} onClose={() => setShowDoctor(false)} onAdd={d => setDoctors(prev => [...prev, d])} />}
      {showInsurance && <ManageInsuranceModal recipient={r} onClose={() => setShowInsurance(false)} onSave={onEdit} />}
      {showAppt     && <AddAppointmentModal recipientId={r.id} doctors={myDoctors} onClose={() => setShowAppt(false)} onAdd={a => setAppointments(prev => [...prev, a])} />}
      {showPhone    && <AddPhoneModal onClose={() => setShowPhone(false)} onAdd={n => onEdit({ ...r, importantNumbers: [...(r.importantNumbers || []), n] })} />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${col}22, ${col}10)`, borderRadius: 20, padding: '24px 28px', marginBottom: 20, border: `1px solid ${col}30` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>
            <ChevronLeft size={15} /> Back
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowEdit(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.85)', border: `1px solid ${col}30`, borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: col, cursor: 'pointer' }}>
              <Pencil size={13} /> Edit
            </button>
            <button onClick={() => setShowDelete(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.85)', border: '1px solid #f5c0c030', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: C.coral, cursor: 'pointer' }}>
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
            {initials(r.name)}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: col, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>{r.relationship}</p>
            <h2 style={{ fontFamily: serif, fontSize: 26, color: C.text, marginBottom: 4 }}>{r.name}</h2>
            <p style={{ fontSize: 13, color: C.muted }}>Age {r.age}{r.email ? ` · ${r.email}` : ''}{r.phone ? ` · ${r.phone}` : ''}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {(r.insurancePlans || []).map(p => (
                <span key={p} style={{ background: INSURANCE_INFO[p].color + '18', color: INSURANCE_INFO[p].color, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{INSURANCE_INFO[p].shortName}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 20, borderTop: `1px solid ${col}20`, paddingTop: 14, gap: 4 }}>
          {['overview', 'guidance', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#fff' : C.muted, background: tab === t ? col : 'transparent', cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          {/* Conditions + Medications */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card style={{ margin: 0 }}>
              <SectionLabel>Conditions</SectionLabel>
              {r.conditions.length === 0
                ? <p style={{ fontSize: 13, color: C.mutedLight }}>None recorded</p>
                : r.conditions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < r.conditions.length - 1 ? `1px solid ${C.bgWarm}` : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: C.text }}>{c}</span>
                  </div>
                ))}
            </Card>
            <Card style={{ margin: 0 }}>
              <SectionLabel>Medications</SectionLabel>
              {r.medications.length === 0
                ? <p style={{ fontSize: 13, color: C.mutedLight }}>None recorded</p>
                : r.medications.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < r.medications.length - 1 ? `1px solid ${C.bgWarm}` : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.peach, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: C.text }}>{m}</span>
                  </div>
                ))}
            </Card>
          </div>

          {/* Insurance */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={15} color={col} />
                <SectionLabel>Insurance plans</SectionLabel>
              </div>
              <button onClick={() => setShowInsurance(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: col, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Pencil size={12} /> Manage
              </button>
            </div>
            {(r.insurancePlans || []).length === 0
              ? <p style={{ fontSize: 13, color: C.mutedLight }}>No plans added yet — click Manage to add insurance.</p>
              : (r.insurancePlans || []).map(key => {
                const info = INSURANCE_INFO[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: r.insurancePlans.indexOf(key) < r.insurancePlans.length - 1 ? `1px solid ${C.bgWarm}` : 'none' }}>
                    <span style={{ fontSize: 18 }}>{info.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{info.name}</p>
                      <p style={{ fontSize: 12, color: info.color, fontWeight: 600 }}>{info.parts[0].name}</p>
                    </div>
                    <span style={{ background: info.color + '18', color: info.color, borderRadius: 10, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{info.shortName}</span>
                  </div>
                );
              })}
          </Card>

          {/* Care Team */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={15} color={col} />
                <SectionLabel>Care team</SectionLabel>
              </div>
              <button onClick={() => setShowDoctor(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: col, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={12} /> Add member
              </button>
            </div>
            {myDoctors.length === 0
              ? <p style={{ fontSize: 13, color: C.mutedLight }}>No care team members yet — click Add member.</p>
              : myDoctors.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < myDoctors.length - 1 ? `1px solid ${C.bgWarm}` : 'none', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.name}</p>
                    <p style={{ fontSize: 12, color: col, fontWeight: 600 }}>{d.specialty}</p>
                    <p style={{ fontSize: 12, color: C.muted }}>{d.phone}{d.address ? ` · ${d.address}` : ''}</p>
                    {d.notes && <p style={{ fontSize: 11, color: C.mutedLight, marginTop: 2 }}>{d.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {d.phone && (
                      <a href={`tel:${d.phone}`} style={{ width: 34, height: 34, background: col + '18', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <Phone size={14} color={col} />
                      </a>
                    )}
                    <DelBtn onClick={() => setDoctors(prev => prev.filter(x => x.id !== d.id))} />
                  </div>
                </div>
              ))}
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={15} color={col} />
                <SectionLabel>Upcoming appointments</SectionLabel>
              </div>
              <button onClick={() => setShowAppt(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: col, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={12} /> Add appointment
              </button>
            </div>
            {myAppts.length === 0
              ? <p style={{ fontSize: 13, color: C.mutedLight }}>No appointments yet — click Add appointment.</p>
              : visibleAppts.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < visibleAppts.length - 1 ? `1px solid ${C.bgWarm}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{a.title}</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.date}{a.time ? ` · ${a.time}` : ''}</p>
                    {a.doctor && <p style={{ fontSize: 12, color: col, fontWeight: 600, marginTop: 2 }}>{a.doctor}</p>}
                    {a.location && <p style={{ fontSize: 12, color: C.mutedLight }}>{a.location}</p>}
                  </div>
                  <DelBtn onClick={() => setAppointments(prev => prev.filter(x => x.id !== a.id))} />
                </div>
              ))}
            {myAppts.length > 4 && (
              <button onClick={() => setShowAllAppts(v => !v)} style={{ marginTop: 10, background: 'none', border: 'none', color: col, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {showAllAppts ? 'Show less ↑' : `Show all ${myAppts.length} appointments ↓`}
              </button>
            )}
          </Card>
        </>
      )}

      {/* ── Guidance ─────────────────────────────────────────────────────── */}
      {tab === 'guidance' && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #e8eff8, #f0eaf8)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Personalised guidance for {r.name}</p>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Based on {r.nickname}'s conditions and profile</p>
          </div>
          {r.conditions.filter(c => CAREGIVING_RECS[c]).length === 0
            ? <Card><p style={{ fontSize: 14, color: C.mutedLight }}>No guidance available yet — add conditions to see personalised recommendations.</p></Card>
            : r.conditions.map(cond => CAREGIVING_RECS[cond] ? (
              <Card key={cond}>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>{cond}</p>
                {CAREGIVING_RECS[cond].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < CAREGIVING_RECS[cond].length - 1 ? `1px solid ${C.bgWarm}` : 'none', alignItems: 'flex-start' }}>
                    <Check size={14} color={C.sage} style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: '#4a4038', lineHeight: 1.7 }}>{rec}</p>
                  </div>
                ))}
              </Card>
            ) : null)}
        </>
      )}

      {/* ── Notes ────────────────────────────────────────────────────────── */}
      {tab === 'notes' && (
        <>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SectionLabel>Important phone numbers</SectionLabel>
              <button onClick={() => setShowPhone(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: col, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Plus size={12} /> Add</button>
            </div>
            {(r.importantNumbers || []).length === 0
              ? <p style={{ fontSize: 13, color: C.mutedLight }}>No numbers saved yet — click Add.</p>
              : (r.importantNumbers || []).map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < r.importantNumbers.length - 1 ? `1px solid ${C.bgWarm}` : 'none', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{n.label}</p>
                    <p style={{ fontSize: 13, color: C.muted }}>{n.number}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <a href={`tel:${n.number}`} style={{ width: 34, height: 34, background: col + '18', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      <Phone size={14} color={col} />
                    </a>
                    <DelBtn onClick={() => onEdit({ ...r, importantNumbers: r.importantNumbers.filter((_, idx) => idx !== i) })} />
                  </div>
                </div>
              ))}
          </Card>
          <Card>
            <SectionLabel>Care notes</SectionLabel>
            {r.notes
              ? <p style={{ fontSize: 14, color: '#4a4038', lineHeight: 1.8 }}>{r.notes}</p>
              : <p style={{ fontSize: 13, color: C.mutedLight }}>No notes yet — edit this recipient to add notes.</p>}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Recipients list view ───────────────────────────────────────────────────────
export default function Care({ recipients, setRecipients, doctors, setDoctors, appointments, setAppointments }) {
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const currentSelected = selected ? recipients.find(r => r.id === selected.id) ?? null : null;

  function handleEdit(updated) {
    setRecipients(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelected(updated);
  }
  function handleDelete(id) {
    setRecipients(prev => prev.filter(r => r.id !== id));
    setSelected(null);
  }

  if (currentSelected) {
    return (
      <div style={{ padding: 32 }}>
        <RecipientDetail
          r={currentSelected}
          onBack={() => setSelected(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          doctors={doctors}
          setDoctors={setDoctors}
          appointments={appointments}
          setAppointments={setAppointments}
          recipients={recipients}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 760 }}>
      {showModal && <AddRecipientModal onClose={() => setShowModal(false)} onAdd={r => setRecipients(prev => [...prev, r])} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>People I'm Caring For</p>
          <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5 }}>Care Recipients</h1>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.roseLight, border: `1px solid ${C.rose}30`, borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: C.roseDark, cursor: 'pointer' }}>
          <Plus size={14} /> Add recipient
        </button>
      </div>

      {recipients.map(r => {
        const col = rColor(r.id, recipients);
        return (
          <button key={r.id} onClick={() => setSelected(r)}
            style={{ width: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '20px 24px', textAlign: 'left', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18, transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,60,40,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
              {initials(r.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{r.name}</span>
                <span style={{ fontSize: 11, color: C.muted, background: C.bgWarm, borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>{r.relationship}</span>
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                Age {r.age}{r.conditions.length > 0 ? ` · ${r.conditions[0]}${r.conditions.length > 1 ? ` +${r.conditions.length - 1} more` : ''}` : ''}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(r.insurancePlans || []).map(p => (
                  <span key={p} style={{ background: INSURANCE_INFO[p].color + '18', color: INSURANCE_INFO[p].color, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{INSURANCE_INFO[p].shortName}</span>
                ))}
              </div>
            </div>
            <ChevronRight size={18} color={C.border} style={{ flexShrink: 0 }} />
          </button>
        );
      })}

      <button onClick={() => setShowModal(true)} style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 20, padding: 20, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Plus size={16} /> Add a care recipient
      </button>
    </div>
  );
}
