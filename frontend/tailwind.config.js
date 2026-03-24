/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          50:  '#f8faf2',
          100: '#f0f4e1',
          200: '#e1ead2',
          300: '#d2e0c3',
          400: '#c3d6b4',
          500: '#bcf24a', // Ana Electric Lime
          600: '#a8d942',
          700: '#8fb837',
          800: '#75972d',
          900: '#3f6212', // Muted Forest
        },
        carbon: {
          50:  '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#0a0e12', // Deep Onyx
          950: '#05070a',
        }
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(10, 14, 18, 0.08)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'premium': '24px',
      }
    },
  },
  plugins: [],
}
