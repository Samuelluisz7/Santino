import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [home, featured, styles, storefront, decants, kits, policies] = await Promise.all([
  readFile(path.join(ROOT, "index.html"), "utf8"),
  readFile(path.join(ROOT, "home-featured.js"), "utf8"),
  readFile(path.join(ROOT, "santino-ui.css"), "utf8"),
  readFile(path.join(ROOT, "home-storefront.css"), "utf8"),
  readFile(path.join(ROOT, "decants.html"), "utf8"),
  readFile(path.join(ROOT, "kits.html"), "utf8"),
  readFile(path.join(ROOT, "politicas.html"), "utf8"),
]);

function featuredProducts() {
  const match = home.match(/<script type="application\/json" id="homeFeaturedProducts">([\s\S]*?)<\/script>/);
  assert.ok(match, "homepage contains its curated catalog data");
  return JSON.parse(match[1]);
}

test("homepage selection uses existing catalog names, images, and exact prices", () => {
  const products = featuredProducts();
  assert.equal(products.length, 4);

  for (const product of products) {
    const catalogLine = decants.split(/\r?\n/).find((line) => line.includes(`{id:"${product.id}",`));
    assert.ok(catalogLine, `${product.id} exists in the decants catalog`);
    assert.ok(catalogLine.includes(`name:${JSON.stringify(product.name)}`));
    assert.ok(catalogLine.includes(`brand:${JSON.stringify(product.brand)}`));
    assert.ok(catalogLine.includes(`image:${JSON.stringify(product.image)}`));
    const prices = catalogLine.match(/volumes:\[\{ml:5,price:([\d.]+)\},\{ml:10,price:([\d.]+)\}\]/);
    assert.ok(prices, `${product.id} has the current 5 ml and 10 ml prices`);
    assert.equal(product.prices[5], Number(prices[1]));
    assert.equal(product.prices[10], Number(prices[2]));
  }
});

test("featured products preserve the existing cart and detail-page contracts", () => {
  assert.match(home, /id="homeFeaturedGrid"/);
  assert.match(home, /id="homeFeaturedStatus"[^>]*aria-live="polite"/);
  assert.match(home, /home-featured\.js/);
  assert.match(featured, /produto\.html\?id=/);
  assert.match(featured, /santino_nobre_cart/);
  assert.match(featured, /category: "Decant"/);
  assert.match(featured, /key: key/);
  assert.match(featured, /ml: ml/);
  assert.match(featured, /price: amount/);
  assert.match(featured, /qty: 1/);
  assert.match(featured, /image\.referrerPolicy = "no-referrer"/);
});

test("homepage product controls add the selected volume without replacing the cart", () => {
  class Element {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.hidden = false;
      this.value = "";
      this.textContent = "";
      this.dataset = {};
    }
    append(...elements) {
      for (const element of elements) {
        if (this.tagName === "select" && this.children.length === 0 && !this.value) this.value = element.value;
        this.children.push(element);
      }
    }
    addEventListener(type, callback) {
      (this.listeners[type] ||= []).push(callback);
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    dispatch(type) {
      for (const callback of this.listeners[type] || []) callback();
    }
  }

  const saved = [{ key: "existing-5", qty: 2 }];
  const storage = {
    getItem(key) { return key === "santino_nobre_cart" ? JSON.stringify(saved) : null; },
    setItem(key, value) {
      assert.equal(key, "santino_nobre_cart");
      saved.splice(0, saved.length, ...JSON.parse(value));
    },
  };
  const counters = [new Element("span")];
  const grid = new Element("div");
  const status = new Element("p");
  const source = new Element("script");
  source.textContent = JSON.stringify(featuredProducts());
  const elements = { homeFeaturedGrid: grid, homeFeaturedStatus: status, homeFeaturedProducts: source };
  const context = {
    document: {
      getElementById(id) { return elements[id] || null; },
      createElement(tagName) { return new Element(tagName); },
      querySelectorAll(selector) { return selector === "#homeCartCount" ? counters : []; },
    },
    window: { localStorage: storage },
    Intl,
    encodeURIComponent,
  };

  vm.runInNewContext(featured, context);
  assert.equal(grid.children.length, 4);
  const firstCard = grid.children[0];
  const controls = firstCard.children[1];
  const volume = controls.children[0].children[0];
  const price = controls.children[1];
  const add = firstCard.children[2];
  const image = firstCard.children[0].children[0].children[0];
  const fallback = firstCard.children[0].children[0].children[1];

  assert.equal(volume.value, "5");
  assert.equal(price.textContent, "R$ 18,90");
  add.dispatch("click");
  assert.deepEqual(JSON.parse(JSON.stringify(saved[1])), {
    key: "kingdom-5", id: "kingdom", name: "The Kingdom", brand: "Lattafa",
    ml: 5, price: 18.9, qty: 1, category: "Decant",
  });
  add.dispatch("click");
  assert.equal(saved[1].qty, 2);
  volume.value = "10";
  volume.dispatch("change");
  assert.equal(price.textContent, "R$ 35,90");
  add.dispatch("click");
  assert.equal(saved[2].key, "kingdom-10");
  assert.equal(saved[2].price, 35.9);
  assert.equal(counters[0].textContent, "5");
  assert.match(status.textContent, /The Kingdom de 10 ml foi adicionado/);

  image.dispatch("error");
  assert.equal(image.hidden, true);
  assert.equal(fallback.hidden, false);
});

