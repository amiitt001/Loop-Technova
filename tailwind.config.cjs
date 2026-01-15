/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': 'var(--neon-cyan)',
        'neon-violet': 'var(--neon-violet)',
        'neon-green': 'var(--neon-green)'
      }
    }
  },
  plugins: []
};
