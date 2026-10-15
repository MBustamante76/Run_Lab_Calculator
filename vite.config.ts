import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "wordpress/run-lab-calculator/assets",
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/main.tsx",
      name: "RunLabCalculator",
      formats: ["iife"],
      fileName: () => "run-lab-calculator.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "run-lab-calculator.[ext]",
      },
    },
  },
});
