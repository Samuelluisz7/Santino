import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("home page presents the approved recommendation cards and keeps catalog navigation", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "index.html"), "utf8");
  const decants = await readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8");
  assert.match(html, /<body class="home-page">/);
  assert.match(html, /<h1 id="homeHeading">Explorar fragrâncias<\/h1>/);
  for (const href of ['href="frascos.html"', 'href="decants.html"', 'href="kits.html"']) assert.ok(html.includes(href));
  for (const [name, id] of [["Homem Sagaz","homem-sagaz"],["K Max","k-max"],["Clash","clash"],["The Kingdom","kingdom"]]) {
    assert.match(html, new RegExp('<a class="recommended-card [^"]+" href="produto\\.html\\?id=' + id + '">'));
    assert.match(html, new RegExp('<strong>' + name + '<\\/strong>'));
  }
  assert.doesNotMatch(html, /The Blend Bourbon|home-kits|homeFeaturedGrid|homeFullSizeGrid/);
  assert.match(html, /home-refresh\.css/);
  assert.match(decants, /decant-vial-overlay/);
  assert.match(decants, /decant-image-note/);
});
test("all catalog cards use the same image frame without cropping product photos", async () => {
  const styles = await readFile(path.join(REPOSITORY_ROOT, "santino-ui.css"), "utf8");

  assert.match(styles, /\.products \.product-art[\s\S]*?aspect-ratio: 4 \/ 3/);
  assert.match(styles, /\.products \.product-photo[\s\S]*?object-fit: contain !important/);
  assert.match(styles, /\.products \.product-comparison/);
  assert.match(styles, /\.results \.result-card/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});

test("shared perfume details retain the olfactory pyramid", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8");

  assert.match(html, /id="olfactorySection"/);
  assert.match(html, /id="topNotes"/);
  assert.match(html, /id="heartNotes"/);
  assert.match(html, /id="baseNotes"/);
  assert.match(html, /aria-label="Notas de saída, coração e fundo"/);
});

test("shared perfume details provide a responsive mobile purchase bar", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8");
  const styles = await readFile(path.join(REPOSITORY_ROOT, "sticky-purchase.css"), "utf8");

  assert.match(html, /class="perfume-detail-page"/);
  assert.match(html, /id="stickyPurchaseBar"[^>]*role="region"[^>]*aria-label="Compra rápida"[^>]*aria-hidden="true"/);
  assert.match(html, /id="stickyAddButton"/);
  assert.match(html, /SantinoStickyPurchase\.init/);
  assert.match(html, /stickyPurchase\?\.refresh\(\)/);
  assert.ok(html.includes("const price=isFull?(currentVolume?currentVolume.price:product.price):currentVolume?.price"));
  assert.match(styles, /#stickyPurchaseBar\.is-visible/);
  assert.match(styles, /@media \(max-width: 760px\)/);
});
