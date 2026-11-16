import { spawnSync } from "node:child_process";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function writeCopyDefaults(): Plugin {
  return {
    name: "write-copy-defaults",
    closeBundle() {
      const script = path.resolve("scripts/write-copy-defaults.mjs");
      const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
      if (result.status !== 0) {
        this.error("Failed to write copy-defaults.json");
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), writeCopyDefaults()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
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
