/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#050d1a',
        panel:   '#0a1628',
        card:    '#0d1f35',
        border:  '#1a2d4a',
        green:   '#00FFB2',
        red:     '#FF3B3B',
        blue:    '#2F80ED',
        yellow:  '#F2C94C',
        muted:   '#4a6080',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
