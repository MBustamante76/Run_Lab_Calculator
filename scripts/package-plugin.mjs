import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ZipArchive } from "archiver";

const root = process.cwd();
const build = spawnSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
  cwd: root,
  stdio: "inherit",
});

if (build.status !== 0) {
  console.error(build.error ?? `Build exited with status ${build.status}`);
  process.exit(build.status ?? 1);
}

const pluginDir = path.join(root, "wordpress", "run-lab-calculator");
const required = [
  "run-lab-calculator.php",
  "README.txt",
  path.join("assets", "run-lab-calculator.js"),
  path.join("assets", "run-lab-calculator.css"),
];

for (const relativePath of required) {
  const absolutePath = path.join(pluginDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing production file: ${absolutePath}`);
    process.exit(1);
  }
}

const maps = fs
  .readdirSync(path.join(pluginDir, "assets"))
  .filter((name) => name.endsWith(".map"));

if (maps.length > 0) {
  console.error(`Source maps must not be packaged: ${maps.join(", ")}`);
  process.exit(1);
}

const releaseDir = path.join(root, "releases");
fs.mkdirSync(releaseDir, { recursive: true });
const zipPath = path.join(releaseDir, "run-lab-calculator.zip");
fs.rmSync(zipPath, { force: true });

await new Promise((resolve, reject) => {
  const output = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  output.on("close", () => resolve(undefined));
  archive.on("error", reject);
  archive.pipe(output);

  for (const relativePath of required) {
    archive.file(path.join(pluginDir, relativePath), {
      name: path.posix.join("run-lab-calculator", relativePath.split(path.sep).join("/")),
    });
  }

  archive.finalize();
});

console.log(`Packaged ${zipPath}`);
