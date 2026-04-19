import { useState } from 'react';
import { ChevronLeft, Phone, Plus } from 'lucide-react';
import { C, serif } from '../../theme';
import { INSURANCE_INFO } from '../../data';

export default function Insurance({ recipients }) {
  const [sel, setSel] = useState(null);
  const allPlans = [...new Set(recipients.flatMap(r => r.insurancePlans))];

  if (sel) {
    const info = INSURANCE_INFO[sel];
    const covered = recipients.filter(r => r.insurancePlans.includes(sel));
    return (
      <div style={{ padding: 32, maxWidth: 760 }}>
        <button onClick={() => setSel(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer', marginBottom: 24 }}>
          <ChevronLeft size={15} /> All insurance
        </button>

        <div style={{ background: `linear-gradient(135deg, ${info.color}22, ${info.color}10)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, border: `1px solid ${info.color}30` }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 44 }}>{info.emoji}</span>
            <div>
              <h1 style={{ fontFamily: serif, fontSize: 26, color: C.text, marginBottom: 8 }}>{info.name}</h1>
              <div style={{ display: 'flex', gap: 8 }}>
                {covered.map(r => (
                  <span key={r.id} style={{ background: info.color + '22', color: info.color, borderRadius: 12, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{r.nickname}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {info.warning && (
          <div style={{ background: '#fdf6ef', border: `1px solid ${C.peach}60`, borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: '#7a5a3a', lineHeight: 1.7 }}>{info.warning}</p>
          </div>
        )}

        {info.parts.map((part, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 18, padding: 22, marginBottom: 14, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: info.color, marginBottom: 12 }}>{part.name}</p>
            <p style={{ fontSize: 14, color: '#4a4038', lineHeight: 1.8, marginBottom: 16 }}>{part.plain}</p>
            <div style={{ background: info.bg, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>Member Services</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: info.color }}>{part.phone}</p>
              </div>
              <a href={`tel:${part.phone}`} style={{ width: 42, height: 42, background: info.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <Phone size={17} color="#fff" />
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.roseDark, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Coverage</p>
        <h1 style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: -0.5 }}>Insurance</h1>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Coverage explained in plain language</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {allPlans.map(planId => {
          const info = INSURANCE_INFO[planId];
          const covered = recipients.filter(r => r.insurancePlans.includes(planId));
          return (
            <button key={planId} onClick={() => setSel(planId)}
              style={{ width: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '18px 22px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18, transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,60,40,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ width: 60, height: 60, background: info.bg, border: `2px solid ${info.color}22`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                {info.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>{info.name}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {covered.map(r => (
                    <span key={r.id} style={{ background: info.color + '18', color: info.color, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{r.nickname}</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 20, color: C.border }}>›</div>
            </button>
          );
        })}
        <button style={{ width: '100%', border: `2px dashed ${C.border}`, borderRadius: 20, padding: 16, background: 'none', color: C.mutedLight, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={15} /> Add insurance plan
        </button>
      </div>
    </div>
  );
}
