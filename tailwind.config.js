/** @type {import('tailwindcss').Config} */
// Design tokens inlined from /shared/tailwind.preset.js
// (Firebase App Hosting only has access to this directory, not ../shared)
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rose:     { DEFAULT: '#c85c55', dark: '#8b3733', light: '#faecea' },
        warm:     { DEFAULT: '#f5ede8', card: '#ffffff' },
        ink:      { DEFAULT: '#211810', muted: '#8a7d76', subtle: '#b8ada6' },
        border:   { DEFAULT: '#ebe2d8' },
        sage:     { DEFAULT: '#7daa94' },
        peach:    { DEFAULT: '#d4a87c' },
        lavender: { DEFAULT: '#a08ac0', light: '#f0ecf8' },
        sky:      { DEFAULT: '#7a9dc2', light: '#dde8f5', dark: '#4a6d8e' },
        recipient:{ a: '#c85c55', b: '#7a9dc2' },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Ledger', 'Georgia', 'serif'],
      },
      boxShadow: {
        card:      '0 4px 28px rgba(140,60,40,0.10), 0 1px 6px rgba(140,60,40,0.05)',
        'card-sm': '0 2px 14px rgba(140,60,40,0.08)',
        'card-xs': '0 1px 6px rgba(140,60,40,0.06)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md:  '0.6875rem',
        lg:  '0.875rem',
        xl:  '1.125rem',
        '2xl': '1.375rem',
      },
      backgroundImage: {
        'warm-grad': 'linear-gradient(160deg, #f5ede8 0%, #ffffff 55%)',
      },
    },
  },
  plugins: [],
};
