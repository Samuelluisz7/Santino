import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildPagesSite } from "../scripts/build-pages.mjs";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("copies website files and excludes repository-only folders", async (t) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "santino-pages-"));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  const sourceRoot = path.join(temporaryRoot, "source");
  const outputRoot = path.join(temporaryRoot, "public-site");
  await mkdir(sourceRoot);
  await writeFile(path.join(sourceRoot, "index.html"), "<h1>SANTINO</h1>");
  await writeFile(path.join(sourceRoot, "santino-ui.css"), "body { color: #fff; }");
  await writeFile(path.join(sourceRoot, "robots.txt"), "User-agent: *");
  await writeFile(path.join(sourceRoot, "CATALOGO.md"), "internal catalog notes");
  await writeFile(path.join(sourceRoot, "LEIA-ME.txt"), "internal setup notes");
  await writeFile(path.join(sourceRoot, "README.md"), "repository documentation");
  await writeFile(path.join(sourceRoot, ".env"), "must not be published");
  await writeFile(path.join(sourceRoot, ".nojekyll"), "");

  const assetsDirectory = path.join(sourceRoot, "assets");
  await mkdir(path.join(assetsDirectory, "nested"), { recursive: true });
  await writeFile(path.join(assetsDirectory, "nested", "hero.webp"), "public image");
  await writeFile(path.join(assetsDirectory, "NOTES.md"), "internal notes");
  await writeFile(path.join(assetsDirectory, ".env"), "must not be published");

  for (const folder of [".git", ".github", "docs", "scripts", "supabase", "tests"]) {
    const directory = path.join(sourceRoot, folder);
    await mkdir(directory);
    await writeFile(path.join(directory, "private.txt"), "repository-only");
  }

  const copied = await buildPagesSite(sourceRoot, outputRoot);

  assert.deepEqual(copied.sort(), ["assets", "index.html", "robots.txt", "santino-ui.css"]);
  assert.equal(await readFile(path.join(outputRoot, "index.html"), "utf8"), "<h1>SANTINO</h1>");
  assert.equal(await readFile(path.join(outputRoot, "assets", "nested", "hero.webp"), "utf8"), "public image");
  await access(path.join(outputRoot, ".nojekyll"));

  for (const excluded of [
    ".env",
    ".git",
    ".github",
    "CATALOGO.md",
    "LEIA-ME.txt",
    "README.md",
    "docs",
    "scripts",
    "supabase",
    "tests",
    "assets/NOTES.md",
    "assets/.env",
  ]) {
    await assert.rejects(access(path.join(outputRoot, excluded)));
  }
});

test("refuses to copy a repository into itself", async (t) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "santino-pages-"));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  await assert.rejects(
    buildPagesSite(temporaryRoot, temporaryRoot),
    /must differ from the repository root/,
  );
});

test("real Pages build excludes repository documentation and Supabase files", async (t) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "santino-real-pages-"));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const outputRoot = path.join(temporaryRoot, "site");

  await buildPagesSite(REPOSITORY_ROOT, outputRoot);

  await access(path.join(outputRoot, "index.html"));
  await access(path.join(outputRoot, "search.js"));
  await access(path.join(outputRoot, ".nojekyll"));

  for (const excluded of ["CATALOGO.md", "LEIA-ME.txt", "docs", "scripts", "supabase", "tests", ".gitignore"]) {
    await assert.rejects(access(path.join(outputRoot, excluded)));
  }
});
