/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020617',
          900: '#030712',
          850: '#050816',
          800: '#0B0F19',
          750: '#0F172A',
          700: '#1E293B',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        electric: {
          blue: '#3b82f6',
          violet: '#8b5cf6',
          magenta: '#d946ef',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
        dark: {
          950: '#020617',
          900: '#030712',
          850: '#050816',
          800: '#0d1322',
          750: '#11192c',
          700: '#162035',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.04)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-indigo': '0 0 35px -5px rgba(99, 102, 241, 0.35)',
        'glow-purple': '0 0 35px -5px rgba(168, 85, 247, 0.35)',
        'glow-blue': '0 0 35px -5px rgba(59, 130, 246, 0.4)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.4)',
        'glow-magenta': '0 0 35px -5px rgba(217, 70, 239, 0.35)',
        'glow-emerald': '0 0 35px -5px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 35px -5px rgba(244, 63, 94, 0.35)',
        'glow-card': '0 10px 30px -10px rgba(0, 0, 0, 0.8), 0 0 25px -5px rgba(99, 102, 241, 0.15)',
        'glow-cta': '0 0 30px -2px rgba(99, 102, 241, 0.5), 0 10px 20px -5px rgba(139, 92, 246, 0.4)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'laser-sweep': 'laserSweep 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
        'shine': 'shine 3.5s ease-in-out infinite',
      },
      keyframes: {
        laserSweep: {
          '0%': { top: '5%' },
          '100%': { top: '92%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
