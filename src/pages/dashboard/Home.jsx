import { useState } from 'react';
import { CalendarDays, ClipboardList, ChevronRight, Plus, AlertCircle, Clock, Pencil, Pill } from 'lucide-react';
import AppointmentModal from '../../components/AppointmentModal';
import { C, serif, shadow, shadowSm, radius } from '../../theme';
import { INSURANCE_INFO } from '../../data';
import { AddRecipientModal } from './Care';

function rColor(id) { return id === 1 ? C.rose : C.primary; }
function calcAge(birthdate) {
  if (!birthdate) return null;
  const today = new Date();
  const bd = new Date(birthdate + 'T00:00:00');
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}
function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }
function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}
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
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function todayStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Home({ recipients, appointments, logistics, onNavigate, onAddRecipient, onUpdateAppointment, onDeleteAppointment }) {
  const [activeAppt, setActiveAppt] = useState(null);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const pending = logistics.filter(l => !l.completed).length;
  const pct = Math.round(((logistics.length - pending) / logistics.length) * 100);
  const now = Date.now();
  const sorted = [...appointments]
    .filter(a => apptMs(a) >= now)
    .sort((a, b) => apptMs(a) - apptMs(b))
    .slice(0, 5);

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      {showAddRecipient && (
        <AddRecipientModal
          onClose={() => setShowAddRecipient(false)}
          onAdd={data => { onAddRecipient(data); setShowAddRecipient(false); }}
        />
      )}
      {/* Greeting */}
      <p style={{ fontSize: 13, color: C.mutedLight, marginBottom: 6 }}>{todayStr()}</p>
      <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 600, color: C.text, marginBottom: 32, letterSpacing: -0.5 }}>
        {getGreeting()}
      </h1>


      {/* Alert */}
      {pending > 0 && (
        <button onClick={() => onNavigate('todo')} style={{ width: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={18} color={C.coral} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#7a3a34' }}>{pending} logistics items need your attention</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>HIPAA forms, Power of Attorney, financial access, and more.</p>
          </div>
          <ChevronRight size={16} color={C.coral} style={{ flexShrink: 0 }} />
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Upcoming appointments */}
        <div style={{ background: '#fff', borderRadius: radius.lg, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Upcoming Appointments</p>
            <button onClick={() => onNavigate('calendar')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f7f7f7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: C.muted, cursor: 'pointer' }}>
              <Plus size={12} /> Add
            </button>
          </div>
          <div>
            {sorted.map((appt, i) => {
              const r = recipients.find(x => x.id === appt.recipientId);
              const col = rColor(r?.id);
              return (
                <button key={appt.id} onClick={() => setActiveAppt(appt)} style={{ width: '100%', padding: '14px 24px', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 14, alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  {r?.photo
                    ? <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><img src={r.photo} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    : <div style={{ width: 36, height: 36, borderRadius: 8, background: col + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: col, flexShrink: 0 }}>{r ? initials(r.name) : '?'}</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.title}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                      <Clock size={11} color={C.mutedLight} />
                      <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(appt.date)} · {appt.time}</span>
                    </div>
                  </div>
                  <span style={{ background: col + '18', color: col, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r?.nickname || '?'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Care recipients */}
        <div style={{ background: '#fff', borderRadius: radius.lg, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>People I'm Caring For</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAddRecipient(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f7f7f7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: C.muted, cursor: 'pointer' }}>
                <Plus size={12} /> Add
              </button>
              <button onClick={() => onNavigate('care')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: C.muted, cursor: 'pointer', textDecoration: 'underline' }}>
                View all
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, padding: '20px 24px', overflowX: 'auto', paddingBottom: 24 }}>
            {recipients.map((r) => {
              const col = rColor(r.id);
              const nextAppt = [...appointments]
                .filter(a => a.recipientId === r.id && apptMs(a) >= now)
                .sort((a, b) => apptMs(a) - apptMs(b))[0];
              const topTodos = logistics
                .filter(l => l.recipientId === r.id && !l.completed)
                .slice(0, 3);
              const medCount = (r.medications || []).length;
              return (
                <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff', border: `1px solid ${C.border}`, borderRadius: radius.md, flexShrink: 0, width: 220, overflow: 'hidden' }}>
                  {/* Header — click navigates to care detail */}
                  <button onClick={() => onNavigate('care', r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 12px', background: col + '10', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = col + '1e'}
                    onMouseLeave={e => e.currentTarget.style.background = col + '10'}>
                    {r.photo
                      ? <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><img src={r.photo} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                      : <div style={{ width: 42, height: 42, borderRadius: 10, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{initials(r.name)}</div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nickname || r.name.split(' ')[0]}</p>
                      {(calcAge(r.birthdate) ?? r.age) ? <p style={{ fontSize: 11, color: col, fontWeight: 600, marginTop: 1 }}>Age {calcAge(r.birthdate) ?? r.age}</p> : null}
                    </div>
                  </button>

                  {/* Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 14px', gap: 8, flex: 1 }}>
                    {/* Next appointment */}
                    {nextAppt ? (
                      <button onClick={() => onNavigate('calendar')} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}>
                        <CalendarDays size={12} color={C.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 11, color: C.mutedLight, fontWeight: 500 }}>Next appointment</p>
                          <p style={{ fontSize: 12, color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextAppt.title}</p>
                          <p style={{ fontSize: 11, color: C.muted }}>{fmtDate(nextAppt.date)}</p>
                        </div>
                      </button>
                    ) : (
                      <button onClick={() => onNavigate('calendar')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <CalendarDays size={12} color={C.mutedLight} />
                        <p style={{ fontSize: 12, color: C.mutedLight, fontStyle: 'italic' }}>No upcoming appointments</p>
                      </button>
                    )}

                    {/* Medications */}
                    {medCount > 0 && (
                      <button onClick={() => onNavigate('care', r.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                        <Pill size={12} color={C.peach} style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: C.muted }}>{medCount} medication{medCount !== 1 ? 's' : ''}</p>
                      </button>
                    )}

                    {/* Top To Dos */}
                    {topTodos.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: C.mutedLight }}>To do</p>
                        {topTodos.map((todo, i) => (
                          <button key={i} onClick={() => onNavigate('todo')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px solid ${C.border}`, flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.task || todo.title || 'Task'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '8px 14px' }}>
                    <button onClick={() => onNavigate('care', r.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 600, color: C.muted }}>
                      <Pencil size={11} /> Edit details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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

function StatCard({ label, value, color, onClick, onAdd }) {
  return (
    <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadowSm, position: 'relative', overflow: 'hidden' }}>
      <button onClick={onClick} style={{ width: '100%', padding: '20px 22px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.2s, transform 0.15s', display: 'block' }}
        onMouseEnter={e => { e.currentTarget.closest('div').style.boxShadow = shadow; e.currentTarget.closest('div').style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.closest('div').style.boxShadow = shadowSm; e.currentTarget.closest('div').style.transform = 'translateY(0)'; }}>
        <p style={{ fontSize: 34, fontWeight: 900, color, lineHeight: 1, marginBottom: 7, letterSpacing: -1 }}>{value}</p>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</p>
      </button>
      {onAdd && (
        <button onClick={e => { e.stopPropagation(); onAdd(); }} style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 3, background: color + '18', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color, cursor: 'pointer' }}>
          <Plus size={11} /> Add
        </button>
      )}
    </div>
  );
}
