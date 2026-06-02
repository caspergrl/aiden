const sharedPreset = require('../shared/tailwind.preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedPreset],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
