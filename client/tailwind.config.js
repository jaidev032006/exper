/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Light Fintech Palette
        ivory: '#F7F8F5',
        charcoal: {
          DEFAULT: '#17231D',
          50: '#F5F7F6',
          100: '#E4EAE6',
          200: '#C7D3CB',
          300: '#A4B7AA',
          400: '#7E9786',
          500: '#5E7766',
          600: '#43564A',
          700: '#2D3A32',
          800: '#1F2923',
          900: '#17231D', // Primary text
          950: '#0D1612', // Dark mode background
        },
        emerald: {
          50: '#F2F9F5',
          100: '#DDF5E8', // Muted mint accent
          200: '#B8EAD1',
          300: '#85D7B0',
          400: '#4CBD8A',
          500: '#137C5A', // Forest emerald primary accent
          600: '#0F6549',
          700: '#0C503A',
          800: '#093B2B',
          900: '#06271D',
          950: '#031711',
        },
        coral: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#D94B4B', // Sophisticated coral-red for negative values
          600: '#C53030',
          700: '#9B1C1C',
        },
        slate: {
          fintech: '#627368', // Secondary info muted slate
        },
        // Alias exper and finora to the emerald palette
        exper: {
          50: '#F2F9F5',
          100: '#DDF5E8',
          200: '#B8EAD1',
          300: '#85D7B0',
          400: '#4CBD8A',
          500: '#137C5A',
          600: '#0F6549',
          700: '#0C503A',
          800: '#093B2B',
          900: '#06271D',
          950: '#031711',
        },
        finora: {
          50: '#F2F9F5',
          100: '#DDF5E8',
          200: '#B8EAD1',
          300: '#85D7B0',
          400: '#4CBD8A',
          500: '#137C5A',
          600: '#0F6549',
          700: '#0C503A',
          800: '#093B2B',
          900: '#06271D',
          950: '#031711',
        },
        surface: {
          light: '#F7F8F5',         // Warm ivory
          dark: '#0D1612',          // Deep charcoal-green
          cardLight: '#FFFFFF',     // Pure white cards
          cardDark: '#131E18',      // Slightly elevated dark surface
          cardElevatedDark: '#1A2921',
          borderLight: '#E3E8E3',   // Subtle neutral gray-green border
          borderDark: '#203328',    // Dark neutral border
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 35, 29, 0.04), 0 1px 2px -1px rgba(23, 35, 29, 0.04)',
        'card': '0 2px 8px -2px rgba(23, 35, 29, 0.05), 0 1px 4px -1px rgba(23, 35, 29, 0.03)',
        'elevated': '0 12px 24px -6px rgba(23, 35, 29, 0.08), 0 4px 8px -2px rgba(23, 35, 29, 0.04)',
        'modal': '0 20px 40px -8px rgba(13, 22, 18, 0.16), 0 1px 3px 0 rgba(13, 22, 18, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
