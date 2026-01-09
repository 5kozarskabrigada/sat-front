/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Midnight Navy" theme - High Stakes Testing Environment
        brand: {
          dark: "#001B4D",    // Deep background (Midnight Navy)
          primary: "#002B7A", // Slightly lighter navy for headers/panels
          accent: "#007AFF",  // "Bluebook" style blue for active states
          secondary: "#F5F5F5", // Off-white for text legibility
          text: "#FFFFFF",
          muted: "#A0AEC0",
        },
        // Semantic colors for the exam
        exam: {
          answered: "#001B4D", // Filled bubble
          unanswered: "#FFFFFF", // Empty bubble
          review: "#FFA500", // Orange flag
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
