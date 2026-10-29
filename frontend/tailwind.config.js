/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aviation: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#101626',
          800: '#172033',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
          accent: '#0284C7',
          sky: '#0EA5E9',
          radar: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          enroute: '#6366F1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
