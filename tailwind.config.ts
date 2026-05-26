import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D0D0D',
          surface: '#1A1A2E',
          card: '#12122A',
        },
        blue: {
          mdia: '#4A90E2',
          light: '#6EC6FF',
          glow: 'rgba(74, 144, 226, 0.4)',
        },
        gold: {
          gear: '#C9A84C',
          light: '#F0D080',
        },
        purple: {
          accent: '#9B59B6',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0B0',
        },
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        sora: ['var(--font-sora)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'blue-gold': 'linear-gradient(135deg, #4A90E2, #C9A84C)',
        'blue-gradient': 'linear-gradient(135deg, #4A90E2, #6EC6FF)',
        'card-border': 'linear-gradient(135deg, rgba(74,144,226,0.3), rgba(201,168,76,0.15))',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(74, 144, 226, 0.4)',
        'glow-gold': '0 0 20px rgba(201, 168, 76, 0.4)',
        'glow-sm': '0 0 8px rgba(74, 144, 226, 0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
