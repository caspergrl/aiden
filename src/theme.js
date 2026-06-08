// Design tokens — inlined here for Firebase App Hosting compatibility.
// The @shared alias is not available in Firebase's build environment.
// Keep in sync with /shared/theme.js manually.

export const C = {
  rose:          '#c85c55',
  roseDark:      '#8b3733',
  roseLight:     '#faecea',
  coral:         '#c85c55',
  primary:       '#7a9dc2',
  primaryLight:  '#dde8f5',
  primaryDark:   '#4a6d8e',
  blue:          '#8aaabf',
  blueLight:     '#e4eef6',
  bg:            '#ffffff',
  bgWarm:        '#f5ede8',
  card:          '#ffffff',
  border:        '#ebe2d8',
  text:          '#211810',
  muted:         '#8a7d76',
  mutedLight:    '#b8ada6',
  sage:          '#7daa94',
  peach:         '#d4a87c',
  lavender:      '#a08ac0',
  lavenderLight: '#f0ecf8',
};

export const serif = "'Ledger', Georgia, serif";
export const sans  = "'Inter', system-ui, sans-serif";

export const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Ledger&display=swap';

export const GRAD        = 'linear-gradient(160deg, #f5ede8 0%, #ffffff 55%)';
export const CARD_SHADOW    = '0 4px 28px rgba(140,60,40,0.10), 0 1px 6px rgba(140,60,40,0.05)';
export const CARD_SHADOW_SM = '0 2px 14px rgba(140,60,40,0.08)';
export const CARD_SHADOW_XS = '0 1px 6px rgba(140,60,40,0.06)';

export const shadow   = CARD_SHADOW;
export const shadowSm = CARD_SHADOW_SM;
export const shadowXs = CARD_SHADOW_XS;

export const radius = { xs: 8, sm: 11, md: 14, lg: 18, xl: 22, pill: 999 };
