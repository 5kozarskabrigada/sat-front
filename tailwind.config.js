/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Minimal Palette (Slate & Indigo)
        brand: {
          dark: "#0F172A",    // Slate 900
          primary: "#FFFFFF", 
          accent: "#4F46E5",  // Indigo 600 - More modern than standard Blue
          secondary: "#F8FAFC", // Slate 50
          text: "#334155",    // Slate 700 - Softer than black
          muted: "#94A3B8",   // Slate 400
          border: "#E2E8F0",  // Slate 200
        },
        exam: {
          answered: "#4F46E5", // Indigo 600
          unanswered: "#FFFFFF",
          review: "#F59E0B",
          highlight: "#FEF08A",
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'], // Clean, modern, standard
        serif: ['"Merriweather"', 'serif'],
      },
      boxShadow: {
        'panel': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Subtle
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
      }
    },
  },
  plugins: [],
}
