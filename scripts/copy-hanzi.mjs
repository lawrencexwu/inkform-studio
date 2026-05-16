// Copies the hanzi-writer-data character JSON into /public so the stroke
// engine can fetch median data same-origin (offline-capable, no external
// network). Runs automatically before `dev`/`build`; output is gitignored
// and regenerated from the npm dependency.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "hanzi-writer-data");
const dest = join(root, "public", "hanzi");

if (!existsSync(src)) {
  console.error("[copy-hanzi] hanzi-writer-data not installed; skipping.");
  process.exit(0);
}

const already =
  existsSync(dest) && readdirSync(dest).filter((f) => f.endsWith(".json")).length;
if (already > 9000) {
  console.log(`[copy-hanzi] up to date (${already} files).`);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
let n = 0;
for (const file of readdirSync(src)) {
  if (file.endsWith(".json")) {
    cpSync(join(src, file), join(dest, file));
    n++;
  }
}
console.log(`[copy-hanzi] copied ${n} character files to public/hanzi.`);
