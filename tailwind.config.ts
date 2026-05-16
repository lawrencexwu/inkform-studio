import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0b0d",
          900: "#121214",
          850: "#17171a",
          800: "#1d1d21",
          700: "#2a2a30",
          600: "#3a3a42",
          500: "#55555f",
          400: "#7a7a86",
          300: "#a3a3ad",
        },
        accent: {
          DEFAULT: "#c0392b",
          soft: "#d97a6c",
        },
        rice: "#f4efe4",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        cjk: [
          '"Noto Serif CJK TC"',
          '"Songti TC"',
          '"Source Han Serif TC"',
          '"PMingLiU"',
          '"Noto Serif TC"',
          "serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
