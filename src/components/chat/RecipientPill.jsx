import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { C, radius } from '../../theme';

export default function RecipientPill({ recipients, recipientId, onChange, locked }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = recipients.find(r => r.id === recipientId);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!recipients.length) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !locked && recipients.length > 1 && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: selected ? C.roseLight : '#f3f4f6',
          border: `1px solid ${selected ? C.rose : C.border}`,
          borderRadius: radius.pill, padding: '5px 12px 5px 8px',
          fontSize: 13, fontWeight: 500,
          color: selected ? C.roseDark : C.muted,
          cursor: locked || recipients.length <= 1 ? 'default' : 'pointer',
        }}>
        {selected?.photo
          ? <img src={selected.photo} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={11} color={C.muted} /></div>
        }
        <span>{selected ? (selected.nickname || selected.name.split(' ')[0]) : 'Select person'}</span>
        {!locked && recipients.length > 1 && <ChevronDown size={12} style={{ opacity: 0.6 }} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: radius.md,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 180, overflow: 'hidden',
        }}>
          {recipients.map(r => (
            <button
              key={r.id}
              onClick={() => { onChange(r.id); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px', border: 'none', background: r.id === recipientId ? C.roseLight : '#fff',
                color: r.id === recipientId ? C.roseDark : C.text,
                fontSize: 13, fontWeight: r.id === recipientId ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => { if (r.id !== recipientId) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (r.id !== recipientId) e.currentTarget.style.background = '#fff'; }}>
              {r.photo
                ? <img src={r.photo} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={12} color={C.muted} /></div>
              }
              {r.nickname || r.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
