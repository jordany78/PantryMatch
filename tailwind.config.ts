import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pantry: {
          green: "#2f9e44",
          amber: "#f59f00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
