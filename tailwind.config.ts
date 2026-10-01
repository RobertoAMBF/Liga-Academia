import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        white: "rgb(var(--surface) / <alpha-value>)",
        solid: "#ffffff",
        strong: "#17201d",
        grass: "rgb(var(--grass) / <alpha-value>)",
        lime: "#c6f05a",
        clay: "rgb(var(--clay) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 29, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
