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

    await cp(
      path.join(source, entry.name),
      path.join(output, entry.name),
      { recursive: true, errorOnExist: true, force: false },
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