test("cashback display matches the approved rules without inventing a balance", () => {
  assert.match(home, /5% do valor pago pelos produtos/);
  assert.match(home, /após descontos/);
  assert.match(home, /confirmação do pagamento/);
  assert.match(home, /90 dias/);
  assert.match(home, /acumulável com descontos e promoções de produtos/);
  assert.match(home, /até 100% do valor dos produtos/);
  assert.match(home, /frete é pago à parte/);
  assert.match(home, /sem conversão em dinheiro/);
  assert.match(home, /Não há consulta de saldo ou aplicação automática no site ainda/);
  assert.doesNotMatch(home, /R\$\s?\d+[,.]\d{2}\s*(?:disponíveis|para usar|de saldo)/i);
  assert.match(policies, /<strong>Cashback SANTINO:<\/strong> o cliente recebe 5%/);
  assert.match(policies, /vale por 90 dias/);
  assert.match(policies, /As regras do crédito de indicação descritas acima são independentes/);
});

test("homepage category and kit links resolve to real pages and kit IDs", async () => {
  const kitIds = new Set([...kits.matchAll(/\{id:"([^"]+)"/g)].map((match) => `kit-${match[1]}`));
  const links = [...home.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);

  for (const href of links) {
    if (/^https?:\/\//i.test(href)) continue;
    const [relativePath, fragment] = href.split("#");
    const filePath = relativePath ? path.join(ROOT, relativePath.split("?")[0]) : path.join(ROOT, "index.html");
    await access(filePath);
    if (!fragment) continue;
    if (relativePath === "kits.html") assert.ok(kitIds.has(fragment), `${href} names an existing kit`);
    else assert.ok(home.includes(`id="${fragment}"`), `${href} names an existing homepage section`);
  }
});

test("homepage follows the reference structure without unverified popularity claims", () => {
  assert.match(home, /home-hero/);
  assert.match(home, /home-pathways/);
  assert.match(home, /home-featured/);
  assert.match(home, /id="promocoes"/);
  assert.match(home, /home-cashback/);
  assert.match(home, /home-kits/);
  assert.doesNotMatch(home, /mais vendidos|best sellers|mais populares|avaliaç(?:ão|ões)|\b\d(?:\.\d)?\s*\(\d+\)/i);
  assert.match(styles, /aspect-ratio: 4 \/ 3/);
  assert.match(styles, /object-fit: contain/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});
test("homepage places purchase assurances before featured products and offers", () => {
  const hero = home.indexOf('<section class="hero home-hero"');
  const categories = home.indexOf('<section class="home-pathways"');
  const products = home.indexOf('<section class="home-featured"');
  const trust = home.indexOf('<section class="service-strip"');
  const offers = home.indexOf('<section class="promo-grid"');
  assert.ok(hero >= 0 && hero < categories);
  assert.ok(categories < trust && trust < products && products < offers);
  assert.match(home, /Descubra seu próximo perfume, começando pelo decant\./);
  assert.match(home, /<nav class="home-pathway-grid" aria-label="Comprar por categoria">/);
  assert.match(home, /href="decants\.html"[\s\S]*?<strong>Decants<\/strong>/);
  assert.match(home, /href="frascos\.html"[\s\S]*?<strong>Frascos inteiros<\/strong>/);
  assert.match(home, /href="kits\.html"[\s\S]*?<strong>Kits<\/strong>/);
  assert.match(styles, /min-height: 420px/);
  assert.match(styles, /grid-auto-columns: minmax\(190px, 77%\)/);
});


test("homepage loads the redesigned storefront presentation", () => {
  assert.ok(home.includes("home-storefront.css?v=20261115-5"));
  assert.ok(storefront.includes("min-height: clamp(540px, 55vw, 710px)"));
  assert.ok(storefront.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"));
  assert.ok(storefront.includes("aspect-ratio: 1 / 1"));
  assert.ok(storefront.includes("@media (max-width: 720px)"));
  assert.ok(storefront.includes("@media (prefers-reduced-motion: reduce)"));
});
