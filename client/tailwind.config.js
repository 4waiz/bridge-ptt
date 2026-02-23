/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brandInk: '#0c111d',
        brandNavy: '#101a2d',
        brandMist: '#ebf2ff',
        brandSky: '#49b9ff',
        brandAqua: '#2dd4bf',
        brandRose: '#fb7185',
        brandAmber: '#f59e0b',
      },
      boxShadow: {
        glow: '0 12px 36px rgba(15, 23, 42, 0.24)',
      },
    },
  },
  plugins: [],
};
