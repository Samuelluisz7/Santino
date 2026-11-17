import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [home, refreshStyles, policies, decants, kits, sharedCart] = await Promise.all([
  readFile(path.join(ROOT, "index.html"), "utf8"),
  readFile(path.join(ROOT, "home-refresh.css"), "utf8"),
  readFile(path.join(ROOT, "politicas.html"), "utf8"),
  readFile(path.join(ROOT, "decants.html"), "utf8"),
  readFile(path.join(ROOT, "kits.html"), "utf8"),
  readFile(path.join(ROOT, "santino-ui.js"), "utf8"),
]);

test("homepage uses top navigation and one explore section without duplicated category shortcuts", () => {
  const homeMarkup = home.slice(home.indexOf("<main"), home.indexOf("</main>") + 7);
  assert.match(home, /<nav class="catalog-nav" aria-label="Categorias do catálogo">/);
  for (const href of ['href="frascos.html"', 'href="decants.html"', 'href="kits.html"']) assert.ok(home.includes(href));
  assert.match(home, /<h1 id="homeHeading">Explorar fragrâncias<\/h1>/);
  assert.doesNotMatch(homeMarkup, /home-pathway-grid|home-full-size-grid|homeFullSizeGrid|home-kits/);
  assert.match(homeMarkup, /class="home-full-bottle-hero"/);
  assert.match(homeMarkup, /id="homeFeaturedGrid"/);
  assert.doesNotMatch(home, /<a href="#cashback-santino">Cashback<\/a>/);
});

test("homepage displays exactly the approved four asymmetric recommendations", async () => {
  const expected = [
    ["Homem Sagaz", "produto.html?id=full-homem-sagaz"],
    ["K Max", "produto.html?id=full-k-max"],
    ["Nautica Voyage", "produto.html?id=full-nautica-voyage"],
    ["The Kingdom", "produto.html?id=full-kingdom"],
  ];
  const cards = [...home.matchAll(/<a class="recommended-card [^"]+" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, 4);
  for (let i = 0; i < expected.length; i++) {
    assert.equal(cards[i][1], expected[i][1]);
    assert.match(cards[i][2], new RegExp("<strong>" + expected[i][0] + "<\\/strong>"));
    assert.match(cards[i][2], /<img src="https:\/\//);
  }
  assert.doesNotMatch(home, /T-Blend Bourbon|the-blend-bourbon/);
  const detail = await readFile(path.join(ROOT, "produto.html"), "utf8");
  for (const [, href] of expected) {
    const id = new URL(href, "https://santino.example/").searchParams.get("id");
    assert.match(detail, new RegExp('id:"' + id + '"|"' + id + '":'));
  }
  assert.match(refreshStyles, /grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(refreshStyles, /grid-column:span 7/);
  assert.match(refreshStyles, /@media\(max-width:760px\)/);
});

test("decant promotion explains the approved cumulative 10% rule", () => {
  assert.match(home, /10% OFF em decants/);
  assert.match(home, /A partir de R\$ 80 em decants, o desconto é calculado sobre todo o subtotal elegível/);
  assert.match(sharedCart, /decantSubtotal >= 80 \? decantSubtotal \* 0\.10 : 0/);
  assert.match(sharedCart, /category === "Decant"/);
});

test("benefits are accessible through a floating tab and terms remain explicit", () => {
  assert.match(home, /class="home-benefits-float" id="homeBenefitsTrigger" type="button"/);
  assert.match(home, /id="homeBenefitsDialog" hidden/);
  const mainMarkup = home.slice(home.indexOf("<main"), home.indexOf("</main>") + 7);
  assert.doesNotMatch(mainMarkup, /class="home-benefits"/);
  assert.match(home, /role="dialog" aria-modal="true" aria-labelledby="benefitsHeading"/);
  assert.match(home, /id="beneficios"/);
  assert.match(home, /5% do valor efetivamente pago pelos produtos/);
  assert.match(home, /depois dos descontos/);
  assert.match(home, /confirmação do pagamento/);
  assert.match(home, /Validade de 90 dias/);
  assert.match(home, /até 100% do valor dos produtos/);
  assert.match(home, /frete é pago à parte/);
  assert.match(home, /não pode ser convertido em dinheiro/);
  assert.match(home, /consulta automática de saldo e a aplicação do cashback pelo site ainda não estão disponíveis/i);
  assert.doesNotMatch(home, /wa\.me\/.*cashback/i);
  assert.match(policies, /<strong>Cashback SANTINO:<\/strong> o cliente recebe 5%/);
});

test("homepage retains the category navigation and links only to existing pages", async () => {
  const hrefs = [...home.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (/^https?:\/\//i.test(href) || href.startsWith("#")) continue;
    const relativePath = href.split("#")[0].split("?")[0];
    await access(path.join(ROOT, relativePath));
  }
  assert.match(kits, /const KITS|const kits|id:"/i);
});

test("homepage uses readable responsive styling and reduced-motion support", () => {
  assert.match(home, /home-refresh\.css\?v=/);
  assert.match(refreshStyles, /color:#f3eadb/);
  assert.match(refreshStyles, /@media\(max-width:420px\)/);
  assert.match(refreshStyles, /prefers-reduced-motion:reduce/);
});


test("homepage perfume banner is compact on mobile while keeping the full-bottle-first sequence", () => {
  assert.match(refreshStyles, /\.home-full-bottle-hero img\{aspect-ratio:16\/8\.2!important;max-height:185px!important/);
  assert.ok(home.indexOf('class="home-full-bottle-hero"') < home.indexOf('id="homeFeaturedGrid"'));
});
