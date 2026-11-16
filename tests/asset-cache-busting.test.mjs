import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_VERSION = "20261116-8";

test("all local styles and scripts use the current cache version", async () => {
  const pages = (await readdir(ROOT)).filter((file) => file.toLowerCase().endsWith(".html"));
  assert.ok(pages.length > 0, "the site contains HTML pages");

  for (const page of pages) {
    const html = await readFile(path.join(ROOT, page), "utf8");
    const tags = html.split("<").filter((tag) => tag.startsWith("link ") || tag.startsWith("script "));
    const assets = tags.flatMap((tag) => {
      const match = tag.match(/(?:href|src)="([^"]+)"/);
      if (!match) return [];
      const url = match[1];
      if (url.startsWith("https://") || url.startsWith("//")) return [];
      if (!url.includes(".css") && !url.includes(".js")) return [];
      return [{ tag, url }];
    });

    assert.ok(assets.length > 0, `${page} references local CSS or JavaScript`);
    for (const { url } of assets) {
      const parsed = new URL(url, "https://santino.invalid");
      assert.equal(
        parsed.searchParams.get("v"),
        ASSET_VERSION,
        `${page} cache-busts ${parsed.pathname} with the current release`,
      );
    }
  }
});
