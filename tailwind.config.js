/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./store/**/*.{js,jsx}",
    "./data/**/*.{js,jsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        midnight: "#070A12",
        ink: "#0F172A",
        cloud: "#F8FAFC",
        violetGlow: "#8B5CF6",
        aquaGlow: "#22D3EE",
        limeGlow: "#A3E635"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(15, 23, 42, 0.24)",
        glow: "0 0 70px rgba(34, 211, 238, 0.22)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
