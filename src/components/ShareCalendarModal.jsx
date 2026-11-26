import { useState, useMemo } from 'react';
import { X, Share2, Download, Copy, Check, Calendar } from 'lucide-react';
import { Dialog } from '@base-ui-components/react/dialog';
import { C, serif, sans } from '../theme';

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: '#9b8e82', letterSpacing: 0.8,
  textTransform: 'uppercase', marginBottom: 8, fontFamily: sans,
};

const RECIPIENT_PALETTE = ['#c07878','#5f9e9a','#9b87b8','#c49050','#7a9e72','#7a8abf'];
function rColor(id) {
  if (id == null) return RECIPIENT_PALETTE[0];
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return RECIPIENT_PALETTE[h % RECIPIENT_PALETTE.length];
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDateLong(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

function apptMs(a) {
  const [y, mo, d] = (a.date || '').split('-').map(Number);
  if (!y) return Infinity;
  const match = (a.time || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return new Date(y, mo - 1, d, 23, 59).getTime();
  let h = parseInt(match[1]);
  const min = parseInt(match[2]);
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return new Date(y, mo - 1, d, h, min).getTime();
}

function toICSDateTime(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const match = (timeStr || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  let h = 10, m = 0;
  if (match) {
    h = parseInt(match[1]);
    m = parseInt(match[2]);
    if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  }
  return `${y}${String(mo).padStart(2,'0')}${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}00`;
}

function escapeICS(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

function generateICS(appts, recipients) {
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@aidencare.co`;
  const events = appts.map(a => {
    const r = recipients.find(rec => rec.id === a.recipientId);
    const name = r ? (r.nickname || r.name.split(' ')[0]) : null;
    const summary = name ? `${a.title} – ${name}` : a.title;
    const dtstart = toICSDateTime(a.date, a.time);
    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtstart}`,
      `SUMMARY:${escapeICS(summary)}`,
    ];
    if (a.location) lines.push(`LOCATION:${escapeICS(a.location)}`);
    if (a.notes)    lines.push(`DESCRIPTION:${escapeICS(a.notes)}`);
    lines.push('END:VEVENT');
    return lines.join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aiden Care//Aiden//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function generateText(appts, recipients) {
  if (!appts.length) return 'No appointments in this range.';
  const grouped = {};
  appts.forEach(a => {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  });
  const lines = ['Appointments shared from Aiden\n'];
  Object.keys(grouped).sort().forEach(date => {
    lines.push(fmtDateLong(date));
    grouped[date].forEach(a => {
      const r = recipients.find(rec => rec.id === a.recipientId);
      const name = r ? ` (${r.nickname || r.name.split(' ')[0]})` : '';
      lines.push(`  • ${a.time} – ${a.title}${name}`);
      if (a.location) lines.push(`    Location: ${a.location}`);
      if (a.notes)    lines.push(`    Notes: ${a.notes}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

export default function ShareCalendarModal({ appointments, recipients, onClose }) {
  const today = todayISO();
  const curMonth = today.slice(0, 7);

  const [selRecipients, setSelRecipients] = useState(() => new Set(recipients.map(r => r.id)));
  const [range, setRange] = useState('upcoming');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo]   = useState(addDaysISO(today, 30));
  const [format, setFormat] = useState('ics');
  const [copied, setCopied] = useState(false);

  function toggleRecipient(id) {
    setSelRecipients(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return appointments
      .filter(a => {
        if (a.recipientId && !selRecipients.has(a.recipientId)) return false;
        if (!a.recipientId && !selRecipients.has('__self__')) return false; // "myself" appts: always include if no specific recipient
        return true;
      })
      .filter(a => {
        const d = a.date;
        if (range === 'month')    return d.startsWith(curMonth);
        if (range === '30days')   return d >= today && d <= addDaysISO(today, 30);
        if (range === 'upcoming') return d >= today;
        if (range === 'custom')   return d >= customFrom && d <= customTo;
        return true;
      })
      .sort((a, b) => apptMs(a) - apptMs(b));
  }, [appointments, selRecipients, range, customFrom, customTo, today, curMonth]);

  // For "myself" appointments (no recipientId), always include if any recipient is selected
  const filteredFinal = useMemo(() => {
    return appointments
      .filter(a => {
        if (a.recipientId) return selRecipients.has(a.recipientId);
        return true; // include "myself" appts always
      })
      .filter(a => {
        const d = a.date;
        if (range === 'month')    return d.startsWith(curMonth);
        if (range === '30days')   return d >= today && d <= addDaysISO(today, 30);
        if (range === 'upcoming') return d >= today;
        if (range === 'custom')   return d >= customFrom && d <= customTo;
        return true;
      })
      .sort((a, b) => apptMs(a) - apptMs(b));
  }, [appointments, selRecipients, range, customFrom, customTo, today, curMonth]);

  async function handleShare() {
    if (format === 'ics') {
      const icsContent = generateICS(filteredFinal, recipients);
      const file = new File([icsContent], 'aiden-appointments.ics', { type: 'text/calendar' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'Aiden Appointments' }); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      // Fallback: download
      const url = URL.createObjectURL(new Blob([icsContent], { type: 'text/calendar' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'aiden-appointments.ics'; a.click();
      URL.revokeObjectURL(url);
    } else {
      const text = generateText(filteredFinal, recipients);
      if (navigator.share) {
        try { await navigator.share({ text, title: 'Aiden Appointments' }); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canNativeShare = isMobile && (navigator.share || navigator.canShare);

  const btnLabel = format === 'ics'
    ? (canNativeShare ? 'Share Calendar File' : 'Download .ics File')
    : (canNativeShare ? 'Share Text List' : (copied ? 'Copied!' : 'Copy to Clipboard'));

  const BtnIcon = format === 'ics'
    ? (canNativeShare ? Share2 : Download)
    : (copied ? Check : (canNativeShare ? Share2 : Copy));

  return (
    <Dialog.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop style={{ position: 'fixed', inset: 0, background: 'rgba(38,32,26,0.5)', zIndex: 500 }} />
        <Dialog.Popup style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 501 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.roseLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={16} color={C.roseDark} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: serif, color: C.text, margin: 0 }}>Share Calendar</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color={C.muted} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recipient selector */}
          <div>
            <p style={labelStyle}>Include appointments for</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {recipients.map(r => {
                const active = selRecipients.has(r.id);
                const col = rColor(r.id);
                return (
                  <button key={r.id} onClick={() => toggleRecipient(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? col : C.border}`, background: active ? col + '14' : 'white', color: active ? col : C.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: col + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: col }}>
                      {r.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    {r.nickname || r.name.split(' ')[0]}
                    {active && <Check size={12} color={col} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <p style={labelStyle}>Date range</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'month',    label: 'This month' },
                { id: '30days',   label: 'Next 30 days' },
                { id: 'upcoming', label: 'All upcoming' },
                { id: 'custom',   label: 'Custom range' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setRange(opt.id)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: `2px solid ${range === opt.id ? C.rose : C.border}`, background: range === opt.id ? C.roseLight : 'white', color: range === opt.id ? C.roseDark : C.muted, fontFamily: sans, fontSize: 13, fontWeight: range === opt.id ? 700 : 500, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {range === 'custom' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  style={{ flex: 1, background: '#f7f5f2', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: sans, color: C.text, outline: 'none' }} />
                <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  style={{ flex: 1, background: '#f7f5f2', border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', fontSize: 13, fontFamily: sans, color: C.text, outline: 'none' }} />
              </div>
            )}
          </div>

          {/* Format */}
          <div>
            <p style={labelStyle}>Share as</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setFormat('ics')}
                style={{ flex: 1, padding: '14px 12px', borderRadius: 14, border: `2px solid ${format === 'ics' ? C.rose : C.border}`, background: format === 'ics' ? C.roseLight : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                <Calendar size={22} color={format === 'ics' ? C.roseDark : C.muted} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: format === 'ics' ? C.roseDark : C.text, margin: 0, fontFamily: sans }}>Calendar file</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: '3px 0 0', fontFamily: sans }}>iOS Calendar &amp; Google Calendar</p>
                </div>
              </button>
              <button onClick={() => setFormat('text')}
                style={{ flex: 1, padding: '14px 12px', borderRadius: 14, border: `2px solid ${format === 'text' ? C.rose : C.border}`, background: format === 'text' ? C.roseLight : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                <Copy size={22} color={format === 'text' ? C.roseDark : C.muted} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: format === 'text' ? C.roseDark : C.text, margin: 0, fontFamily: sans }}>Text list</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: '3px 0 0', fontFamily: sans }}>Copy or send via text / email</p>
                </div>
              </button>
            </div>
          </div>

          {/* Summary count */}
          <div style={{ background: '#f7f5f2', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={16} color={C.muted} />
            <p style={{ fontSize: 13, color: C.muted, margin: 0, fontFamily: sans }}>
              {filteredFinal.length === 0
                ? 'No appointments match these filters'
                : `${filteredFinal.length} appointment${filteredFinal.length === 1 ? '' : 's'} will be shared`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 24px', position: 'sticky', bottom: 0, background: '#fff' }}>
          <button onClick={onClose}
            style={{ flex: 1, background: '#f0ece8', color: C.muted, border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleShare} disabled={filteredFinal.length === 0}
            style={{ flex: 2, background: filteredFinal.length > 0 ? `linear-gradient(135deg, ${C.rose}, ${C.roseDark})` : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, fontFamily: sans, cursor: filteredFinal.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <BtnIcon size={16} />
            {btnLabel}
          </button>
        </div>
      </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
