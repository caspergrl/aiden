import { createContext, useContext, useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'aiden_a11y_v1';

export const DEFAULT_SETTINGS = {
  textScale:      '100',    // '100' | '115' | '130' | '150'
  contrastMode:   'default', // 'default' | 'high' | 'extra-high'
  colorVision:    'default', // 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  fontStyle:      'default', // 'default' | 'system' | 'atkinson'
  lineSpacing:    'default', // 'default' | 'relaxed' | 'wide'
  letterSpacing:  false,
  reduceMotion:   false,
  enhancedFocus:  false,
};

// Published color-matrix values for color vision deficiency simulation
const CVD = {
  protanopia:   '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
  deuteranopia: '0.625 0.375 0 0 0  0.700 0.300 0 0 0  0 0.300 0.700 0 0  0 0 0 1 0',
  tritanopia:   '0.950 0.050 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
};

function buildCSS(s) {
  const parts = [];

  // Combined filter — order matters: CVD simulation first, then contrast boost
  const filters = [];
  if (s.colorVision !== 'default') filters.push(`url(#a11y-cvd-${s.colorVision})`);
  if (s.contrastMode === 'high')       filters.push('contrast(1.5) saturate(1.1)');
  if (s.contrastMode === 'extra-high') filters.push('contrast(1.9) saturate(0.8)');
  if (filters.length) parts.push(`html { filter: ${filters.join(' ')} !important; }`);

  // Text scale via zoom (scales all content including fixed elements)
  if (s.textScale !== '100') {
    const zoom = (parseInt(s.textScale, 10) / 100).toFixed(2);
    parts.push(`html { zoom: ${zoom}; }`);
  }

  // Font override
  if (s.fontStyle === 'system') {
    parts.push(`*, *::before, *::after { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important; }`);
  } else if (s.fontStyle === 'atkinson') {
    parts.push(`*, *::before, *::after { font-family: 'Atkinson Hyperlegible', sans-serif !important; }`);
  }

  // Line spacing — scoped to text-bearing elements (inherits don't override inline)
  if (s.lineSpacing === 'relaxed') {
    parts.push(`p, li, label, td, th, blockquote { line-height: 1.85 !important; }`);
  } else if (s.lineSpacing === 'wide') {
    parts.push(`p, li, label, td, th, blockquote { line-height: 2.2 !important; }`);
  }

  // Letter + word spacing (WCAG 1.4.12)
  if (s.letterSpacing) {
    parts.push(`p, li, label, button, a, span, td { letter-spacing: 0.06em !important; word-spacing: 0.12em !important; }`);
  }

  // Reduce motion (WCAG 2.3.3)
  if (s.reduceMotion) {
    parts.push(`
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `);
  }

  // Enhanced focus indicators (WCAG 2.4.7, 2.4.11)
  if (s.enhancedFocus) {
    parts.push(`
      :focus-visible {
        outline: 3px solid #c85c55 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 6px rgba(200, 92, 85, 0.28) !important;
        border-radius: 4px !important;
      }
    `);
  }

  return parts.join('\n');
}

const A11yCtx = createContext(null);
export function useAccessibility() { return useContext(A11yCtx); }

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const osReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const base = { ...DEFAULT_SETTINGS, reduceMotion: osReduceMotion };
      return stored ? { ...base, ...JSON.parse(stored) } : base;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const fontLinkRef = useRef(null);

  useEffect(() => {
    // Inject / update the a11y style block
    let el = document.getElementById('a11y-styles');
    if (!el) {
      el = document.createElement('style');
      el.id = 'a11y-styles';
      document.head.appendChild(el);
    }
    el.textContent = buildCSS(settings);

    // Load / unload Atkinson Hyperlegible
    if (settings.fontStyle === 'atkinson') {
      if (!fontLinkRef.current) {
        const link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.id   = 'a11y-font-atkinson';
        link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';
        document.head.appendChild(link);
        fontLinkRef.current = link;
      }
    } else {
      fontLinkRef.current?.remove();
      fontLinkRef.current = null;
    }

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function resetSettings() {
    const osReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setSettings({ ...DEFAULT_SETTINGS, reduceMotion: osReduceMotion });
  }

  return (
    <A11yCtx.Provider value={{ settings, updateSetting, resetSettings }}>
      {/* Hidden SVG filter definitions for color vision deficiency simulation */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          {Object.entries(CVD).map(([key, matrix]) => (
            <filter key={key} id={`a11y-cvd-${key}`}>
              <feColorMatrix type="matrix" values={matrix} />
            </filter>
          ))}
        </defs>
      </svg>
      {children}
    </A11yCtx.Provider>
  );
}
