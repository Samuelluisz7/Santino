import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const MIGRATIONS_DIRECTORY = path.join(
  REPOSITORY_ROOT,
  "supabase",
  "migrations",
);

test("olfactory profile migration preserves the existing perfume detail fields safely", async () => {
  const files = (await readdir(MIGRATIONS_DIRECTORY)).filter((name) =>
    /^\d{14}_olfactory_profiles\.sql$/.test(name),
  );
  assert.equal(files.length, 1, "one CLI-versioned olfactory profile migration must exist");

  const [sql, productPage] = await Promise.all([
    readFile(path.join(MIGRATIONS_DIRECTORY, files[0]), "utf8"),
    readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8"),
  ]);

  assert.match(sql, /create table public\.product_olfactory_profiles/i);
  assert.match(sql, /product_id bigint primary key/i);
  assert.match(sql, /references public\.products \(id\) on delete restrict/i);
  for (const column of [
    "family",
    "top_notes",
    "heart_notes",
    "base_notes",
    "intro",
    "story",
    "occasion",
    "climate",
    "accords",
  ]) {
    assert.match(sql, new RegExp(`\\b${column}\\b`), `${column} must be represented in the profile`);
  }

  assert.match(productPage, /family:/);
  assert.match(productPage, /top:/);
  assert.match(productPage, /heart:/);
  assert.match(productPage, /base:/);
  assert.match(productPage, /PRODUCT_STORIES/);
  assert.match(productPage, /accords:/);

  assert.match(sql, /alter table public\.product_olfactory_profiles enable row level security/i);
  assert.match(sql, /product_olfactory_profiles_active_read[\s\S]*?and product\.is_active/i);
  assert.match(sql, /revoke all on table public\.product_olfactory_profiles[\s\S]*?from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.product_olfactory_profiles[\s\S]*?to service_role/i);
  assert.doesNotMatch(sql, /\b(drop\s+table|truncate(?:\s+table)?|delete\s+from|insert\s+into\s+public\.)\b/i);
  assert.doesNotMatch(sql, /pesquisas_santino/i);
});


test("product pyramid uses horizontal accord bars and three compact note rows with colored dots", async () => {
  const productPage = await readFile(path.join(REPOSITORY_ROOT, "produto.html"), "utf8");
  assert.match(productPage, /id="santino-pyramid-reference"/);
  assert.match(productPage, /grid-template-columns:75px minmax\(0,1fr\)!important/);
  assert.match(productPage, /\.note-accords \.accord-row/);
  assert.match(productPage, /class="note-dot" aria-hidden="true"/);
  assert.match(productPage, /class="note-name"/);
  assert.doesNotMatch(productPage, /picture='<a class="note-image-shell"/);
});
