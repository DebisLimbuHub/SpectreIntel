/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base
        'cyber-bg': '#0a0e17',
        'cyber-panel': '#0f1420',
        'cyber-card': '#141b2d',
        'cyber-hover': '#1a2238',
        'cyber-border': '#1e2a3a',
        'cyber-border-active': '#2a4a6b',

        // Threat levels
        'threat-critical': '#ff1744',
        'threat-high': '#ff5722',
        'threat-medium': '#ff9800',
        'threat-low': '#ffc107',
        'threat-info': '#00bcd4',
        'threat-safe': '#4caf50',

        // Accents
        'accent-cyan': '#00e5ff',
        'accent-blue': '#2196f3',
        'accent-orange': '#ff6d00',
        'accent-red': '#ff1744',
        'accent-green': '#00e676',
        'accent-purple': '#7c4dff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        'threat-pulse': 'threat-pulse 2s ease-in-out infinite',
        'arc-flow': 'arc-flow 2s linear infinite',
        'ticker-scroll': 'ticker-scroll 180s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'threat-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(255, 23, 68, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(255, 23, 68, 0.3)' },
        },
        'arc-flow': {
          to: { strokeDashoffset: '-12' },
        },
        'ticker-scroll': {
          from: { transform: 'translateX(0%)' },
          to: { transform: 'translateX(-50%)' },
        },
        'glow': {
          from: { boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)' },
          to: { boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-red': '0 0 10px rgba(255, 23, 68, 0.5)',
        'glow-cyan': '0 0 10px rgba(0, 229, 255, 0.5)',
        'glow-orange': '0 0 10px rgba(255, 109, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
