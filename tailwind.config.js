/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Professional" theme - Clean, Neutral, Focused
        brand: {
          dark: "#1A202C",    // Very dark gray/black for high contrast text
          primary: "#FFFFFF", // White surfaces
          accent: "#2563EB",  // Royal Blue for primary actions
          secondary: "#F3F4F6", // Light gray for backgrounds
          text: "#111827",    // Nearly black for body text
          muted: "#6B7280",   // Gray for secondary text
          border: "#E5E7EB",  // Light border color
        },
        // Semantic colors for the exam
        exam: {
          answered: "#2563EB", // Filled bubble (Blue)
          unanswered: "#FFFFFF", // Empty bubble
          review: "#F59E0B", // Orange flag
          highlight: "#FEF08A", // Annotation highlight
        }
      },
      fontFamily: {
        sans: ['"Public Sans"', 'sans-serif'],
        serif: ['"Source Serif 4"', 'serif'],
      },
      boxShadow: {
        'panel': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
