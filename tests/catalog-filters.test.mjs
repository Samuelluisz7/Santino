import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("both catalogs expose one collapsed Filtros control", async () => {
  for (const page of ["frascos.html", "decants.html"]) {
    const html = await readFile(path.join(ROOT, page), "utf8");
    assert.match(html, /class="catalog-filter-toggle"[^>]*>Filtros/);
    assert.match(html, /class="catalog-filter-panel"[^>]*hidden/);
    assert.match(html, /Todas as marcas/);
    assert.match(html, /Mais relevantes/);
    assert.match(html, /Menor preço/);
    assert.match(html, /Maior preço/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /catalog-filters\.css\?v=20261116-1/);
  }
});

test("Natura and Natura Kaiak are grouped under Natura while line identity remains visible", async () => {
  const [full, decants] = await Promise.all([
    readFile(path.join(ROOT, "frascos.html"), "utf8"),
    readFile(path.join(ROOT, "decants.html"), "utf8"),
  ]);
  for (const html of [full, decants]) {
    assert.match(html, /function getBrandKey\(product\)\{return \/natura\/i\.test/);
    assert.match(html, /?"Natura":String\(product\.brand\|\|""\)\.trim\(\)/);
    assert.match(html, /Natura · Kaiak/);
  }
});

test("price ordering is ascending or descending without changing the default recommendation order", async () => {
  const [full, decants] = await Promise.all([
    readFile(path.join(ROOT, "frascos.html"), "utf8"),
    readFile(path.join(ROOT, "decants.html"), "utf8"),
  ]);
  for (const html of [full, decants]) {
    assert.match(html, /sort==="price-asc"/);
    assert.match(html, /sort==="price-desc"/);
    assert.match(html, /value="featured">Mais relevantes/);
  }
});
