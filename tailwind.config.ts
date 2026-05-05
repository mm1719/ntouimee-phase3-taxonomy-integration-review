import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f7f4",
        ink: "#152033"
      }
    }
  },
  plugins: []
} satisfies Config;
