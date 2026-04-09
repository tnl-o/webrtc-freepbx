/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        petal: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      animation: {
        'fade-in':  'fade-in  0.35s ease both',
        'slide-up': 'slide-up 0.40s ease both',
        'glow':     'glow-pulse 2s ease-in-out infinite',
        'shimmer':  'shimmer 2s linear infinite',
        'float':    'float-orb 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
