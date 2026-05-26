import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201d",
        grass: "#2f8f46",
        lime: "#c6f05a",
        clay: "#d86836",
        mist: "#eef4ef"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 29, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
