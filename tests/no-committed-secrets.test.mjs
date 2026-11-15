import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const SKIPPED_DIRECTORIES = new Set([".git", "site"]);
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".sql",
  ".toml",
  ".txt",
  ".yaml",
  ".yml",
]);
const FORBIDDEN_SECRET_PATTERNS = [
  /\bsb_secret_[A-Za-z0-9_-]{12,}/i,
  /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*["'][^"']+["']/i,
  /\b(?:sk|rk)_live_[A-Za-z0-9]{10,}\b/i,
  /\bwhsec_[A-Za-z0-9]{10,}\b/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/,
];

function isTextFile(name) {
  const normalized = name.toLowerCase();
  return (
    TEXT_EXTENSIONS.has(path.extname(normalized)) ||
    normalized === ".env" ||
    normalized.startsWith(".env.")
  );
}

async function collectTextFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...await collectTextFiles(path.join(directory, entry.name)));
      }
      continue;
    }

    if (!entry.isFile() || !isTextFile(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (path.resolve(file) === fileURLToPath(import.meta.url)) continue;
    files.push(file);
  }

  return files;
}

test("repository text files contain no recognizable secrets", async () => {
  const files = await collectTextFiles(REPOSITORY_ROOT);
  const findings = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
      if (pattern.test(content)) findings.push(path.relative(REPOSITORY_ROOT, file));
    }
  }

  assert.deepEqual([...new Set(findings)], []);
});
