/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bottle: {
          DEFAULT: "#24543D",
          dark: "#1A4030",
        },
        saffron: {
          DEFAULT: "#E87532",
        },
        cream: "#F4EDE4",
        surface: "#F5F2EE",
        canvas: "#EDE8E2",
        ink: "#212121",
        muted: "#878787",
        mutedwarm: "#6B655E",
        line: "#E2DCD5",
        good: "#2E7D5B",
        warn: "#A33F13",
        warnbg: "#F6EFE6",
        warnborder: "#C9A98A",
        warntext: "#6B4A2A",
      },
      fontFamily: {
        sans: ["Manrope", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.07)",
        phone: "0 18px 40px rgba(36,84,61,.16)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
