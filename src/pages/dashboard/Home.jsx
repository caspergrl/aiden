import { useState } from 'react';
import { CalendarDays, ClipboardList, ChevronRight, Plus, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';
import { C, serif } from '../../theme';
import { getDailyMessage, INSURANCE_INFO } from '../../data';

function rColor(id) { return id === 1 ? C.rose : C.primary; }
function initials(name) { return name.split(' ').map(n => n[0]).join('').slice(0, 2); }
function fmtDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}
function todayStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Home({ recipients, appointments, logistics, onNavigate }) {
  const [showMsg, setShowMsg] = useState(true);
  const pending = logistics.filter(l => !l.completed).length;
  const pct = Math.round(((logistics.length - pending) / logistics.length) * 100);
  const sorted = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      {/* Greeting */}
      <p style={{ fontSize: 13, color: C.mutedLight, marginBottom: 4 }}>{todayStr()}</p>
      <h1 style={{ fontFamily: serif, fontSize: 32, color: C.text, marginBottom: 24, letterSpacing: -0.5 }}>
        Good morning 👋
      </h1>

      {/* Daily message */}
      {showMsg ? (
        <div style={{ background: 'linear-gradient(135deg, #e8eff8, #f0eaf8, #f8eded)', borderRadius: 20, padding: '20px 24px', marginBottom: 24, border: `1px solid ${C.border}`, position: 'relative' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>✦ Today's message</p>
          <p style={{ fontFamily: serif, fontSize: 16, color: C.text, lineHeight: 1.8, fontStyle: 'italic' }}>"{getDailyMessage()}"</p>
          <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 10 }}>— Aiden</p>
          <button onClick={() => setShowMsg(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <EyeOff size={13} color={C.muted} />
          </button>
        </div>
      ) : (
        <button onClick={() => setShowMsg(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: `1px dashed ${C.border}`, borderRadius: 12, padding: '8px 16px', color: C.mutedLight, fontSize: 13, cursor: 'pointer', marginBottom: 24 }}>
          <Eye size={14} /> Show today's message
        </button>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Care recipients" value={recipients.length} color={C.rose} onClick={() => onNavigate('care')} />
        <StatCard label="Upcoming appointments" value={appointments.length} color={C.primary} onClick={() => onNavigate('calendar')} />
        <StatCard label="Checklist progress" value={`${pct}%`} color={C.sage} onClick={() => onNavigate('list')} />
        <StatCard label="Items need attention" value={pending} color={pending > 0 ? C.coral : C.sage} onClick={() => onNavigate('list')} />
      </div>

      {/* Alert */}
      {pending > 0 && (
        <button onClick={() => onNavigate('list')} style={{ width: '100%', background: '#fdf6f5', border: `1px solid ${C.rose}40`, borderRadius: 16, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}>
          <AlertCircle size={18} color={C.coral} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#7a3a34' }}>{pending} logistics items need your attention</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>HIPAA forms, Power of Attorney, financial access, and more.</p>
          </div>
          <ChevronRight size={16} color={C.coral} style={{ flexShrink: 0 }} />
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming appointments */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Upcoming Appointments</p>
            <button onClick={() => onNavigate('calendar')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.primaryLight, border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: C.primaryDark, cursor: 'pointer' }}>
              <Plus size={12} /> Add
            </button>
          </div>
          <div>
            {sorted.map((appt, i) => {
              const r = recipients.find(x => x.id === appt.recipientId);
              const col = rColor(r?.id);
              return (
                <div key={appt.id} style={{ padding: '12px 20px', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: col + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: col, flexShrink: 0 }}>
                    {r ? initials(r.name) : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.title}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                      <Clock size={11} color={C.mutedLight} />
                      <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(appt.date)} · {appt.time}</span>
                    </div>
                  </div>
                  <span style={{ background: col + '18', color: col, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r?.nickname || '?'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Care recipients */}
        <div style={{ background: '#fff', borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>People I'm Caring For</p>
            <button onClick={() => onNavigate('care')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.roseLight, border: 'none', borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: C.roseDark, cursor: 'pointer' }}>
              View all
            </button>
          </div>
          {recipients.map((r, i) => (
            <div key={r.id} style={{ padding: '14px 20px', borderBottom: i < recipients.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: rColor(r.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                {initials(r.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.name}</p>
                <p style={{ fontSize: 12, color: C.muted }}>Age {r.age} · {r.conditions[0]}{r.conditions.length > 1 ? ` +${r.conditions.length - 1}` : ''}</p>
                <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  {r.insurancePlans.map(p => (
                    <span key={p} style={{ background: INSURANCE_INFO[p].color + '18', color: INSURANCE_INFO[p].color, borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{INSURANCE_INFO[p].shortName}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, onClick }) {
  return (
    <button onClick={onClick} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,60,40,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <p style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{label}</p>
    </button>
  );
}
