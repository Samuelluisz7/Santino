import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const EXCLUDED_ROOT_ENTRIES = new Set([
  ".git",
  ".github",
  "docs",
  "scripts",
  "site",
  "supabase",
  "tests",
]);
const PUBLIC_ROOT_FILES = new Set(["robots.txt"]);
const PUBLIC_ROOT_DIRECTORIES = new Set(["assets", "data", "fonts", "images"]);
const PUBLIC_ASSET_EXTENSIONS = new Set([
  ".avif",
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".mp4",
  ".otf",
  ".png",
  ".svg",
  ".ttf",
  ".wasm",
  ".webm",
  ".webmanifest",
  ".webp",
  ".woff",
  ".woff2",
  ".xml",
]);

function isPublicAssetFile(name) {
  return PUBLIC_ASSET_EXTENSIONS.has(path.extname(name).toLowerCase());
}

async function copyPublicDirectory(sourceRoot, outputRoot) {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  let copiedAny = false;

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const sourcePath = path.join(sourceRoot, entry.name);
    const outputPath = path.join(outputRoot, entry.name);

    if (entry.isDirectory()) {
      copiedAny = await copyPublicDirectory(sourcePath, outputPath) || copiedAny;
      continue;
    }

    if (!entry.isFile() || !isPublicAssetFile(entry.name)) continue;

    await mkdir(outputRoot, { recursive: true });
    await cp(sourcePath, outputPath, { errorOnExist: true, force: false });
    copiedAny = true;
  }

  return copiedAny;
}

export async function buildPagesSite(sourceRoot, outputRoot) {
  const source = path.resolve(sourceRoot);
  const output = path.resolve(outputRoot);

  if (source === output) {
    throw new Error("The Pages output directory must differ from the repository root.");
  }

  const entries = await readdir(source, { withFileTypes: true });
  await mkdir(output);

  const copied = [];
  for (const entry of entries) {
    if (EXCLUDED_ROOT_ENTRIES.has(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;

    if (entry.isDirectory()) {
      if (!PUBLIC_ROOT_DIRECTORIES.has(entry.name)) continue;
      if (await copyPublicDirectory(path.join(source, entry.name), path.join(output, entry.name))) {
        copied.push(entry.name);
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (!PUBLIC_ROOT_FILES.has(entry.name) && !isPublicAssetFile(entry.name)) continue;

    await cp(
      path.join(source, entry.name),
      path.join(output, entry.name),
      { errorOnExist: true, force: false },
    );
    copied.push(entry.name);
  }

  await writeFile(path.join(output, ".nojekyll"), "", { flag: "wx" });
  return copied;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputArgument = process.argv[2] || "site";
  const outputRoot = path.resolve(REPOSITORY_ROOT, outputArgument);
  const copied = await buildPagesSite(REPOSITORY_ROOT, outputRoot);
  console.log("Prepared " + copied.length + " public root entries in " + outputRoot);
}
