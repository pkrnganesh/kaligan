/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        emerald: { 700: "#0B6E54", 600: "#0E7A5F", 500: "#15916F", 50: "#E8F4EE" },
        mint: { 300: "#BFE6CE", 100: "#DCF0E2" },
        teal: { 400: "#5FC9B0", 200: "#A9E2D4" },
        canvas: "#F5F9E6",
        surface: { DEFAULT: "#FFFFFF", 2: "#FBFDF3" },
        ink: { DEFAULT: "#0F1A17", muted: "#5A6B64" },
        line: "#E2EAD8",
        hot: "#D9534F", warm: "#E0A100", cold: "#4A8FB5", success: "#138A63",
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        display: ['"Schibsted Grotesk"', "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "18px" },
      boxShadow: {
        soft: "0 1px 2px rgba(15,26,23,.06)",
        lift: "0 8px 24px rgba(15,26,23,.08)",
      },
    },
  },
  plugins: [],
};
