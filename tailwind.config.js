/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f2",
          100: "#fce8e8",
          400: "#b45454",
          600: "#8f2323",
          700: "#7f1d1d",
          800: "#6b1717",
          900: "#571212",
        },
      },
    },
  },
  plugins: [],
};
