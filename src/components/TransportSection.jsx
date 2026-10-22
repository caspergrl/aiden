import { useState } from 'react';
import { Car, Mail, MessageSquare, Copy, Check, Plus, X } from 'lucide-react';
import { C } from '../theme';

export const MOBILITY_OPTIONS = [
  { value: 'none',       label: 'No special requirements' },
  { value: 'walker',     label: 'Uses a walker or cane' },
  { value: 'wheelchair', label: 'Requires wheelchair-accessible vehicle' },
  { value: 'companion',  label: 'Needs a companion during travel' },
];

export const TRANSPORT_SERVICES = {
  none: [
    { name: 'Uber',            desc: 'Book a ride on demand or schedule in advance.',                url: 'https://www.uber.com',                               cta: 'Open Uber' },
    { name: 'Lyft',            desc: 'Schedule rides up to 7 days ahead.',                          url: 'https://www.lyft.com',                               cta: 'Open Lyft' },
    { name: 'GoGoGrandparent', desc: 'Rideshare by phone — no smartphone required. 1-855-464-6872.', url: 'https://gogograndparent.com',                        cta: 'Learn more' },
  ],
  walker: [
    { name: 'Uber',            desc: 'Standard rideshare — can accommodate a folded walker.',       url: 'https://www.uber.com',                               cta: 'Open Uber' },
    { name: 'Lyft',            desc: 'Standard rideshare — schedule in advance.',                   url: 'https://www.lyft.com',                               cta: 'Open Lyft' },
    { name: 'GoGoGrandparent', desc: 'Phone-based rideshare — 1-855-464-6872.',                     url: 'https://gogograndparent.com',                        cta: 'Learn more' },
    { name: 'NEMT',            desc: 'Non-emergency medical transport — often covered by Medicare/Medicaid.', url: 'https://www.nadtc.org/resources/',            cta: 'Find providers' },
  ],
  wheelchair: [
    { name: 'Uber WAV',          desc: 'Wheelchair-accessible vehicles via Uber.',                  url: 'https://www.uber.com/us/en/ride/uberwav/',           cta: 'Book Uber WAV' },
    { name: 'Lyft Wheelchair',   desc: 'Wheelchair-accessible vehicles via Lyft.',                  url: 'https://www.lyft.com/accessibility',                 cta: 'Book Lyft WAV' },
    { name: 'NEMT',              desc: 'Medical transport — often covered by Medicare/Medicaid.',   url: 'https://www.nadtc.org/resources/',                   cta: 'Find providers' },
    { name: 'Local paratransit', desc: 'ADA paratransit — contact your local transit agency or dial 211.', url: 'https://www.nadtc.org/about/what-is-transportation/', cta: 'Learn more' },
  ],
  companion: [
    { name: 'GoGoGrandparent',   desc: 'Supports companion travel — 1-855-464-6872.',              url: 'https://gogograndparent.com',                        cta: 'Learn more' },
    { name: 'NEMT',              desc: 'Medical transport with companion seating available.',        url: 'https://www.nadtc.org/resources/',                   cta: 'Find providers' },
    { name: 'Eldercare Locator', desc: 'Find local senior transport services — 1-800-677-1116.',    url: 'https://eldercare.acl.gov',                          cta: 'Search services' },
  ],
};

export function detectMobility(conditions = []) {
  const c = conditions.map(s => s.toLowerCase()).join(' ');
  if (/wheelchair|cerebral palsy|multiple sclerosis|paraplegia|amputat/.test(c)) return 'wheelchair';
  if (/alzheimer|dementia|down syndrome|cognitive|memory/.test(c)) return 'companion';
  if (/parkinson|stroke|arthritis|osteo|hip fracture|walker|cane|fall risk/.test(c)) return 'walker';
  return 'none';
}

// { needed, mobilityNeeds, notes, customProvider: null | { name, contact } }
export const EMPTY_TRANSPORT = { needed: false, mobilityNeeds: 'none', notes: '', customProvider: null };

