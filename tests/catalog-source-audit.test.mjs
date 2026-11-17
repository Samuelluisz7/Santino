import assert from "node:assert/strict";
import test from "node:test";
import { auditCatalogSources } from "../scripts/audit-catalog-sources.mjs";

const report = await auditCatalogSources();

test("every catalog product has one matching shared detail record", () => {
  assert.deepEqual(report.entries, {
    decants: 32,
    fullBottles: 49,
    sharedIds: 27,
    uniqueProducts: 54,
    productDetails: 54,
  });
  assert.deepEqual(report.duplicates, {
    decants: 0,
    fullBottles: 0,
    productDetails: 0,
  });
  assert.deepEqual(report.detailCoverage, { missing: [], orphan: [] });
});

test("cross-catalog differences are explicit and cannot silently drift", () => {
  assert.deepEqual(report.differences, {
    image: [
      "asad-bourbon",
      "clash",
      "essencial-sentir",
      "eudora-h-acqua",
      "fakhar-black",
      "homem-dom",
      "homem-sagaz",
      "k-max",
      "kingdom",
      "nautica-voyage",
      "quasar-ice",
      "the-blend-bourbon",
    ],
    identity: ["k-max"],
    description: ["full-cebolinha", "full-nautica-voyage"],
  });
});
