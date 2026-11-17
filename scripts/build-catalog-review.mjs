import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = [
  ["decants", "decants.html"],
  ["fullBottles", "frascos.html"],
  ["productDetails", "produto.html"],
];
const REVIEW_FIELDS = ["name", "brand", "description"];

function parseRows(source, fileName) {
  return source
    .split(/\r?\n/)
    .filter((line) => /\{id:"/.test(line))
    .map((line) => {
      const json = line
        .trim()
        .replace(/,$/, "")
        .replace(/([{,]\s*)([A-Za-z_$][\w$]*):/g, '$1"$2":');
      try {
        return JSON.parse(json);
      } catch {
        throw new Error("Unable to parse catalog entry in " + fileName);
      }
    });
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))];
}

export async function buildCatalogReview(root = ROOT) {
  const observations = {};
  const sourceCounts = {};

  for (const [sourceName, fileName] of SOURCES) {
    const content = await readFile(path.join(root, fileName), "utf8");
    const rows = parseRows(content, fileName);
    sourceCounts[sourceName] = rows.length;
    for (const row of rows) {
      if (!observations[row.id]) observations[row.id] = {};
      if (!observations[row.id][sourceName]) observations[row.id][sourceName] = [];
      observations[row.id][sourceName].push(row);
    }
  }

  const products = Object.keys(observations).sort().map((id) => {
    const sources = observations[id];
    const records = Object.values(sources).flat();
    const conflicts = {};
    for (const field of REVIEW_FIELDS) {
      const values = unique(records.map((record) => record[field]));
      if (values.length > 1) conflicts[field] = values;
    }
    const imageValues = unique(records.map((record) => record.image));
    if (imageValues.length > 1) conflicts.image = imageValues;

    return {
      id,
      sources,
      conflicts,
      importReady: !("name" in conflicts || "brand" in conflicts || "description" in conflicts),
    };
  });

  const needsReviewProductIds = products.filter((product) => !product.importReady).map((product) => product.id);
  return {
    formatVersion: 1,
    sourceCounts,
    productCount: products.length,
    products,
    needsReviewProductIds,
    importReadyProductIds: products.filter((product) => product.importReady).map((product) => product.id),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await buildCatalogReview(), null, 2));
}