const inp = {
  width: '100%', background: '#fff', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.text,
  outline: 'none', boxSizing: 'border-box',
};

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function isPhone(v) { return /^\+?[\d\s\-().]{7,}$/.test(v.trim()); }
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function fmtDate(ds) {
  if (!ds) return '';
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function buildTransportMessage({ apptDetails, transport }) {
  if (!apptDetails) return '';
  const providerName = transport.customProvider?.name || 'Transportation Provider';
  const mobilityLabel = MOBILITY_OPTIONS.find(m => m.value === transport.mobilityNeeds)?.label;
  const lines = [
    `Hi ${providerName},`,
    '',
    `I'm arranging transportation for the following medical appointment and would like to confirm availability.`,
    '',
  ];
  if (apptDetails.recipientName) lines.push(`Patient: ${apptDetails.recipientName}`);
  lines.push(`Appointment: ${apptDetails.title || 'Appointment'}`);
  if (apptDetails.date) lines.push(`Date: ${fmtDate(apptDetails.date)}`);
  if (apptDetails.time) lines.push(`Time: ${apptDetails.time}`);
  if (apptDetails.location) lines.push(`Location: ${apptDetails.location}`);
  if (apptDetails.doctor) lines.push(`Doctor / Provider: ${apptDetails.doctor}`);
  if (mobilityLabel && transport.mobilityNeeds !== 'none') lines.push(`Mobility requirements: ${mobilityLabel}`);
  if (transport.notes) lines.push(`Notes: ${transport.notes}`);
  lines.push('', 'Please confirm this booking at your earliest convenience.', '', 'Sent via Aiden');
  return lines.join('\n');
}

// ─── Send panel (shown inside custom provider when contact is filled) ─────────
function SendPanel({ transport, apptDetails }) {
  const [copied, setCopied] = useState(false);
  const contact = transport.customProvider?.contact?.trim() || '';
  const msg     = buildTransportMessage({ apptDetails, transport });
  const subject = encodeURIComponent(`Transportation Request: ${apptDetails?.title || 'Appointment'}`);
  const body    = encodeURIComponent(msg);
  const useEmail = isEmail(contact);
  const usePhone = isPhone(contact) && !useEmail;

  function handleCopy() {
    navigator.clipboard?.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Appointment details to send</p>
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10, fontSize: 12, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
        {msg}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {useEmail && (
          <a href={`mailto:${contact}?subject=${subject}&body=${body}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#eef3fb', borderRadius: 10, textDecoration: 'none', color: '#3060a0', fontSize: 13, fontWeight: 700 }}>
            <Mail size={13} /> Send email
          </a>
        )}
        {usePhone && isMobile && (
          <a href={`sms:${contact.replace(/\s/g, '')}?&body=${body}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#eef6f1', borderRadius: 10, textDecoration: 'none', color: '#3a6e58', fontSize: 13, fontWeight: 700 }}>
            <MessageSquare size={13} /> Send text
          </a>
        )}
        {!useEmail && !(usePhone && isMobile) && contact && (
          <p style={{ fontSize: 12, color: C.coral, flex: 1 }}>
            {usePhone ? 'Open on a mobile device to send a text.' : 'Enter a valid email or phone number to send.'}
          </p>
        )}
        <button onClick={handleCopy}
          style={{ flex: useEmail || usePhone ? '0 0 auto' : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', background: copied ? '#eef6f1' : '#fff', border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: copied ? '#3a6e58' : C.muted }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
// apptDetails: optional { title, date, time, location, doctor, recipientName }
// When provided, enables send-to-provider functionality for custom providers.
export default function TransportSection({ transport, onChange, conditions = [], apptDetails }) {
  const suggested = detectMobility(conditions);
  const services  = TRANSPORT_SERVICES[transport.mobilityNeeds] || TRANSPORT_SERVICES.none;
  const cp        = transport.customProvider;

  function setCP(patch) {
    onChange({ ...transport, customProvider: { ...(cp || { name: '', contact: '' }), ...patch } });
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', background: '#f9f7f5' }}>
      {/* Yes / No toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: transport.needed ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={14} color={C.muted} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Transportation</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(transport.needed ? EMPTY_TRANSPORT : { needed: true, mobilityNeeds: suggested, notes: '', customProvider: null })}
          style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', padding: 0 }}
        >
          {['No', 'Yes'].map(opt => {
            const isActive = opt === 'Yes' ? transport.needed : !transport.needed;
            return (
              <span key={opt} style={{ padding: '5px 14px', fontSize: 12, fontWeight: 700, background: isActive ? C.roseDark : '#fff', color: isActive ? '#fff' : C.muted, transition: 'all 0.15s', display: 'block' }}>
                {opt}
              </span>
            );
          })}
        </button>
      </div>

      {transport.needed && (
        <>
          {/* Mobility needs */}
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Mobility needs</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {MOBILITY_OPTIONS.map(opt => {
              const active = transport.mobilityNeeds === opt.value;
              return (
                <button key={opt.value} type="button"
                  onClick={() => onChange({ ...transport, mobilityNeeds: opt.value })}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${active ? C.roseDark : C.border}`, background: active ? '#fdf0ef' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? C.roseDark : C.border}`, background: active ? C.roseDark : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: active ? 700 : 400 }}>{opt.label}</span>
                  {opt.value === suggested && !active && (
                    <span style={{ fontSize: 10, color: C.muted, background: C.border, borderRadius: 6, padding: '1px 6px', marginLeft: 'auto' }}>suggested</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Suggested services */}
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Transport options</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {services.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.name}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{s.desc}</p>
                </div>
                <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: C.primary, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 12 }}>{s.cta} →</a>
              </div>
            ))}
          </div>

          {/* Notes */}
          <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Notes</p>
          <input
            value={transport.notes}
            onChange={e => onChange({ ...transport, notes: e.target.value })}
            placeholder="e.g. Needs 30 min notice, pick-up from main entrance"
            style={{ ...inp, marginBottom: 14 }}
          />

          {/* Custom provider */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cp ? 12 : 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase' }}>Your own provider</p>
              {cp ? (
                <button type="button" onClick={() => onChange({ ...transport, customProvider: null })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <X size={12} /> Remove
                </button>
              ) : (
                <button type="button" onClick={() => onChange({ ...transport, customProvider: { name: '', contact: '' } })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.muted }}>
                  <Plus size={11} /> Add provider
                </button>
              )}
            </div>

            {cp && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Provider name</p>
                    <input
                      value={cp.name}
                      onChange={e => setCP({ name: e.target.value })}
                      placeholder="e.g. City Medical Transport, Bob's Rides"
                      style={inp}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Email or phone number</p>
                    <input
                      value={cp.contact}
                      onChange={e => setCP({ contact: e.target.value })}
                      placeholder="dispatch@transport.com or (555) 200-1000"
                      style={inp}
                    />
                  </div>
                </div>
                {apptDetails && cp.contact?.trim() && (
                  <SendPanel transport={transport} apptDetails={apptDetails} />
                )}
                {apptDetails && !cp.contact?.trim() && (
                  <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 10 }}>Add an email or phone number to send appointment details to this provider.</p>
                )}
                {!apptDetails && (
                  <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 10 }}>Save the appointment first, then open it to send details to this provider.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
