/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Professional Blue
          dark: '#1e40af',
        },
        secondary: '#64748b', // Slate gray
      }
    },
  },
  plugins: [],
}
