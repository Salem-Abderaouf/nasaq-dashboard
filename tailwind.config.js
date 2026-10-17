/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nasaq: {
          teal: '#1c4b46',
          'teal-dark': '#123330',
          'teal-light': '#28665f',
          'teal-subtle': '#eef6f5',
          gold: '#a3895c',
          'gold-dark': '#826c44',
          'gold-light': '#c2aa7e',
          'gold-subtle': '#fbf8f2',
          blue: '#0284c7',
          'blue-subtle': '#f0f9ff',
          bg: '#f1f5f9',
          surface: '#ffffff',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
