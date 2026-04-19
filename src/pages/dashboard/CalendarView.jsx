import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { C, serif } from '../../theme';
import { FULL_MONTHS, DAYS_OF_WEEK } from '../../data';

function rColor(id) { return id === 1 ? C.rose : C.primary; }
function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }
function getDaysInMonth(m, y) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(m, y) { return new Date(y, m, 1).getDay(); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function CalendarView({ appointments, recipients }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear]   = useState(today.getFullYear());
  const [selected, setSelected] = useState(null);

  const days  = getDaysInMonth(month, year);
  const first = getFirstDay(month, year);
  const apptDates = new Set(appointments.map(a => a.date));

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const visible = selected
    ? appointments.filter(a => a.date === selected)
    : appointments.filter(a => {
        const [y, m] = a.date.split('-').map(Number);
        return m - 1 === month && y === year;
      }).sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Appointments</p>
          <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5 }}>Calendar</h1>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primaryLight, border: `1px solid ${C.primary}30`, borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: C.primaryDark, cursor: 'pointer' }}>
          <Plus size={14} /> Add appointment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Calendar grid */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, padding: 24 }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={prev} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
              <ChevronLeft size={18} color={C.muted} />
            </button>
            <h2 style={{ fontFamily: serif, fontSize: 20, color: C.text }}>{FULL_MONTHS[month]} {year}</h2>
            <button onClick={next} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
              <ChevronRight size={18} color={C.muted} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8 }}>
            {DAYS_OF_WEEK.map(d => <span key={d} style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight }}>{d}</span>)}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array(first).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(days).fill(null).map((_, i) => {
              const day  = i + 1;
              const ds   = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasA = apptDates.has(ds);
              const isToday = ds === todayISO();
              const isSel = selected === ds;
              const aptsOnDay = appointments.filter(a => a.date === ds);
              return (
                <button key={day} onClick={() => setSelected(isSel ? null : ds)}
                  style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: isSel ? C.roseDark : isToday ? C.roseLight : 'transparent', cursor: 'pointer', position: 'relative', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: (isToday || isSel) ? 800 : 400, color: isSel ? '#fff' : isToday ? C.roseDark : C.text }}>{day}</span>
                  {hasA && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {aptsOnDay.slice(0, 2).map(a => {
                        const r = recipients.find(rec => rec.id === a.recipientId);
                        return <div key={a.id} style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : rColor(r?.id) }} />;
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
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
            {visible.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: C.mutedLight }}>
                <p style={{ fontSize: 14 }}>No appointments {selected ? 'on this day' : 'this month'}</p>
              </div>
            ) : visible.map((a, i) => {
              const r = recipients.find(rec => rec.id === a.recipientId);
              const col = rColor(r?.id);
              return (
                <div key={a.id} style={{ padding: '14px 20px', borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none', borderLeft: `3px solid ${col}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{a.title}</p>
                    {r && <span style={{ background: col + '18', color: col, borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.nickname}</span>}
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
