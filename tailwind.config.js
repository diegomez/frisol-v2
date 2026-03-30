/** @type {import('tailwindcss').Config} */

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#004253', container: '#005b71', fixed: '#b7eaff' },
        surface: { DEFAULT: '#f7f9ff', 'container-low': '#f1f4fa', 'container-lowest': '#ffffff', 'container-high': '#e5e8ee' },
        'on-surface': '#181c20',
        'on-surface-variant': '#40484c',
        outline: { DEFAULT: '#70787d', variant: '#bfc8cc' },
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0px 4px 16px rgba(24,28,32,0.04)',
        elevated: '0px 12px 32px rgba(24,28,32,0.06)',
      },
    },
  },
  plugins: [],
};

module.exports = config;
