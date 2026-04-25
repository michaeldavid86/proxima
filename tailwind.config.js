/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: '#0a0e14',
          border: '#1a2230',
          fill: 'rgba(10, 14, 20, 0.85)',
        },
        mc: {
          bg: '#0a0e14',
          grid: '#141a24',
          text: '#c4cdd9',
          dim: '#6a7380',
          cyan: '#00d4ff',
          cyanDim: '#0891a8',
          amber: '#ffb800',
          red: '#ff4466',
          green: '#35e08c',
          magenta: '#ff5cdc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(0, 212, 255, 0.18)',
      },
    },
  },
  plugins: [],
}
