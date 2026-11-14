import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

for (const page of ["decants.html", "frascos.html"]) {
  test(`${page} escapes browser-storage values in cart markup`, async () => {
    const html = await readFile(path.join(REPOSITORY_ROOT, page), "utf8");
    const match = html.match(/cart\.map\(x=>`([\s\S]*?)`\)\.join/);
    assert.ok(match, "cart markup template must be present");

    const template = match[1];
    for (const field of ["key", "ml", "qty"]) {
      assert.ok(
        template.includes(`escapeHTML(x.${field})`),
        `${field} must be escaped before insertion into HTML`,
      );
    }
  });
}
