import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseCatalogRows(source, fileName) {
  return source
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => /\{id:"/.test(line))
    .map(({ line, lineNumber }) => {
      const json = line
        .trim()
        .replace(/,$/, "")
        .replace(/([{,]\s*)([A-Za-z_$][\w$]*):/g, '$1"$2":');
      try {
        return JSON.parse(json);
      } catch {
        throw new Error(`Unable to parse a ${fileName} record on line ${lineNumber}`);
      }
    });
}

function sorted(values) {
  return values.sort((left, right) => left.localeCompare(right));
}

export async function auditCatalogSources(root = ROOT) {
  const [decantsSource, bottlesSource, detailsSource] = await Promise.all([
    readFile(path.join(root, "decants.html"), "utf8"),
    readFile(path.join(root, "frascos.html"), "utf8"),
    readFile(path.join(root, "produto.html"), "utf8"),
  ]);

  const decants = parseCatalogRows(decantsSource, "decants");
  const bottles = parseCatalogRows(bottlesSource, "full bottle");
  const details = parseCatalogRows(detailsSource, "product detail");
  const byDecantId = new Map(decants.map((row) => [String(row.id), row]));
  const byBottleId = new Map(bottles.map((row) => [String(row.id), row]));
  const byDetailId = new Map(details.map((row) => [String(row.id), row]));
  const sharedIds = [...byDecantId.keys()].filter((id) => byBottleId.has(id));
  const allCatalogIds = [...new Set([...byDecantId.keys(), ...byBottleId.keys()])];
  const differences = { image: [], identity: [], description: [] };

  for (const id of sharedIds) {
    const decant = byDecantId.get(id);
    const bottle = byBottleId.get(id);
    if (decant.image !== bottle.image) differences.image.push(id);
    if (decant.name !== bottle.name || decant.brand !== bottle.brand) differences.identity.push(id);
    if (decant.description !== bottle.description) differences.description.push(id);
  }

  for (const field of Object.keys(differences)) {
    differences[field] = sorted(differences[field]);
  }

  return {
    entries: {
      decants: decants.length,
      fullBottles: bottles.length,
      sharedIds: sharedIds.length,
      uniqueProducts: allCatalogIds.length,
      productDetails: details.length,
    },
    duplicates: {
      decants: decants.length - byDecantId.size,
      fullBottles: bottles.length - byBottleId.size,
      productDetails: details.length - byDetailId.size,
    },
    detailCoverage: {
      missing: sorted(allCatalogIds.filter((id) => !byDetailId.has(id))),
      orphan: sorted([...byDetailId.keys()].filter((id) => !allCatalogIds.includes(id))),
    },
    differences,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await auditCatalogSources(), null, 2));
}
