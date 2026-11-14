import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildPagesSite } from "../scripts/build-pages.mjs";

test("copies website files and excludes repository-only folders", async (t) => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "santino-pages-"));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  const sourceRoot = path.join(temporaryRoot, "source");
  const outputRoot = path.join(temporaryRoot, "public-site");
  await mkdir(sourceRoot);
  await writeFile(path.join(sourceRoot, "index.html"), "<h1>SANTINO</h1>");
  await writeFile(path.join(sourceRoot, "santino-ui.css"), "body { color: #fff; }");
  await writeFile(path.join(sourceRoot, "robots.txt"), "User-agent: *");
  await writeFile(path.join(sourceRoot, ".env"), "must not be published");
  await writeFile(path.join(sourceRoot, ".nojekyll"), "");

  for (const folder of [".git", ".github", "docs", "scripts", "supabase", "tests"]) {
    const directory = path.join(sourceRoot, folder);
    await mkdir(directory);
    await writeFile(path.join(directory, "private.txt"), "repository-only");
  }

  const copied = await buildPagesSite(sourceRoot, outputRoot);

  assert.deepEqual(copied.sort(), ["index.html", "robots.txt", "santino-ui.css"]);
  assert.equal(await readFile(path.join(outputRoot, "index.html"), "utf8"), "<h1>SANTINO</h1>");
  await access(path.join(outputRoot, ".nojekyll"));

  for (const excluded of [".env", ".git", ".github", "docs", "scripts", "supabase", "tests"]) {
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
