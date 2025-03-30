/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FA586A", // Apple Music red
        primaryDark: "#E51D40",
        primaryLight: "#FF8A9A",
        background: "#111111",
        backgroundLight: "#222222",
        textSecondary: "rgba(255, 255, 255, 0.8)",
        textTertiary: "rgba(255, 255, 255, 0.6)",
      },
      boxShadow: {
        light: "0 2px 8px rgba(0, 0, 0, 0.15)",
        medium: "0 4px 20px rgba(0, 0, 0, 0.25)",
        heavy: "0 10px 30px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
