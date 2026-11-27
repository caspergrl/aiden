import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';
import { Calendar, Activity, RefreshCw, Unlink, RotateCcw, Eye, Type, Zap, Info } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../App';
import { gcalClientId, gcalTokenKey, startGoogleCalendarOAuth, refreshGCalToken, fetchGCalEvents } from '../../gcal';
import { epicClientId, epicAccountKey, startEpicOAuth, refreshEpicToken, fetchEpicAppointments, epicAppointmentToAiden } from '../../epic';
import { saveTokens, loadTokens, clearTokens } from '../../secureTokens';
import { useAccessibility, DEFAULT_SETTINGS } from '../../contexts/AccessibilityContext';
import { C, serif, sans } from '../../theme';

// ── Tab bar ────────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'integrations', label: 'Integrations' },
    { id: 'accessibility', label: 'Accessibility' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: active === t.id ? 700 : 500,
            color: active === t.id ? C.text : C.muted,
            borderBottom: active === t.id ? `2px solid ${C.roseDark}` : '2px solid transparent',
            marginBottom: -1, borderRadius: 0, transition: 'color 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Integrations tab ───────────────────────────────────────────────────────────

function IntegrationsTab() {
  const { user } = useAuth();

  const [connStatus,     setConnStatus]     = useState({});
  const [connLoading,    setConnLoading]    = useState(false);
  const [gcalError,      setGcalError]      = useState('');
  const [gcalSyncing,    setGcalSyncing]    = useState({});
  const [gcalExchanging, setGcalExchanging] = useState(false);
  const [epicError,      setEpicError]      = useState('');
  const [epicSyncing,    setEpicSyncing]    = useState({});
  const [epicExchanging, setEpicExchanging] = useState(false);

  // Load connection metadata from Firestore
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'connections', 'status')).then(snap => {
      if (snap.exists()) setConnStatus(snap.data());
    });
  }, [user]);

  // Handle OAuth callback — Google/Epic redirect back to /account, which then navigates to /settings
  // The URL may carry ?connected=gcal or ?connected=epic after exchange
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      window.history.replaceState({}, '', window.location.pathname);
      // Reload connection status after redirect
      if (user) {
        getDoc(doc(db, 'users', user.uid, 'connections', 'status')).then(snap => {
          if (snap.exists()) setConnStatus(snap.data());
        });
      }
    }
  }, [user]);

  const gcalAccounts = Object.entries(connStatus.googleCalendars || {})
    .map(([key, meta]) => ({ key, ...meta }))
    .sort((a, b) => (a.connectedAt || 0) - (b.connectedAt || 0));

  const epicAccounts = Object.entries(connStatus.epicAccounts || {})
    .map(([key, meta]) => ({ key, ...meta }))
    .sort((a, b) => (a.connectedAt || 0) - (b.connectedAt || 0));

  async function handleConnectGoogleCalendar() {
    if (!gcalClientId()) {
      setGcalError('Google Calendar client ID not configured — add VITE_GOOGLE_CALENDAR_CLIENT_ID to .env');
      return;
    }
    setGcalError('');
    await startGoogleCalendarOAuth();
  }

  async function handleDisconnectGoogleCalendar(key) {
    setConnLoading(true);
    try {
      await clearTokens(key);
      const updated = { ...(connStatus.googleCalendars || {}) };
      delete updated[key];
      await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), { googleCalendars: updated }, { merge: true });
      setConnStatus(p => {
        const cals = { ...(p.googleCalendars || {}) };
        delete cals[key];
        return { ...p, googleCalendars: cals };
      });
    } catch { setGcalError('Could not disconnect — try again.'); }
    setConnLoading(false);
  }

  async function handleSyncGoogleCalendar(key, email) {
    setGcalSyncing(p => ({ ...p, [key]: true })); setGcalError('');
    try {
      const stored = await loadTokens(key);
      if (!stored?.accessToken) throw new Error('Not connected — please reconnect Google Calendar.');
      let { accessToken, refreshToken, expiresAt } = stored;
      if (Date.now() > (expiresAt || 0) - 60_000) {
        const refreshed = await refreshGCalToken(refreshToken);
        if (!refreshed.access_token) throw new Error('Session expired — please reconnect Google Calendar.');
        accessToken = refreshed.access_token;
        expiresAt   = Date.now() + (refreshed.expires_in || 3600) * 1000;
        await saveTokens(key, { accessToken, refreshToken, expiresAt });
      }
      const events = await fetchGCalEvents(accessToken, email);
      const meta = { email, connectedAt: connStatus.googleCalendars?.[key]?.connectedAt || Date.now(), lastSync: Date.now(), eventCount: events.length };
      await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), { googleCalendars: { [key]: meta } }, { merge: true });
      setConnStatus(p => ({ ...p, googleCalendars: { ...(p.googleCalendars || {}), [key]: meta } }));
    } catch (e) { setGcalError(e.message || 'Sync failed — try reconnecting.'); }
    setGcalSyncing(p => ({ ...p, [key]: false }));
  }

  async function handleConnectEpic() {
    if (!epicClientId()) {
      setEpicError('Epic client ID not configured — add VITE_EPIC_CLIENT_ID to .env');
      return;
    }
    setEpicError('');
    await startEpicOAuth();
  }

  async function handleDisconnectEpic(key) {
    setConnLoading(true);
    try {
      await clearTokens(key);
      const snap  = await getDocs(query(collection(db, 'users', user.uid, 'appointments'), where('epicKey', '==', key)));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      const updated = { ...(connStatus.epicAccounts || {}) };
      delete updated[key];
      await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), { epicAccounts: updated }, { merge: true });
      setConnStatus(p => {
        const accs = { ...(p.epicAccounts || {}) };
        delete accs[key];
        return { ...p, epicAccounts: accs };
      });
    } catch { setEpicError('Could not disconnect Epic — try again.'); }
    setConnLoading(false);
  }

  async function handleSyncEpic(key, patientId) {
    setEpicSyncing(p => ({ ...p, [key]: true })); setEpicError('');
    try {
      const stored = await loadTokens(key);
      if (!stored?.accessToken) throw new Error('Not connected — please reconnect Epic.');
      let { accessToken, refreshToken, expiresAt } = stored;
      if (Date.now() > (expiresAt || 0) - 60_000) {
        const refreshed = await refreshEpicToken(refreshToken);
        if (!refreshed.access_token) throw new Error('Session expired — please reconnect Epic.');
        accessToken = refreshed.access_token;
        expiresAt   = Date.now() + (refreshed.expires_in || 3600) * 1000;
        await saveTokens(key, { accessToken, refreshToken, expiresAt, patientId });
      }
      const resources = await fetchEpicAppointments(accessToken, patientId);
      const aidenAppts = resources
        .filter(r => ['booked', 'arrived', 'fulfilled'].includes(r.status))
        .map(r => ({ ...epicAppointmentToAiden(r), epicKey: key }));
      const existingSnap = await getDocs(query(collection(db, 'users', user.uid, 'appointments'), where('epicKey', '==', key)));
      const batch = writeBatch(db);
      existingSnap.docs.forEach(d => batch.delete(d.ref));
      aidenAppts.forEach(appt => batch.set(doc(collection(db, 'users', user.uid, 'appointments')), appt));
      await batch.commit();
      const meta = { connectedAt: connStatus.epicAccounts?.[key]?.connectedAt || Date.now(), lastSync: Date.now(), appointmentCount: aidenAppts.length, patientId };
      await setDoc(doc(db, 'users', user.uid, 'connections', 'status'), { epicAccounts: { [key]: meta } }, { merge: true });
      setConnStatus(p => ({ ...p, epicAccounts: { ...(p.epicAccounts || {}), [key]: meta } }));
    } catch (e) { setEpicError(e.message || 'Epic sync failed — try reconnecting.'); }
    setEpicSyncing(p => ({ ...p, [key]: false }));
  }

  const cardStyle = { background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: '22px 22px', marginBottom: 16 };

  return (
    <div>
      {/* Google Calendar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Calendar size={17} color={C.primary} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>Google Calendar</h2>
          {gcalAccounts.length > 0 && (
            <span style={{ marginLeft: 'auto', background: '#f0f7f4', color: '#3a6e58', border: '1px solid #8ab5a040', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
              {gcalAccounts.length === 1 ? 'Connected' : `${gcalAccounts.length} accounts`}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.65 }}>
          Pull upcoming events from your Google Calendar into Aiden. You stay in control — nothing is written back.
        </p>

        {gcalExchanging && (
          <div style={{ background: '#f0f7f4', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: '#3a6e58' }}>
            Connecting your Google account…
          </div>
        )}
        {gcalError && <p style={{ fontSize: 13, color: C.coral, marginBottom: 12 }}>{gcalError}</p>}

        {gcalAccounts.map(({ key, email, lastSync, eventCount }) => (
          <div key={key} style={{ background: C.bgWarm, borderRadius: 12, padding: '12px 14px', marginBottom: 10, border: `1px solid ${C.border}` }}>
            <div style={{ minWidth: 0, marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email || 'Google Account'}
              </p>
              {lastSync && (
                <p style={{ fontSize: 12, color: C.mutedLight, margin: '3px 0 0' }}>
                  Synced {new Date(lastSync).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {eventCount != null && ` · ${eventCount} events`}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleSyncGoogleCalendar(key, email)} disabled={!!gcalSyncing[key]}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 0', fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', opacity: gcalSyncing[key] ? 0.6 : 1 }}>
                <RefreshCw size={13} /> {gcalSyncing[key] ? 'Syncing…' : 'Sync now'}
              </button>
              <button onClick={() => handleDisconnectGoogleCalendar(key)} disabled={connLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 14px', fontSize: 13, color: C.muted, cursor: 'pointer' }}>
                <Unlink size={13} /> Disconnect
              </button>
            </div>
          </div>
        ))}

        <button onClick={handleConnectGoogleCalendar}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#444', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: gcalAccounts.length ? 4 : 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>G</span>
          {gcalAccounts.length ? 'Add another account' : 'Connect with Google'}
        </button>
      </div>

      {/* Epic Health Records */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Activity size={17} color={C.primary} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>Epic Health Records</h2>
          {epicAccounts.length > 0 && (
            <span style={{ marginLeft: 'auto', background: '#f0f7f4', color: '#3a6e58', border: '1px solid #8ab5a040', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
              {epicAccounts.length === 1 ? 'Connected' : `${epicAccounts.length} accounts`}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.65 }}>
          Pull upcoming appointments from your Epic MyChart accounts into Aiden. Nothing is written back.
        </p>

        {epicExchanging && (
          <div style={{ background: '#f0f7f4', borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: '#3a6e58' }}>
            Connecting your Epic account…
          </div>
        )}
        {epicError && <p style={{ fontSize: 13, color: C.coral, marginBottom: 12 }}>{epicError}</p>}

        {epicAccounts.map(({ key, patientId, lastSync, appointmentCount }) => (
          <div key={key} style={{ background: C.bgWarm, borderRadius: 12, padding: '12px 14px', marginBottom: 10, border: `1px solid ${C.border}` }}>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Epic MyChart</p>
              <p style={{ fontSize: 12, color: C.mutedLight, margin: '2px 0 0' }}>
                {lastSync
                  ? <>Synced {new Date(lastSync).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{appointmentCount != null && ` · ${appointmentCount} appointments`}</>
                  : 'Connected — click Sync to import appointments'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleSyncEpic(key, patientId)} disabled={!!epicSyncing[key]}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 0', fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', opacity: epicSyncing[key] ? 0.6 : 1 }}>
                <RefreshCw size={13} /> {epicSyncing[key] ? 'Syncing…' : 'Sync now'}
              </button>
              <button onClick={() => handleDisconnectEpic(key)} disabled={connLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 14px', fontSize: 13, color: C.muted, cursor: 'pointer' }}>
                <Unlink size={13} /> Disconnect
              </button>
            </div>
          </div>
        ))}

        <button onClick={handleConnectEpic}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#444', border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: epicAccounts.length ? 4 : 0 }}>
          <Activity size={15} color="#c06060" /> {epicAccounts.length ? 'Add another Epic account' : 'Connect with Epic MyChart'}
        </button>
      </div>
    </div>
  );
}

// ── Accessibility tab (unchanged controls) ─────────────────────────────────────

function Toggle({ value, onChange, label }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value} aria-label={label}
      style={{ width: 44, height: 26, borderRadius: 13, padding: 0, background: value ? C.rose : '#d9d1cb', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.18s', display: 'block' }} />
    </button>
  );
}

function OptionGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${active ? C.roseDark : C.border}`, background: active ? C.roseLight : '#fff', color: active ? C.roseDark : C.muted, fontSize: 13, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: sans, transition: 'all 0.12s' }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SettingRow({ label, wcag, description, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: sans }}>{label}</span>
            {wcag && <span style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, background: C.bgPage, borderRadius: 6, padding: '2px 7px', letterSpacing: 0.3, fontFamily: sans }}>WCAG {wcag}</span>}
          </div>
          {description && <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.55, fontFamily: sans }}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.roseLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={C.roseDark} />
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0, fontFamily: serif }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: C.muted, margin: 0, fontFamily: sans }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function LivePreview() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: sans, marginBottom: 14 }}>Live preview</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0, fontFamily: serif }}>Dr. Sarah Patel — Cardiology</p>
        <p style={{ fontSize: 14, color: C.text, margin: 0, fontFamily: sans, lineHeight: 1.6 }}>Thursday, January 9, 2025 · 2:30 PM<br />Northwestern Memorial Hospital, Suite 404</p>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, fontFamily: sans, lineHeight: 1.65 }}>Follow-up appointment to review recent echocardiogram results and discuss medication adjustments. Bring insurance card and medication list.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span style={{ background: C.roseLight, color: C.roseDark, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: sans }}>Mom</span>
          <span style={{ background: '#eef3fb', color: C.primaryDark, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: sans }}>Cardiology</span>
        </div>
      </div>
    </div>
  );
}

function AccessibilityTab() {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  const isDefault = JSON.stringify(settings) === JSON.stringify({
    ...DEFAULT_SETTINGS,
    reduceMotion: settings.reduceMotion,
  }) && !settings.reduceMotion;

  return (
    <div>
      <LivePreview />

      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px 4px', marginBottom: 16 }}>
        <SectionHeader icon={Type} title="Text & Reading" subtitle="WCAG 1.4.4 · 1.4.8 · 1.4.12" />
        <SettingRow label="Text size" wcag="1.4.4" description="Scales all text and UI proportionally.">
          <OptionGroup value={settings.textScale} onChange={v => updateSetting('textScale', v)}
            options={[{ value: '100', label: 'Default' }, { value: '115', label: 'Large' }, { value: '130', label: 'Larger' }, { value: '150', label: 'Largest' }]} />
        </SettingRow>
        <SettingRow label="Font style" wcag="1.4.8" description="Atkinson Hyperlegible is designed for low-vision readers.">
          <OptionGroup value={settings.fontStyle} onChange={v => updateSetting('fontStyle', v)}
            options={[{ value: 'default', label: 'Default (Inter + Ledger)' }, { value: 'system', label: 'System UI' }, { value: 'atkinson', label: 'Atkinson Hyperlegible' }]} />
        </SettingRow>
        <SettingRow label="Line spacing" wcag="1.4.8" description="Increased spacing reduces visual crowding.">
          <OptionGroup value={settings.lineSpacing} onChange={v => updateSetting('lineSpacing', v)}
            options={[{ value: 'default', label: 'Default' }, { value: 'relaxed', label: 'Relaxed (1.85×)' }, { value: 'wide', label: 'Wide (2.2×)' }]} />
        </SettingRow>
        <SettingRow label="Wide letter spacing" wcag="1.4.12" description="Increases spacing between characters and words.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle value={settings.letterSpacing} onChange={v => updateSetting('letterSpacing', v)} label="Wide letter spacing" />
            <span style={{ fontSize: 13, color: settings.letterSpacing ? C.text : C.muted, fontFamily: sans }}>
              {settings.letterSpacing ? 'On — wider character and word spacing' : 'Off'}
            </span>
          </div>
        </SettingRow>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px 4px', marginBottom: 16 }}>
        <SectionHeader icon={Eye} title="Color & Contrast" subtitle="WCAG 1.4.1 · 1.4.3 · 1.4.6" />
        <SettingRow label="Contrast level" wcag="1.4.3 / 1.4.6" description="High contrast boosts color saturation and contrast ratio to 4.5:1.">
          <OptionGroup value={settings.contrastMode} onChange={v => updateSetting('contrastMode', v)}
            options={[{ value: 'default', label: 'Default' }, { value: 'high', label: 'High contrast (AA)' }, { value: 'extra-high', label: 'Extra high (AAA)' }]} />
        </SettingRow>
        <SettingRow label="Color vision" wcag="1.4.1" description="Simulates color vision deficiency to verify information is not conveyed by color alone.">
          <OptionGroup value={settings.colorVision} onChange={v => updateSetting('colorVision', v)}
            options={[{ value: 'default', label: 'Default' }, { value: 'protanopia', label: 'Protanopia (red)' }, { value: 'deuteranopia', label: 'Deuteranopia (green)' }, { value: 'tritanopia', label: 'Tritanopia (blue)' }]} />
          {settings.colorVision !== 'default' && (
            <p style={{ fontSize: 11, color: C.muted, margin: '8px 0 0', fontFamily: sans, background: '#fffbf2', borderRadius: 8, padding: '8px 12px' }}>
              Color vision simulation is active. This is a preview mode — it does not affect other users.
            </p>
          )}
        </SettingRow>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px 4px', marginBottom: 16 }}>
        <SectionHeader icon={Zap} title="Motion & Focus" subtitle="WCAG 2.1.1 · 2.3.3 · 2.4.7 · 2.4.11" />
        <SettingRow label="Reduce motion" wcag="2.3.3" description="Disables transitions and animations throughout Aiden.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle value={settings.reduceMotion} onChange={v => updateSetting('reduceMotion', v)} label="Reduce motion" />
            <span style={{ fontSize: 13, color: settings.reduceMotion ? C.text : C.muted, fontFamily: sans }}>
              {settings.reduceMotion ? 'On — all transitions disabled' : 'Off'}
            </span>
          </div>
        </SettingRow>
        <SettingRow label="Enhanced focus indicators" wcag="2.4.7 / 2.4.11" description="Makes keyboard focus rings more visible with a prominent rose-colored outline.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle value={settings.enhancedFocus} onChange={v => updateSetting('enhancedFocus', v)} label="Enhanced focus indicators" />
            <span style={{ fontSize: 13, color: settings.enhancedFocus ? C.text : C.muted, fontFamily: sans }}>
              {settings.enhancedFocus ? 'On — high-visibility focus rings active' : 'Off'}
            </span>
          </div>
        </SettingRow>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
        <SectionHeader icon={Info} title="WCAG Reference" subtitle="Healthcare software compliance" />
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, margin: '0 0 14px', fontFamily: sans }}>
          Healthcare software should meet <strong style={{ color: C.text }}>WCAG 2.1 Level AA</strong> at minimum, with
          critical patient-facing content targeting <strong style={{ color: C.text }}>Level AAA</strong> (7:1 contrast).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['1.4.1', 'Use of Color', 'Information is not conveyed by color alone'],
            ['1.4.3', 'Contrast (Minimum)', 'Text has at least 4.5:1 contrast ratio (AA)'],
            ['1.4.4', 'Resize Text', 'Text can be resized up to 200% without assistive technology'],
            ['1.4.6', 'Contrast (Enhanced)', 'Text has at least 7:1 contrast ratio (AAA)'],
            ['1.4.8', 'Visual Presentation', 'Foreground/background colors choosable, line spacing adjustable'],
            ['1.4.12', 'Text Spacing', 'Letter, word, and line spacing can be overridden'],
            ['2.1.1', 'Keyboard', 'All functionality is operable via keyboard'],
            ['2.3.3', 'Animation from Interactions', 'Motion animations can be disabled'],
            ['2.4.7', 'Focus Visible', 'Keyboard focus indicator is visible'],
            ['2.4.11', 'Focus Appearance', 'Focus indicator has sufficient size and contrast (WCAG 2.2)'],
          ].map(([id, name, desc]) => (
            <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.roseDark, background: C.roseLight, borderRadius: 6, padding: '3px 7px', flexShrink: 0, marginTop: 1, fontFamily: sans }}>{id}</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: sans }}>{name}</span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: sans }}> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={resetSettings}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12, background: '#fff', border: `1.5px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.rose; e.currentTarget.style.color = C.roseDark; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
          <RotateCcw size={14} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState('integrations');

  return (
    <div className="page-body" style={{ paddingBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: serif, color: C.text, margin: '0 0 4px' }}>Settings</h1>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'integrations' && <IntegrationsTab />}
      {activeTab === 'accessibility' && <AccessibilityTab />}
    </div>
  );
}
