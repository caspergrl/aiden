export default function EmergencyBanner({ isCrisis, isPoisoning }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10,
      padding: '14px 18px', marginBottom: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🚨</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, margin: 0 }}>
            If this is an emergency, call 911 now.
          </p>
          {isCrisis && (
            <p style={{ color: '#7f1d1d', fontSize: 13, margin: 0 }}>
              If you or someone you know is in crisis, call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline) — available 24/7.
            </p>
          )}
          {isPoisoning && (
            <p style={{ color: '#7f1d1d', fontSize: 13, margin: 0 }}>
              For poisoning or overdose, call Poison Control: <strong>1-800-222-1222</strong>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
