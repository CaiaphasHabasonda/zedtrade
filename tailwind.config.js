/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        copper: {
          50:  '#FDF6F0',
          100: '#FAEADC',
          200: '#F5D0B0',
          300: '#EDAA78',
          400: '#E58040',
          500: '#E07B39',  // primary copper
          600: '#C96A2B',
          700: '#A8521E',
          800: '#7D3C15',
          900: '#52270D',
        },
        forest: {
          50:  '#F0F8F4',
          100: '#D6EDE2',
          200: '#A8D9BF',
          300: '#6DBF95',
          400: '#3EA670',
          500: '#2E8A58',
          600: '#1A5C3A',  // primary green
          700: '#134429',
          800: '#0D2E1C',
          900: '#07180E',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
