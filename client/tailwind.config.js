/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1200px',
      },
    },
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
      maxWidth: {
        app: '1200px',
        hero: '920px',
        prose: '680px',
      },
      spacing: {
        s1: '4px',
        s2: '8px',
        s3: '12px',
        s4: '16px',
        s6: '24px',
        s8: '32px',
        s12: '48px',
        s16: '64px',
      },
      borderRadius: {
        uiSm: '12px',
        uiMd: '16px',
        uiLg: '24px',
      },
      boxShadow: {
        ui: '0 10px 24px rgba(15, 23, 42, 0.12)',
        uiLg: '0 18px 40px rgba(15, 23, 42, 0.16)',
      },
    },
  },
  plugins: [],
};
