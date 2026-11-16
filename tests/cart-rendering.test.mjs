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


test("empty cart hides totals and checkout and offers direct catalog paths", async () => {
  const [decants, full, shared, styles] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "frascos.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "santino-ui.js"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "santino-ui.css"), "utf8"),
  ]);
  for (const html of [decants, full]) {
    assert.match(html, /cartTotal[^\n]*closest\("\.cart-total"\)\.hidden=emptyCart/);
    assert.match(html, /Ver frascos inteiros/);
    assert.match(html, /Explorar decants/);
  }
  assert.match(shared, /footer\.hidden = items\.length === 0/);
  assert.match(shared, /Seu carrinho está vazio/);
  assert.match(styles, /\.santino-global-cart-footer\[hidden\]\{display:none!important\}/);
});
