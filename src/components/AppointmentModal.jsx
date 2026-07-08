import { useState } from 'react';
import { X, Pencil, Trash2, Check, MapPin, Clock, Tag, Share2, Copy, Mail, MessageSquare } from 'lucide-react';
import { C, serif, sans } from '../theme';
import PlacesInput from './PlacesInput';

const FI = 'https://cdn-icons-png.flaticon.com/512';
const EVENT_TYPES = [
  { label: "Doctor's Appointment", icon: `${FI}/46/46196.png` },
  { label: 'Physical Therapy',     icon: `${FI}/14241/14241578.png` },
  { label: 'Occupational Therapy', icon: `${FI}/14241/14241578.png` },
  { label: 'Meeting',              icon: `${FI}/2548/2548761.png` },
  { label: 'Consultation',         icon: `${FI}/46/46196.png` },
  { label: 'Other',                icon: null },
];

function to24h(t) {
  if (!t) return '';
  const [time, period] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function from24h(t) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${p}`;
}
function t24ToH(t) { const h = parseInt((t||'10:00').split(':')[0]); return String(h===0?12:h>12?h-12:h); }
function t24ToM(t) { return (t||'10:00').split(':')[1]||'00'; }
function t24ToP(t) { return parseInt((t||'10:00').split(':')[0])>=12?'PM':'AM'; }
function hmpTo24(h,m,p) { let n=parseInt(h); if(p==='AM'&&n===12)n=0; if(p==='PM'&&n!==12)n+=12; return `${String(n).padStart(2,'0')}:${m}`; }
function fmtDate(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const inputStyle = {
  width: '100%', background: '#f7f5f2', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: sans,
  color: C.text, outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8,
  textTransform: 'uppercase', marginBottom: 6, fontFamily: sans,
};

export default function AppointmentModal({ appt, recipients, onUpdate, onDelete, onClose }) {
  const [mode, setMode]           = useState('view'); // 'view' | 'edit'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied]       = useState(false);

  // Edit buffer
  const [title, setTitle]     = useState(appt.title || '');
  const [date, setDate]       = useState(appt.date || '');
  const [time24, setTime24]   = useState(to24h(appt.time) || '10:00');
  const [type, setType]       = useState(appt.type || '');
  const [location, setLocation] = useState(appt.location || '');
  const [locMode, setLocMode] = useState(
    appt.location?.startsWith('http') ? 'video' : 'inperson'
  );
  const [notes, setNotes]           = useState(appt.notes || '');
  const [recipientId, setRecipientId] = useState(appt.recipientId || 'myself');

  const r   = recipients?.find(rec => rec.id === appt.recipientId);
  const col = r ? (r.id === 1 ? C.rose : C.primary) : C.muted;

  function rColor(id) { return id === 1 ? C.rose : C.primary; }
  function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }

  function buildShareText() {
    return [
      appt.title,
      `📅 ${fmtDate(appt.date)} · ${appt.time}`,
      appt.location ? `📍 ${appt.location}` : null,
      r             ? `For: ${r.name}` : null,
      appt.notes    ? `\n${appt.notes}` : null,
      '\nSent via Aiden',
    ].filter(Boolean).join('\n');
  }

  function handleCopy() {
    navigator.clipboard?.writeText(buildShareText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSave() {
    onUpdate(appt.id, {
      title:       title.trim() || appt.title,
      date,
      time:        from24h(time24),
      type:        type || null,
      location:    location.trim() || null,
      notes:       notes.trim() || null,
      recipientId: recipientId === 'myself' ? null : recipientId,
    });
    onClose();
  }

  function handleDelete() {
    onDelete(appt.id);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,32,26,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: serif, color: C.text, margin: 0 }}>
            {mode === 'edit' ? 'Edit Appointment' : 'Appointment'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color={C.muted} />
          </button>
        </div>

        {mode === 'view' ? (
          <>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title + recipient */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, fontFamily: serif, color: C.text, marginBottom: 4 }}>{appt.title}</p>
                  {r && <span style={{ background: col+'18', color: col, borderRadius: 10, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{r.nickname || r.name.split(' ')[0]}</span>}
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: C.bgWarm, borderRadius: 14, padding: '14px 16px' }}>
                <Detail icon={<Clock size={14} color={C.muted}/>} text={`${fmtDate(appt.date)} · ${appt.time}`} />
                {appt.location && <Detail icon={<MapPin size={14} color={C.muted}/>} text={appt.location} />}
                {appt.type    && <Detail icon={<Tag size={14} color={C.muted}/>} text={appt.type} />}
              </div>
              {appt.doctor && <p style={{ fontSize: 13, color: col, fontWeight: 600, fontFamily: sans }}>{appt.doctor}</p>}
              {appt.notes  && <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontFamily: sans }}>{appt.notes}</p>}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => setMode('edit')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: C.roseLight, color: C.roseDark, border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: 'pointer' }}>
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => { setShowShare(s => !s); setConfirmDelete(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: showShare ? '#dde8f5' : C.bgWarm, color: showShare ? C.primaryDark : C.muted, border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: 'pointer' }}>
                <Share2 size={14} /> Share
              </button>
              {confirmDelete ? (
                <>
                  <button onClick={handleDelete} style={{ flex: 1, background: C.rose, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: 'pointer' }}>
                    Confirm delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => { setConfirmDelete(true); setShowShare(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: C.bgWarm, color: C.muted, border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: 'pointer' }}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>

            {/* Share panel */}
            {showShare && (
              <div style={{ padding: '16px 24px 20px', background: '#f7f5f2', borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: sans, marginBottom: 12 }}>Share event details</p>
                <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontFamily: sans, fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {buildShareText()}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`mailto:?subject=${encodeURIComponent(appt.title)}&body=${encodeURIComponent(buildShareText())}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', background: '#eef3fb', borderRadius: 12, textDecoration: 'none', color: C.primaryDark, fontFamily: sans, fontSize: 13, fontWeight: 700 }}>
                    <Mail size={14} /> Email
                  </a>
                  <a href={`sms:?&body=${encodeURIComponent(buildShareText())}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', background: '#eef6f1', borderRadius: 12, textDecoration: 'none', color: '#3a6e58', fontFamily: sans, fontSize: 13, fontWeight: 700 }}>
                    <MessageSquare size={14} /> Text
                  </a>
                  <button onClick={handleCopy}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', background: copied ? '#eef6f1' : '#fff', border: `1px solid ${C.border}`, borderRadius: 12, cursor: 'pointer', fontFamily: sans, fontSize: 13, fontWeight: 700, color: copied ? '#3a6e58' : C.muted }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* For */}
              {recipients?.length > 0 && (
                <div>
                  <p style={labelStyle}>For</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {recipients.map(rec => {
                      const active = recipientId === rec.id;
                      const col = rColor(rec.id);
                      return (
                        <button key={rec.id} onClick={() => setRecipientId(rec.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? col : C.border}`, background: active ? col + '14' : 'white', color: active ? col : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: col + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: col }}>{initials(rec.name)}</div>
                          {rec.nickname || rec.name.split(' ')[0]}
                        </button>
                      );
                    })}
                    <button onClick={() => setRecipientId('myself')} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${recipientId === 'myself' ? C.rose : C.border}`, background: recipientId === 'myself' ? C.roseLight : 'white', color: recipientId === 'myself' ? C.roseDark : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Myself
                    </button>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <p style={labelStyle}>Event Name</p>
                <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              </div>

              {/* Type */}
              <div>
                <p style={labelStyle}>Type</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EVENT_TYPES.map(t => (
                    <button key={t.label} onClick={() => setType(type === t.label ? '' : t.label)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${type === t.label ? C.rose : C.border}`, background: type === t.label ? C.roseLight : 'white', color: type === t.label ? C.roseDark : C.muted, fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {t.icon && <img src={t.icon} alt="" style={{ width: 14, height: 14, opacity: 0.7 }} />}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <p style={labelStyle}>Date & Time</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={t24ToH(time24)} onChange={e => setTime24(hmpTo24(e.target.value, t24ToM(time24), t24ToP(time24)))} style={{ flex: 1, background: '#f7f5f2', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 6px', fontSize: 13, fontFamily: sans, color: C.text, outline: 'none' }}>
                      {['1','2','3','4','5','6','7','8','9','10','11','12'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={t24ToM(time24)} onChange={e => setTime24(hmpTo24(t24ToH(time24), e.target.value, t24ToP(time24)))} style={{ flex: 1, background: '#f7f5f2', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 6px', fontSize: 13, fontFamily: sans, color: C.text, outline: 'none' }}>
                      {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={t24ToP(time24)} onChange={e => setTime24(hmpTo24(t24ToH(time24), t24ToM(time24), e.target.value))} style={{ flex: '0 0 72px', background: '#f7f5f2', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 4px', fontSize: 13, fontFamily: sans, color: C.text, outline: 'none' }}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <p style={labelStyle}>Location</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {[{ id: 'inperson', label: '📍 In person' }, { id: 'video', label: '📹 Video' }].map(m => (
                    <button key={m.id} onClick={() => { setLocMode(m.id); setLocation(''); }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `2px solid ${locMode === m.id ? C.rose : C.border}`, background: locMode === m.id ? C.roseLight : 'white', color: locMode === m.id ? C.roseDark : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {locMode === 'inperson' ? (
                  <PlacesInput
                    value={location}
                    onChange={setLocation}
                    placeholder="Clinic name or address"
                    style={inputStyle}
                  />
                ) : (
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="https://…" style={inputStyle} />
                )}
              </div>

              {/* Notes */}
              <div>
                <p style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: `1px solid ${C.border}`, position: 'sticky', bottom: 0, background: '#fff' }}>
              <button onClick={() => setMode('view')} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} style={{ flex: 2, background: `linear-gradient(135deg, ${C.rose}, ${C.roseDark})`, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: 'pointer' }}>
                Save changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, color: C.text, fontFamily: sans, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
