/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F6F5F1',
          soft: '#EFEEE8',
        },
        ink: {
          DEFAULT: '#171B24',
          dark: '#0D1016',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#171B24',
          darksoft: '#1D222D',
        },
        primary: {
          50: '#EAF6F0',
          100: '#CDEADC',
          300: '#6FBE9B',
          500: '#1F8F68',
          600: '#17694E',
          700: '#12523D',
          900: '#0B3226',
        },
        amber: {
          100: '#F6E4C3',
          300: '#E3B565',
          500: '#C98A2E',
          700: '#8F5F1B',
        },
        rose: {
          100: '#F3DEDC',
          300: '#D99E97',
          500: '#B85450',
          700: '#833A37',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        bangla: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'sans-serif'],
      },
      borderRadius: {
        xl: '1.1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(23, 27, 36, 0.08), 0 8px 24px -8px rgba(23, 27, 36, 0.08)',
        softdark: '0 2px 10px -2px rgba(0,0,0,0.35), 0 12px 28px -10px rgba(0,0,0,0.4)',
        stamp: '0 6px 18px -4px rgba(23,27,36,0.25)',
      },
      keyframes: {
        stampIn: {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(0.96) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-2deg)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        stampIn: 'stampIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        shake: 'shake 0.4s ease-in-out',
        popIn: 'popIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
