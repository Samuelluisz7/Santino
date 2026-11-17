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
  const homeMarkup = html.slice(html.indexOf("<main"), html.indexOf("</main>") + 7);
  assert.match(html, /<body class="home-page">/);
  assert.match(html, /<h1 id="homeHeading">Explorar fragrâncias<\/h1>/);
  for (const href of ['href="frascos.html"', 'href="decants.html"', 'href="kits.html"']) assert.ok(html.includes(href));
  for (const [name, id] of [["Homem Sagaz","homem-sagaz"],["K Max","k-max"],["Nautica Voyage","nautica-voyage"],["The Kingdom","kingdom"]]) {
    assert.match(html, new RegExp('<a class="recommended-card [^"]+" href="produto\\.html\\?id=(?:full-)?' + id + '">'));
    assert.match(html, new RegExp('<strong>' + name + '<\\/strong>'));
  }
  assert.doesNotMatch(homeMarkup, /The Blend Bourbon|home-kits|homeFullSizeGrid/);
  assert.match(html, /recommended-card-nautica/);
  assert.ok(html.includes("<strong>Nautica Voyage</strong>"));
  assert.match(html, /home-refresh\.css/);
  assert.match(decants, /decants-reference-sprite|product-photo/);
});
test("all catalog cards use the same image frame without cropping product photos", async () => {
  const styles = await readFile(path.join(REPOSITORY_ROOT, "santino-ui.css"), "utf8");

  assert.match(styles, /\.products \.product-art[\s\S]*?aspect-ratio: 4 \/ 3/);
  assert.match(styles, /\.products \.product-photo[\s\S]*?object-fit: contain !important/);
  assert.match(styles, /\.products \.product-comparison/);
  assert.match(styles, /\.results \.result-card/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});

test("decants use square inset imagery, compact concentration, a floating volume picker and plus/minus quantity", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8");
  assert.match(html, /\.decant-product-art[\\s\\S]*?aspect-ratio:1\\/1/);
  assert.match(html, /class="volume-picker"/);
  assert.match(html, /class="volume-menu"/);
  assert.match(html, /data-quantity-change="-1"/);
  assert.match(html, /data-quantity-change="1"/);
  assert.match(html, /getCompactConcentration/);
  assert.doesNotMatch(html, /decant-image-note/);
  assert.doesNotMatch(html, /id="qty-[^"]+" aria-label="Quantidade[^"]+"[^>]*>\s*<select/);
  assert.match(html, /data-volume-index/);
  assert.match(html, /data-quantity\)\|\|1/);
});

test("shared perfume details retain the olfactory pyramid", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8");

  assert.match(html, /id="olfactorySection"/);
  assert.match(html, /id="topNotes"/);
  assert.match(html, /id="heartNotes"/);
  assert.match(html, /id="baseNotes"/);
  assert.match(html, /aria-label="Notas de saída, coração e fundo"/);
});

test("perfume details show occasion and note preview before a collapsed additional-information section", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8");
  const summaryIndex = html.indexOf('id="productAdditionalDetails"');
  const previewIndex = html.indexOf('id="notePreview"');
  const accordIndex = html.indexOf('id="accordBars"');
  assert.ok(previewIndex > 0 && summaryIndex > 0 && accordIndex > 0);
  assert.ok(previewIndex < summaryIndex);
  assert.ok(summaryIndex < accordIndex);
  assert.match(html, /<summary>Informações adicionais/);
  assert.match(html, /id="highlightOccasion"/);
  assert.match(html, /id="longevityText"/);
  assert.match(html, /id="projectionText"/);
  assert.match(html, /id="dayNightText"/);
  assert.match(html, /id="seasonsText"/);
  assert.doesNotMatch(html, /Não há avaliação confiável cadastrada/);
  assert.doesNotMatch(html, /Não há classificação cadastrada/);
});

test("shared cart UI animates a product image toward the cart only after local cart count changes", async () => {
  const js = await readFile(path.join(REPOSITORY_ROOT, "santino-ui.js"), "utf8");
  const styles = await readFile(path.join(REPOSITORY_ROOT, "santino-ui.css"), "utf8");
  assert.match(js, /function animateProductToCart/);
  assert.match(js, /readCartCount\(\)/);
  assert.match(js, /#addButton, \[data-add\], \[data-add-full\]/);
  assert.match(js, /setTimeout\(function \(\)/);
  assert.match(styles, /\.santino-cart-flight/);
  assert.match(styles, /\.santino-cart-pulse/);
});

test("cart drawer stays on the current page outside the catalog", async () => {
  const [script, home, product, kits, search] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "santino-ui.js"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "index.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "kits.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "buscar.html"), "utf8"),
  ]);
  assert.match(script, /santino-global-cart-panel/);
  assert.match(script, /function openGlobalCart/);
  assert.match(script, /trigger\.addEventListener|document\.addEventListener\("click"/);
  for (const html of [home, product, kits, search]) {
    assert.match(html, /class="cart-link"/);
  }
  assert.match(script, /santino:cart-updated/);
  assert.match(script, /function checkoutGlobalCart/);
});

