// collect-code.js
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIG =====
// Use forward slashes; Node handles them on Windows too.
const FOLDERS = ["src"];
// Include .php files.
const EXTENSIONS = ["js", "jsx", "ts", "tsx", "sql"]; // e.g. ["php","md"] or [] for all files
const OUTPUT_FILE = "all_code.txt";
// ==================

function normalizeExts(exts) {
  return new Set(
    exts
      .filter(Boolean)
      .map((e) => (e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`))
  );
}

function normalizeDirs(dirs) {
  return Array.from(
    new Set(
      dirs
        .filter(Boolean)
        .map((d) => d.replace(/\\/g, "/")) // tolerate backslashes in input
        .map((d) => path.resolve(__dirname, d))
    )
  );
}

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // basic ignores
      const name = entry.name.toLowerCase();
      if ([".git", "node_modules", ".venv"].includes(name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function collectFiles(rootDirs, includeExts, outPath) {
  const exts = normalizeExts(includeExts);
  const absOut = path.resolve(__dirname, outPath);
  const files = [];
  const dirs = normalizeDirs(rootDirs);

  for (const d of dirs) {
    for await (const f of walk(d)) {
      if (f === absOut) continue;
      const ext = path.extname(f).toLowerCase();
      if (exts.size === 0 || exts.has(ext)) files.push(f);
    }
  }

  files.sort();
  await fs.mkdir(path.dirname(absOut), { recursive: true });
  const out = createWriteStream(absOut, { encoding: "utf8", flags: "w" });

  let count = 0;
  for (const f of files) {
    let data;
    try {
      data = await fs.readFile(f, "utf8");
    } catch {
      continue;
    }
    out.write(`=== ${path.resolve(f)} ===\n`);
    out.write(data.endsWith("\n") ? data : data + "\n");
    out.write("\n");
    count++;
  }

  await new Promise((res, rej) => {
    out.on("error", rej);
    out.end(res);
  });

  return { absOut, count };
}

(async function main() {
  if (
    !Array.isArray(FOLDERS) ||
    !Array.isArray(EXTENSIONS) ||
    typeof OUTPUT_FILE !== "string"
  ) {
    console.error("Invalid config. Check FOLDERS, EXTENSIONS, OUTPUT_FILE.");
    process.exit(1);
  }
  const { absOut, count } = await collectFiles(
    FOLDERS,
    EXTENSIONS,
    OUTPUT_FILE
  );
  console.log(`Wrote ${count} files into: ${absOut}`);
})().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
