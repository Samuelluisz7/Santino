import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogReview } from "../scripts/build-catalog-review.mjs";

const review = await buildCatalogReview();
const byId = new Map(review.products.map((product) => [product.id, product]));

test("review export preserves source coverage and every catalog identity", () => {
  assert.deepEqual(review.sourceCounts, {
    decants: 32,
    fullBottles: 49,
    productDetails: 54,
  });
  assert.equal(review.productCount, 54);
  assert.equal(review.products.length, 54);
  assert.deepEqual(review.needsReviewProductIds, [
    "full-cebolinha",
    "full-nautica-voyage",
    "k-max",
  ]);
  assert.equal(review.importReadyProductIds.length, 51);
});

test("conflicting commercial text is retained by source and excluded from import-ready set", () => {
  assert.deepEqual(byId.get("k-max").conflicts, {
    name: ["Natura K Max", "Natura Kaiak K Max"],
    brand: ["Natura", "Natura Kaiak"],
  });
  assert.deepEqual(byId.get("full-cebolinha").conflicts.description, [
    "Colônia masculina fougère refrescante da Turma da Mônica, em frasco de 50 ml. Consulte a SANTINO para disponibilidade e condições.",
    "Colônia masculina fougère refrescante da Turma da Mônica, em frasco de 25 ml. Consulte a SANTINO para disponibilidade e condições.",
  ]);
  assert.equal(byId.get("k-max").importReady, false);
  assert.equal(byId.get("full-nautica-voyage").importReady, false);
  assert.equal(byId.get("full-cebolinha").importReady, false);
});

test("image differences are retained as source observations for variant-specific mapping", () => {
  const kingdom = byId.get("kingdom");
  assert.ok(kingdom.conflicts.image);
  assert.equal(kingdom.sources.decants[0].image !== kingdom.sources.fullBottles[0].image, true);
});
