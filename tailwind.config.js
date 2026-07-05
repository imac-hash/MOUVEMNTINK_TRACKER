/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1A1A1A",
        navy: "#101B30",
        bone: "#F0E9DC",
        oxblood: "#3F0813",
        line: "#DAD2C0",
      },
      fontFamily: {
        // Hero — document titles, the one moment meant to read as a headline
        display: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        // Structural — section heads, table headers, nav, banners
        structural: ["var(--font-oswald)", "Oswald", "sans-serif"],
        // Body — paragraphs, labels, everything else
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
