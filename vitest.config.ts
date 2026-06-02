import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "dist/**",
        "coverage/**",
        "src/**/*.test.ts",
        "src/test/**",
        "vite.config.ts",
        "vitest.config.ts",
        "tailwind.config.ts",
        "postcss.config.js"
      ]
    }
  }
});
