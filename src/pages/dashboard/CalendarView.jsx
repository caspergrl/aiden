import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, X, Check, Video } from 'lucide-react';
import { C, serif, sans } from '../../theme';
import { FULL_MONTHS, DAYS_OF_WEEK } from '../../data';
import AppointmentModal from '../../components/AppointmentModal';

// ── Helpers ────────────────────────────────────────────────────────────────────
const RECIPIENT_PALETTE = ['#c07878','#5f9e9a','#9b87b8','#c49050','#7a9e72','#7a8abf'];
function rColor(id) {
  if (id == null) return RECIPIENT_PALETTE[0];
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return RECIPIENT_PALETTE[h % RECIPIENT_PALETTE.length];
}
function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }
function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(m, y) { return new Date(y, m, 1).getDay(); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function from24h(t) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${period}`;
}
function t24ToH(t) { const h = parseInt((t||'10:00').split(':')[0]); return String(h===0?12:h>12?h-12:h); }
function t24ToM(t) { return (t||'10:00').split(':')[1]||'00'; }
function t24ToP(t) { return parseInt((t||'10:00').split(':')[0])>=12?'PM':'AM'; }
function hmpTo24(h,m,p) { let n=parseInt(h); if(p==='AM'&&n===12)n=0; if(p==='PM'&&n!==12)n+=12; return `${String(n).padStart(2,'0')}:${m}`; }
function apptMs(a) {
  const [y, mo, d] = (a.date || '').split('-').map(Number);
  if (!y) return Infinity;
  const t = a.time || '12:00 AM';
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return new Date(y, mo - 1, d, 23, 59).getTime();
  let h = parseInt(match[1]);
  const min = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return new Date(y, mo - 1, d, h, min).getTime();
}

const FI = 'https://cdn-icons-png.flaticon.com/512';
const EVENT_TYPES = [
  { label: "Doctor's Appointment", icon: `${FI}/46/46196.png` },
  { label: 'Physical Therapy',     icon: `${FI}/14241/14241578.png` },
  { label: 'Occupational Therapy', icon: `${FI}/14241/14241578.png` },
  { label: 'Meeting',              icon: `${FI}/2548/2548761.png` },
  { label: 'Consultation',         icon: `${FI}/46/46196.png` },
  { label: 'Other',                icon: null },
];

const inputStyle = {
  width: '100%', background: '#f7f5f2', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: sans,
  color: C.text, outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8,
  textTransform: 'uppercase', marginBottom: 6, fontFamily: sans,
};

// ── Add Appointment Modal ──────────────────────────────────────────────────────
function AddAppointmentModal({ recipients, onSave, onClose }) {
  const now = new Date();

  const [recipientId, setRecipientId] = useState(recipients[0]?.id || 'myself');
  const [type, setType]               = useState('');
  const [title, setTitle]             = useState('');
  const [autoTitle, setAutoTitle]     = useState(true);
  const [date, setDate]               = useState(todayISO());
  const [time24, setTime24]           = useState('10:00');
  const [locMode, setLocMode]         = useState('inperson');
  const [location, setLocation]       = useState('');
  const [reminders, setReminders]     = useState(true);
  const [notes, setNotes]             = useState('');

  function pickType(t) {
    setType(t);
    if (autoTitle) setTitle(t);
  }

  function handleSave() {
    if (!date) return;
    onSave({
      title:       title.trim() || type || 'Appointment',
      date,
      time:        from24h(time24),
      location:    location.trim() || null,
      type:        type || null,
      notes:       notes.trim() || null,
      recipientId: recipientId === 'myself' ? null : recipientId,
      reminders,
      doctor:      null,
    });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,32,26,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: serif, color: C.text, margin: 0 }}>New Appointment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color={C.muted} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* For */}
          <div>
            <p style={labelStyle}>For</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recipients.map(r => {
                const active = recipientId === r.id;
                const col = rColor(r.id);
                return (
                  <button key={r.id} onClick={() => setRecipientId(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? col : C.border}`, background: active ? col + '14' : 'white', color: active ? col : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: col + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: col }}>{initials(r.name)}</div>
                    {r.nickname || r.name.split(' ')[0]}
                  </button>
                );
              })}
              <button onClick={() => setRecipientId('myself')} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${recipientId === 'myself' ? C.rose : C.border}`, background: recipientId === 'myself' ? C.roseLight : 'white', color: recipientId === 'myself' ? C.roseDark : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Myself
              </button>
            </div>
          </div>

          {/* Type */}
          <div>
            <p style={labelStyle}>Type of Event</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {EVENT_TYPES.map(t => {
                const active = type === t.label;
                return (
                  <button key={t.label} onClick={() => pickType(t.label)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: `2px solid ${active ? C.rose : C.border}`, background: active ? C.roseLight : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    {t.icon
                      ? <img src={t.icon} alt="" style={{ width: 20, height: 20, opacity: active ? 0.9 : 0.5, flexShrink: 0 }} />
                      : <div style={{ width: 20, height: 20, borderRadius: '50%', background: active ? C.rose : C.border, flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? C.roseDark : C.text, fontFamily: sans }}>{t.label}</span>
                    {active && <Check size={14} color={C.rose} style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event name */}
          <div>
            <p style={labelStyle}>Event Name</p>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setAutoTitle(false); }}
              placeholder={type || 'e.g. Cardiology Follow-up'}
              style={inputStyle}
            />
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[{ id: 'inperson', label: '📍 In person' }, { id: 'video', label: '📹 Video call' }].map(m => (
                <button key={m.id} onClick={() => { setLocMode(m.id); setLocation(''); }} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `2px solid ${locMode === m.id ? C.rose : C.border}`, background: locMode === m.id ? C.roseLight : 'white', color: locMode === m.id ? C.roseDark : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {m.label}
                </button>
              ))}
            </div>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={locMode === 'video' ? 'https://zoom.us/j/…' : 'Address or place name'}
              style={inputStyle}
            />
          </div>

          {/* Reminders */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f7f5f2', borderRadius: 12, padding: '14px 16px' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: sans, margin: 0 }}>Receive reminders</p>
              <p style={{ fontSize: 11, color: C.muted, fontFamily: sans, marginTop: 2 }}>Email reminder the day before</p>
            </div>
            <button onClick={() => setReminders(r => !r)} style={{ width: 48, height: 28, borderRadius: 14, background: reminders ? C.rose : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: reminders ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </button>
          </div>

          {/* Notes */}
          <div>
            <p style={labelStyle}>Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details…"
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: `1px solid ${C.border}`, position: 'sticky', bottom: 0, background: '#fff' }}>
          <button onClick={onClose} style={{ flex: 1, background: C.bgWarm, color: C.muted, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!date} style={{ flex: 2, background: date ? `linear-gradient(135deg, ${C.rose}, ${C.roseDark})` : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: date ? 'pointer' : 'default' }}>
            Save appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────────
export default function CalendarView({ appointments, recipients, onAddAppointment, onUpdateAppointment, onDeleteAppointment }) {
  const today = new Date();
  const [month, setMonth]       = useState(today.getMonth());
  const [year, setYear]         = useState(today.getFullYear());
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [activeAppt, setActiveAppt] = useState(null);

  const days  = getDaysInMonth(month, year);
  const first = getFirstDay(month, year);
  const apptDates = new Set(appointments.map(a => a.date));

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const nowMs = Date.now();
  const allVisible = selected
    ? appointments.filter(a => a.date === selected)
    : appointments.filter(a => {
        const [y, m] = a.date.split('-').map(Number);
        return m - 1 === month && y === year;
      });
  const upcoming = allVisible.filter(a => apptMs(a) >= nowMs).sort((a, b) => apptMs(a) - apptMs(b));
  const past     = allVisible.filter(a => apptMs(a) <  nowMs).sort((a, b) => apptMs(b) - apptMs(a));

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Appointments</p>
          <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5 }}>Calendar</h1>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.roseLight, border: `1px solid ${C.rose}30`, borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: C.roseDark, cursor: 'pointer' }}>
          <Plus size={14} /> Add appointment
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Calendar grid */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, padding: 24, maxWidth: 620 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={prev} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
              <ChevronLeft size={18} color={C.muted} />
            </button>
            <h2 style={{ fontFamily: serif, fontSize: 20, color: C.text }}>{FULL_MONTHS[month]} {year}</h2>
            <button onClick={next} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
              <ChevronRight size={18} color={C.muted} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8 }}>
            {DAYS_OF_WEEK.map(d => <span key={d} style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight }}>{d}</span>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(days).fill(null).map((_, i) => {
              const day = i + 1;
              const ds  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const hasA    = apptDates.has(ds);
              const isToday = ds === todayISO();
              const isSel   = selected === ds;
              const aptsOnDay = appointments.filter(a => a.date === ds);
              return (
                <button key={day} onClick={() => setSelected(isSel ? null : ds)}
                  style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: isToday && !isSel ? `2px solid ${C.rose}` : '2px solid transparent', background: isSel ? C.roseDark : 'transparent', cursor: 'pointer', position: 'relative', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: (isToday || isSel) ? 800 : 400, color: isSel ? '#fff' : isToday ? C.roseDark : C.text }}>{day}</span>
                  {hasA && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {aptsOnDay.slice(0, 3).map(a => {
                        const r = recipients.find(rec => rec.id === a.recipientId);
                        return <div key={a.id} style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : rColor(r?.id) }} />;
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            {recipients.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: rColor(r.id) }} />
                <span style={{ fontSize: 12, color: C.muted }}>{r.nickname}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment list */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{selected || `${FULL_MONTHS[month]} ${year}`}</p>
            {selected && <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Show all</button>}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 480 }}>
            {upcoming.length === 0 && past.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.mutedLight }}>
                <p style={{ fontSize: 14 }}>No appointments {selected ? 'on this day' : 'this month'}</p>
                <button onClick={() => setShowAdd(true)} style={{ marginTop: 12, background: C.roseLight, color: C.roseDark, border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Add one
                </button>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <div style={{ padding: '7px 20px', background: C.bgWarm, borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.roseDark, letterSpacing: 1, textTransform: 'uppercase', fontFamily: sans }}>Upcoming</span>
                    </div>
                    {upcoming.map((a, i) => {
                      const r = recipients.find(rec => rec.id === a.recipientId);
                      const col = rColor(r?.id);
                      return (
                        <button key={a.id} onClick={() => setActiveAppt(a)} style={{ width: '100%', padding: '14px 20px', display: 'block', background: 'none', border: 'none', borderLeft: `3px solid ${col}`, borderBottom: i < upcoming.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{a.title}</p>
                            {r && <span style={{ background: col+'18', color: col, borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.nickname}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                            <Clock size={11} color={C.mutedLight} />
                            <span style={{ fontSize: 12, color: C.muted }}>{a.date} · {a.time}</span>
                          </div>
                          {a.location && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                              <MapPin size={11} color={C.mutedLight} />
                              <span style={{ fontSize: 12, color: C.muted }}>{a.location}</span>
                            </div>
                          )}
                          {a.doctor && <p style={{ fontSize: 12, color: col, fontWeight: 600, marginTop: 2 }}>{a.doctor}</p>}
                        </button>
                      );
                    })}
                  </>
                )}
                {past.length > 0 && (
                  <>
                    <div style={{ padding: '7px 20px', background: C.bgWarm, borderTop: upcoming.length > 0 ? `1px solid ${C.border}` : 'none', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.mutedLight, letterSpacing: 1, textTransform: 'uppercase', fontFamily: sans }}>Past</span>
                    </div>
                    {past.map((a, i) => {
                      const r = recipients.find(rec => rec.id === a.recipientId);
                      const col = rColor(r?.id);
                      return (
                        <button key={a.id} onClick={() => setActiveAppt(a)} style={{ width: '100%', padding: '14px 20px', display: 'block', background: 'none', border: 'none', borderLeft: `3px solid ${col}60`, borderBottom: i < past.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', textAlign: 'left', opacity: 0.6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{a.title}</p>
                            {r && <span style={{ background: col+'18', color: col, borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.nickname}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                            <Clock size={11} color={C.mutedLight} />
                            <span style={{ fontSize: 12, color: C.muted }}>{a.date} · {a.time}</span>
                          </div>
                          {a.location && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                              <MapPin size={11} color={C.mutedLight} />
                              <span style={{ fontSize: 12, color: C.muted }}>{a.location}</span>
                            </div>
                          )}
                          {a.doctor && <p style={{ fontSize: 12, color: col, fontWeight: 600, marginTop: 2 }}>{a.doctor}</p>}
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add appointment modal */}
      {showAdd && (
        <AddAppointmentModal
          recipients={recipients}
          onSave={onAddAppointment}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit / delete modal */}
      {activeAppt && (
        <AppointmentModal
          appt={activeAppt}
          recipients={recipients}
          onUpdate={onUpdateAppointment}
          onDelete={onDeleteAppointment}
          onClose={() => setActiveAppt(null)}
        />
      )}
    </div>
  );
}
