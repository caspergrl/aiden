import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { C, serif } from '../theme';

export default function PublicMeds() {
  const { token } = useParams();
  const [data, setData] = useState(null);   // null = loading, false = not found
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setData(false); return; }
    const db = getFirestore();
    getDoc(doc(db, 'shareLinks', token))
      .then(snap => {
        if (!snap.exists()) { setData(false); return; }
        setData(snap.data());
      })
      .catch(() => setError('Could not load this link.'));
  }, [token]);

  if (data === null && !error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf8f5' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #ebe2d8', borderTopColor: '#c85c55', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (data === false || error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#faf8f5', flexDirection: 'column', gap: 12, padding: 32 }}>
        <p style={{ fontFamily: serif, fontSize: 22, color: C.text }}>Link not found</p>
        <p style={{ fontSize: 14, color: C.muted, textAlign: 'center' }}>{error || 'This link has expired or is invalid.'}</p>
      </div>
    );
  }

  const name = data.recipientNickname || data.recipientName?.split(' ')[0] || 'Patient';
  const meds = data.medications || [];

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Medications List</p>
            <h1 style={{ fontFamily: serif, fontSize: 28, color: C.text }}>{name}</h1>
            {data.createdAt && (
              <p style={{ fontSize: 12, color: C.mutedLight, marginTop: 4 }}>
                Generated {new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <button onClick={() => window.print()}
            style={{ background: C.roseDark, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Print
          </button>
        </div>

        {meds.length === 0 ? (
          <p style={{ fontSize: 14, color: C.mutedLight }}>No medications recorded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meds.map((m, i) => {
              const name = typeof m === 'string' ? m : m.name;
              const dosage = typeof m === 'string' ? '' : m.dosage;
              const frequency = typeof m === 'string' ? '' : m.frequency;
              const instructions = typeof m === 'string' ? '' : m.instructions;
              return (
                <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: dosage || frequency || instructions ? 6 : 0 }}>{name}</p>
                  {(dosage || frequency) && (
                    <p style={{ fontSize: 13, color: C.muted }}>
                      {[dosage, frequency].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {instructions && <p style={{ fontSize: 13, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{instructions}</p>}
                </div>
              );
            })}
          </div>
        )}

        <p style={{ fontSize: 11, color: C.mutedLight, marginTop: 32, textAlign: 'center' }}>
          Shared via Aiden · aidencare.co
        </p>
      </div>
      <style>{`@media print { button { display: none !important; } }`}</style>
    </div>
  );
}
