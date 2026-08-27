/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F0E',
          secondary: '#111715',
          card: '#151C19',
          elevated: '#1A2420',
          border: '#26332E'
        },
        brand: {
          primary: '#00C878',
          secondary: '#00A968',
          accent: '#24E08A'
        },
        text: {
          primary: '#F5F7F6',
          secondary: '#A7B3AE',
          muted: '#6F7D77'
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#38BDF8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
