import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("decants and full-bottle pages persist products into the single shared cart", async () => {
  const [decants, full] = await Promise.all([
    readFile(path.join(ROOT, "decants.html"), "utf8"),
    readFile(path.join(ROOT, "frascos.html"), "utf8"),
  ]);
  for (const html of [decants, full]) {
    assert.match(html, /function renderCart\(\)/);
    assert.match(html, /localStorage\.setItem\("santino_nobre_cart", JSON\.stringify\(cart\)\)/);
    assert.match(html, /window\.dispatchEvent\(new Event\("santino:cart-updated"\)\)/);
    assert.doesNotMatch(html, /id="overlay"|id="cartItems"|id="cartTotal"|function openCart\(\)/);
  }
});

test("shared cart renders escaped product data and a compact empty state", async () => {
  const [shared, styles] = await Promise.all([
    readFile(path.join(ROOT, "santino-ui.js"), "utf8"),
    readFile(path.join(ROOT, "santino-ui.css"), "utf8"),
  ]);
  assert.match(shared, /function renderGlobalCart\(\)/);
  assert.match(shared, /globalCartEscape\(item\.name\)/);
  assert.match(shared, /globalCartEscape\(item\.brand\)/);
  assert.match(shared, /globalCartEscape\(item\.key\)/);
  assert.match(shared, /footer\.hidden = items\.length === 0/);
  assert.match(shared, /Seu carrinho está vazio/);
  assert.match(shared, /Ver frascos inteiros/);
  assert.match(shared, /Explorar decants/);
  assert.match(shared, /item\.image/);
  assert.match(styles, /\.santino-global-cart-footer\[hidden\]\{display:none!important\}/);
  assert.match(styles, /\.santino-global-cart-empty/);
});