test("cart item thumbnails are stored for the shared drawer and catalog cart", async () => {
  const [decants, full, product, kits] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "frascos.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "kits.html"), "utf8"),
  ]);
  for (const html of [decants, full, product, kits]) {
    assert.match(html, /image:p\.image|image:product\.image/);
  }
  const sharedCart = await readFile(path.join(REPOSITORY_ROOT, "santino-ui.js"), "utf8");
  assert.match(sharedCart, /class="santino-global-cart-item"/);
  assert.match(sharedCart, /item\.image/);
  for (const html of [decants, full]) {
    assert.match(html, /function renderCart\(\)/);
    assert.doesNotMatch(html, /id="overlay"|id="cartItems"|id="cartTotal"/);
  }
  assert.match(kits, /window\.dispatchEvent\(new Event\("santino:cart-updated"\)\)/);
  assert.doesNotMatch(kits, /window\.location\.href="decants\.html\?openCart=1"/);
});

test("cashback homepage explains applicable product categories and current self-service limitation", async () => {
  const html = await readFile(path.join(REPOSITORY_ROOT, "index.html"), "utf8");
  assert.match(html, /Válido para decants, frascos inteiros, kits e outros produtos/);
  assert.match(html, /consulta automática de saldo e a aplicação do cashback pelo site ainda não estão disponíveis/i);
});

test("recent Touti products have complete olfactory profiles and FIT Caribe uses the correct reference", async () => {
  const [details, full, decants] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "frascos.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8"),
  ]);
  const profileStart = details.indexOf("Object.assign(PERFUME_INFO,{");
  assert.ok(profileStart > 0);
  for (const id of ["touti-vip-50", "touti-vip-52", "touti-fit-caribe"]) {
    const start = details.indexOf('"' + id + '":{', profileStart);
    assert.ok(start > profileStart, id + " olfactory profile is missing");
    const end = details.indexOf("},", start);
    const profile = details.slice(start, end);
    assert.match(profile, /top:"[^"]+"/);
    assert.match(profile, /heart:"[^"]+"/);
    assert.match(profile, /base:"[^"]+"/);
    assert.match(profile, /referenceNotice:"[^"]+"/);
  }
  assert.match(details, /name:"Touti FIT Caribe · Acqua di Giò Profondo"/);
  assert.match(full, /name:"FIT Caribe · Acqua di Giò Profondo"/);
  assert.match(full, /referenceName:"Acqua di Giò Profondo · Giorgio Armani"/);
  assert.match(decants, /Touti FIT Caribe, referência olfativa Acqua di Giò Profondo/);
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


test("decants and full-bottle pages use the shared side cart without wiping saved items", async () => {
  const [script, decants, full] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "santino-ui.js"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "frascos.html"), "utf8"),
  ]);

  assert.match(script, /document.querySelector\("\.cart-link, \.cart-button"\)/);
  assert.match(script, /\.cart-button, \[data-santino-open-cart\]/);
  assert.match(script, /stopImmediatePropagation\(\)/);
  assert.match(script, /params.get\("openCart"\) === "1"/);

  for (const html of [decants, full]) {
    assert.match(html, /function syncCatalogCartFromStorage/);
    assert.match(html, /window.addEventListener\("santino:cart-updated",syncCatalogCartFromStorage\)/);
    assert.match(html, /window.dispatchEvent\(new Event\("santino:cart-updated"\)\)/);
    assert.doesNotMatch(html, /get\("openCart"\).*openCart\(\)/);
  }
});

test("every catalog perfume declares a concentration and the storefront displays it", async () => {
  const [decants, full, details, home, featured] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "decants.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "frascos.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "index.html"), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "home-featured.js"), "utf8"),
  ]);
  for (const [file, html, expectedCount] of [["decants", decants, 32], ["full bottles", full, 49], ["product details", details, 54]]) {
    const rows = [...html.matchAll(/\{id:"([^"]+)",name:"[^"]+",brand:"[^"]+",concentration:"([^"]+)"/g)];
    assert.equal(rows.length, expectedCount, file + " concentration coverage");
    for (const row of rows) assert.ok(row[2].trim(), file + " missing concentration for " + row[1]);
  }
  assert.match(decants, /product-concentration-tag/);
  assert.match(full, /product-concentration-tag/);
  assert.match(details, /Concentração:/);
  assert.match(home, /recommended-concentration/);
  assert.match(home, /"concentration":"Deo Parfum"/);
  assert.match(featured, /home-product-concentration/);
  assert.match(details, /Não divulgada pela Touti/);
});

