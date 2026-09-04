import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: { DEFAULT: '#FDE7EC', 50: '#FFF9FA', 100: '#FDE7EC', 200: '#FBD3DD' },
        rose: { DEFAULT: '#F4A6BD', 50: '#FCE9EF', 100: '#F9D2DE', 300: '#F4A6BD', 500: '#E8748F', 700: '#C24F6B' },
        cream: { DEFAULT: '#FFF9F1', 50: '#FFFDFA', 100: '#FFF9F1', 200: '#FBF0E2' },
        ink: { DEFAULT: '#2B2320', 700: '#4A3F3B', 500: '#7A6B65' },
        charcoal: { DEFAULT: '#1B1614', 100: '#241E1B', 200: '#2E2622' }
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '24px',
        pill: '999px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(232, 116, 143, 0.14)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        soft: '0 2px 12px rgba(43, 35, 32, 0.06)'
      },
      backdropBlur: {
        glass: '20px'
      },
      keyframes: {
        'float-up': {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-420px) scale(1.1)', opacity: '0' }
        },
        'heart-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '40%': { transform: 'scale(1.3)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' }
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.45' },
          '100%': { transform: 'scale(3)', opacity: '0' }
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' }
        }
      },
      animation: {
        'float-up': 'float-up 3.5s ease-in forwards',
        'heart-pop': 'heart-pop 0.7s ease-out forwards',
        ripple: 'ripple 0.6s ease-out forwards',
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config;
