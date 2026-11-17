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
    assert.match(html, /catalog-brand-trigger/);
    assert.match(html, /catalog-brand-options/);
    assert.match(html, /role="listbox"/);
    assert.match(html, /Todas as marcas/);
    assert.match(html, /Mais relevantes/);
    assert.match(html, /Menor preço/);
    assert.match(html, /Maior preço/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /role="dialog" aria-modal="true"/);
    assert.match(html, /Preço mínimo/);
    assert.match(html, /Preço máximo/);
    assert.match(html, /Limpar filtros/);
    assert.doesNotMatch(html, /Mais recentes/);
    const navStart = html.indexOf('<nav class="catalog-nav"');
    const navEnd = html.indexOf("</nav>", navStart);
    const nav = navStart >= 0 && navEnd >= 0 ? html.slice(navStart, navEnd) : "";
    assert.ok(nav.indexOf('href="frascos.html"') < nav.indexOf('href="decants.html"'));
    assert.ok(nav.indexOf("href=\"frascos.html\"") < nav.indexOf("href=\"decants.html\""));
    assert.ok(html.includes('addEventListener("input",renderProducts)') || html.includes('addEventListener("input",renderFullSizeProducts)'));
    assert.match(html, /catalog-filters\.css\?v=20261116-8/);
  }
  const styles = await readFile(path.join(ROOT, "catalog-filters.css"), "utf8");
  assert.match(styles, /\.catalog-filter-panel\.is-open/);
  assert.match(styles, /body\.catalog-filters-open::before/);
  assert.match(styles, /\.catalog-brand-trigger/);
  assert.match(styles, /\.catalog-brand-option\.is-selected/);
});

test("Natura and Natura Kaiak are grouped under Natura while line identity remains visible", async () => {
  const [full, decants] = await Promise.all([
    readFile(path.join(ROOT, "frascos.html"), "utf8"),
    readFile(path.join(ROOT, "decants.html"), "utf8"),
  ]);
  for (const html of [full, decants]) {
    assert.ok(html.includes('function getBrandKey(product){return /natura/i.test(String(product.brand||""))?"Natura":String(product.brand||"").trim()}'));
    assert.ok(html.includes('"Natura · Kaiak"'));
  }
});

test("price ordering is ascending or descending without changing the default recommendation order", async () => {
  const [full, decants] = await Promise.all([
    readFile(path.join(ROOT, "frascos.html"), "utf8"),
    readFile(path.join(ROOT, "decants.html"), "utf8"),
  ]);
  for (const html of [full, decants]) {
    assert.ok(html.includes('sort==="price-asc"'));
    assert.ok(html.includes('sort==="price-desc"'));
    assert.ok(html.includes('value="featured">Mais relevantes / mais vendidos'));
  }
});

test("product performance facts hide completely when their values are unavailable", async () => {
 const html = await readFile(path.join(ROOT, "produto.html"), "utf8");
 assert.match(html, /fact\.hidden=!value\|\|!value\.textContent\.trim\(\)/);
 assert.match(html, /if\(noteFacts\)noteFacts\.hidden=!noteFacts\.querySelector/);
 assert.doesNotMatch(html, /id="longevityText">Não há avaliação confiável cadastrada/);
});


test("full-size catalog starts on national products and switches compactly to imports", async () => {
  const html = await readFile(path.join(ROOT, "frascos.html"), "utf8");
  assert.match(html, /class="full-size-origin-switch"/);
  assert.match(html, /data-full-size-origin="Nacional" aria-pressed="true">Nacionais/);
  assert.match(html, /data-full-size-origin="Importado" aria-pressed="false">Importados/);
  assert.match(html, /let currentFullSizeOrigin="Nacional"/);
  assert.match(html, /function getFullSizeProductsForOrigin\(\)\{return FULL_SIZE_PRODUCTS\.filter\(product=>getProductOrigin\(product\)===currentFullSizeOrigin\)\}/);
  assert.match(html, /let items=getFullSizeProductsForOrigin\(\)\.filter\(p=>/);
  assert.match(html, /getFullSizeProductsForOrigin\(\)\.map\(getBrandKey\)/);
  assert.match(html, /currentFullSizeOrigin=nextOrigin;[\s\S]*?populateFullSizeBrandFilter\(\);[\s\S]*?renderFullSizeProducts\(\)/);
});


test("full-size catalog cards are compact while the grid keeps continuous scrolling", async () => {
  const [html, styles] = await Promise.all([
    readFile(path.join(ROOT, "frascos.html"), "utf8"),
    readFile(path.join(ROOT, "full-size-compact.css"), "utf8"),
  ]);
  assert.match(html, /full-size-compact\.css/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /aspect-ratio: 1\.48 \/ 1/);
  assert.match(styles, /object-fit: contain/);
  assert.match(styles, /min-height: 37px/);
  assert.doesNotMatch(html, /pagination|nextPage|pageSize|loadMoreButton/i);
  assert.match(html, /items\.map\(p\s*=>/);
});
