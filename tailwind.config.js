/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        bg: '#f7f6f2',
        fg: '#1c1c1c',
        primary: '#3d7068',
        'primary-light': '#5a958a',
        'primary-dark': '#2a5249',
        border: '#e5e4de',
        muted: '#b4b4b4',
      },
    },
  },
  plugins: [],
};
