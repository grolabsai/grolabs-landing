/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,js}'],
  theme: {
    extend: {
      colors: {
        'zinc-black': '#131316',
        'zinc-card': '#1b1b1e',
        'zinc-card-soft': '#212126',
        'kinetic-yellow': '#fae194',
        'kinetic-yellow-dim': 'rgba(250, 225, 148, 0.6)',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        marker: ['"Caveat"', '"Permanent Marker"', 'cursive'],
      },
      backgroundImage: {
        'ambient-glow':
          'radial-gradient(circle at center, rgba(250, 225, 148, 0.08) 0%, transparent 70%)',
        'card-glow':
          'radial-gradient(circle at 30% 0%, rgba(250, 225, 148, 0.06) 0%, transparent 60%)',
      },
      spacing: {
        'stack-3x': '160px',
        'stack-4x': '200px',
      },
      maxWidth: {
        page: '1280px',
      },
    },
  },
  plugins: [],
};
