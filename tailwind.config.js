/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#F5F5DC', // page background (lightest beige)
        panel:   '#D1BFA2', // sidebar / cards (light tan)
        card:    '#C2A68D', // medium tan (borders, accents)
        border:  '#BFAF8D', // warm tan (secondary elements)
        green:   '#2d6a4f', // dark green (success)
        red:     '#c0392b', // dark red (danger)
        blue:    '#C2A68D', // warm tan accent
        yellow:  '#b7770d', // dark amber (warning)
        muted:   '#6b5a45', // muted text
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
