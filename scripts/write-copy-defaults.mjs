import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

const root = process.cwd();
const server = await createServer({
  configFile: false,
  root,
  plugins: [react()],
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const mod = await server.ssrLoadModule("/src/config/editableCopy.ts");
  const destination = path.join(root, "wordpress", "run-lab-calculator", "copy-defaults.json");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(mod.defaultEditableCopy, null, 2)}\n`, "utf8");
} finally {
  await server.close();
}
