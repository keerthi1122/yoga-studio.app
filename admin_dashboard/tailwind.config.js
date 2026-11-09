/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#8F2F1B',
          dark: '#692518',
          light: '#A83B24',
          50: '#FDF6F5',
          100: '#FAECE9',
        },
        cream: {
          DEFAULT: '#F7F1E5',
          light: '#FAF6EE',
          dark: '#EFE5D1',
        },
        beige: {
          DEFAULT: '#E9DCC5',
          dark: '#D8C5A5',
        },
        sage: {
          DEFAULT: '#82977A',
          dark: '#667A5E',
          light: '#A3B59C',
          50: '#F4F7F3',
        },
        dark: {
          DEFAULT: '#302820',
          muted: '#635950',
          subtle: '#9A8E83',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

