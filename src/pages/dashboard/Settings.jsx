import { useAccessibility, DEFAULT_SETTINGS } from '../../contexts/AccessibilityContext';
import { C, serif, sans } from '../../theme';
import { RotateCcw, Eye, Type, Zap, Info } from 'lucide-react';

// ── Reusable controls ──────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-label={label}
      style={{
        width: 44, height: 26, borderRadius: 13, padding: 0,
        background: value ? C.rose : '#d9d1cb',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.18s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 0.18s',
        display: 'block',
      }} />
    </button>
  );
}

function OptionGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '7px 16px', borderRadius: 20,
              border: `1.5px solid ${active ? C.roseDark : C.border}`,
              background: active ? C.roseLight : '#fff',
              color: active ? C.roseDark : C.muted,
              fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: 'pointer', fontFamily: sans,
              transition: 'all 0.12s',
            }}
          >
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
            {wcag && (
              <span style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, background: C.bgPage, borderRadius: 6, padding: '2px 7px', letterSpacing: 0.3, fontFamily: sans }}>
                WCAG {wcag}
              </span>
            )}
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

// ── Live preview ───────────────────────────────────────────────────────────────

function LivePreview() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.mutedLight, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: sans, marginBottom: 14 }}>Live preview</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0, fontFamily: serif }}>Dr. Sarah Patel — Cardiology</p>
        <p style={{ fontSize: 14, color: C.text, margin: 0, fontFamily: sans, lineHeight: 1.6 }}>
          Thursday, January 9, 2025 · 2:30 PM<br />
          Northwestern Memorial Hospital, Suite 404
        </p>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, fontFamily: sans, lineHeight: 1.65 }}>
          Follow-up appointment to review recent echocardiogram results and discuss medication adjustments. Bring insurance card and medication list.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span style={{ background: C.roseLight, color: C.roseDark, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: sans }}>Mom</span>
          <span style={{ background: '#eef3fb', color: C.primaryDark, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, fontFamily: sans }}>Cardiology</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const bgPage = '#f7f7f7';

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  const isDefault = JSON.stringify(settings) === JSON.stringify({
    ...DEFAULT_SETTINGS,
    reduceMotion: settings.reduceMotion, // OS pref may differ from static default
  }) && !settings.reduceMotion;

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 760, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: serif, color: C.text, margin: '0 0 6px' }}>Accessibility Settings</h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, fontFamily: sans, lineHeight: 1.6 }}>
          Customize Aiden's display to meet your visual, reading, and motor needs.
          Settings are saved locally and take effect immediately.
        </p>
      </div>

      {/* Live preview */}
      <LivePreview />

      {/* ── Text & Reading ───────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px 4px', marginBottom: 16 }}>
        <SectionHeader icon={Type} title="Text & Reading" subtitle="WCAG 1.4.4 · 1.4.8 · 1.4.12" />

        <SettingRow
          label="Text size"
          wcag="1.4.4"
          description="Scales all text and UI proportionally. Helps users who need larger type to read comfortably."
        >
          <OptionGroup
            value={settings.textScale}
            onChange={v => updateSetting('textScale', v)}
            options={[
              { value: '100', label: 'Default' },
              { value: '115', label: 'Large' },
              { value: '130', label: 'Larger' },
              { value: '150', label: 'Largest' },
            ]}
          />
        </SettingRow>

        <SettingRow
          label="Font style"
          wcag="1.4.8"
          description="Atkinson Hyperlegible is designed for low-vision readers. System fonts reduce custom rendering."
        >
          <OptionGroup
            value={settings.fontStyle}
            onChange={v => updateSetting('fontStyle', v)}
            options={[
              { value: 'default', label: 'Default (Inter + Ledger)' },
              { value: 'system',  label: 'System UI' },
              { value: 'atkinson', label: 'Atkinson Hyperlegible' },
            ]}
          />
        </SettingRow>

        <SettingRow
          label="Line spacing"
          wcag="1.4.8"
          description="Increased spacing between lines reduces visual crowding for dyslexia and low-vision users."
        >
          <OptionGroup
            value={settings.lineSpacing}
            onChange={v => updateSetting('lineSpacing', v)}
            options={[
              { value: 'default', label: 'Default' },
              { value: 'relaxed', label: 'Relaxed (1.85×)' },
              { value: 'wide',    label: 'Wide (2.2×)' },
            ]}
          />
        </SettingRow>

        <SettingRow
          label="Wide letter spacing"
          wcag="1.4.12"
          description="Increases spacing between characters and words to improve readability for some users."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle
              value={settings.letterSpacing}
              onChange={v => updateSetting('letterSpacing', v)}
              label="Wide letter spacing"
            />
            <span style={{ fontSize: 13, color: settings.letterSpacing ? C.text : C.muted, fontFamily: sans }}>
              {settings.letterSpacing ? 'On — wider character and word spacing' : 'Off'}
            </span>
          </div>
        </SettingRow>
      </div>

      {/* ── Color & Contrast ─────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px 4px', marginBottom: 16 }}>
        <SectionHeader icon={Eye} title="Color & Contrast" subtitle="WCAG 1.4.1 · 1.4.3 · 1.4.6" />

        <SettingRow
          label="Contrast level"
          wcag="1.4.3 / 1.4.6"
          description="High contrast (AA) boosts color saturation and contrast ratio to 4.5:1. Extra high (AAA) targets 7:1 for critical healthcare text."
        >
          <OptionGroup
            value={settings.contrastMode}
            onChange={v => updateSetting('contrastMode', v)}
            options={[
              { value: 'default',    label: 'Default' },
              { value: 'high',       label: 'High contrast (AA)' },
              { value: 'extra-high', label: 'Extra high (AAA)' },
            ]}
          />
        </SettingRow>

        <SettingRow
          label="Color vision"
          wcag="1.4.1"
          description="Simulates color vision deficiency to verify that information is not conveyed by color alone. Use to preview how Aiden appears to users with different color perception."
        >
          <OptionGroup
            value={settings.colorVision}
            onChange={v => updateSetting('colorVision', v)}
            options={[
              { value: 'default',      label: 'Default' },
              { value: 'protanopia',   label: 'Protanopia (red)' },
              { value: 'deuteranopia', label: 'Deuteranopia (green)' },
              { value: 'tritanopia',   label: 'Tritanopia (blue)' },
            ]}
          />
          {settings.colorVision !== 'default' && (
            <p style={{ fontSize: 11, color: C.muted, margin: '8px 0 0', fontFamily: sans, background: '#fffbf2', borderRadius: 8, padding: '8px 12px' }}>
              Color vision simulation is active. This is a preview mode — it does not affect other users.
            </p>
          )}
        </SettingRow>
      </div>

      {/* ── Motion & Focus ───────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px 24px 4px', marginBottom: 16 }}>
        <SectionHeader icon={Zap} title="Motion & Focus" subtitle="WCAG 2.1.1 · 2.3.3 · 2.4.7 · 2.4.11" />

        <SettingRow
          label="Reduce motion"
          wcag="2.3.3"
          description="Disables transitions and animations throughout Aiden. Recommended for users with vestibular disorders or motion sensitivity."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle
              value={settings.reduceMotion}
              onChange={v => updateSetting('reduceMotion', v)}
              label="Reduce motion"
            />
            <span style={{ fontSize: 13, color: settings.reduceMotion ? C.text : C.muted, fontFamily: sans }}>
              {settings.reduceMotion ? 'On — all transitions disabled' : 'Off'}
            </span>
          </div>
        </SettingRow>

        <SettingRow
          label="Enhanced focus indicators"
          wcag="2.4.7 / 2.4.11"
          description="Makes keyboard focus rings more visible with a prominent rose-colored outline and glow. Required for WCAG 2.1 AA compliance for keyboard-only users."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle
              value={settings.enhancedFocus}
              onChange={v => updateSetting('enhancedFocus', v)}
              label="Enhanced focus indicators"
            />
            <span style={{ fontSize: 13, color: settings.enhancedFocus ? C.text : C.muted, fontFamily: sans }}>
              {settings.enhancedFocus ? 'On — high-visibility focus rings active' : 'Off'}
            </span>
          </div>
        </SettingRow>
      </div>

      {/* ── WCAG info ────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
        <SectionHeader icon={Info} title="WCAG Reference" subtitle="Healthcare software compliance" />
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, margin: '0 0 14px', fontFamily: sans }}>
          Healthcare software should meet <strong style={{ color: C.text }}>WCAG 2.1 Level AA</strong> at minimum, with
          critical patient-facing content targeting <strong style={{ color: C.text }}>Level AAA</strong> (7:1 contrast).
          The settings above map to the following criteria:
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
              <span style={{ fontSize: 11, fontWeight: 700, color: C.roseDark, background: C.roseLight, borderRadius: 6, padding: '3px 7px', flexShrink: 0, marginTop: 1, fontFamily: sans }}>
                {id}
              </span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: sans }}>{name}</span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: sans }}> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={resetSettings}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 12,
            background: '#fff', border: `1.5px solid ${C.border}`,
            color: C.muted, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: sans,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.rose; e.currentTarget.style.color = C.roseDark; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          <RotateCcw size={14} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
