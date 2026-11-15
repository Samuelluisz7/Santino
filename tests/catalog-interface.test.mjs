import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("home page presents direct, distinct paths into the catalog", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "index.html"), "utf8");

  assert.match(html, /<body class="home-page">/);
  assert.match(html, /id="homeHeading"/);
  assert.match(html, /href="decants\.html"[^>]*>Escolher um decant/);
  assert.match(html, /href="kits\.html"[^>]*>Explorar os kits/);
  assert.match(html, /class="home-pathways"/);
  assert.match(html, /class="home-offer-link" href="#promocoes"/);
  assert.match(html, /class="home-help-link" href="https:\/\/wa\.me\/5531996312579/);
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

