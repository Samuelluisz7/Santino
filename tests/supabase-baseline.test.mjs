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
const baselineFiles = (await readdir(MIGRATIONS_DIRECTORY)).filter((name) =>
  /^\d{14}_baseline_pesquisas_santino\.sql$/.test(name),
);
const catalogFiles = (await readdir(MIGRATIONS_DIRECTORY)).filter((name) =>
  /^\d{14}_catalog_core\.sql$/.test(name),
);

test("versioned baseline preserves the legacy search table and its access rules", async () => {
  assert.equal(baselineFiles.length, 1, "one CLI-versioned baseline must exist");

  const sql = await readFile(
    path.join(MIGRATIONS_DIRECTORY, baselineFiles[0]),
    "utf8",
  );

  assert.match(sql, /create table if not exists public\.pesquisas_santino/i);
  assert.match(sql, /id bigint generated always as identity not null/i);
  assert.match(sql, /termo text not null/i);
  assert.match(sql, /pesquisado_em timestamp with time zone not null default now\(\)/i);
  assert.match(sql, /alter table public\.pesquisas_santino enable row level security/i);
  assert.match(sql, /grant insert on table public\.pesquisas_santino to anon/i);
  assert.match(sql, /policyname = 'Permitir registrar pesquisas'/i);
  assert.match(sql, /for insert\s+to anon\s+with check \(char_length\(trim\(termo\)\) between 1 and 100\)/i);
  assert.doesNotMatch(sql, /\b(drop\s+table|truncate(?:\s+table)?|delete\s+from)\b/i);
});

test("catalog foundation is additive and closed until reviewed", async () => {
  assert.equal(catalogFiles.length, 1, "one CLI-versioned catalog migration must exist");

  const sql = await readFile(
    path.join(MIGRATIONS_DIRECTORY, catalogFiles[0]),
    "utf8",
  );

  for (const table of [
    "products",
    "product_variants",
    "kits",
    "kit_components",
    "kit_component_variants",
  ]) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      `${table} must have RLS enabled`,
    );
  }

  assert.match(sql, /is_active boolean not null default false/i);
  assert.match(sql, /revoke all on table[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant select on table[\s\S]*to anon, authenticated/i);
  assert.doesNotMatch(sql, /grant (?:insert|update|delete)[^;]*\b(?:anon|authenticated)\b/i);
  assert.doesNotMatch(sql, /insert\s+into\s+public\./i);
  assert.doesNotMatch(sql, /\b(drop\s+table|truncate(?:\s+table)?|delete\s+from)\b/i);
});

test("local Supabase validation defaults to explicit Data API grants without seeds", async () => {
  const config = await readFile(
    path.join(REPOSITORY_ROOT, "supabase", "config.toml"),
    "utf8",
  );
  const seedConfig = config.match(/\[db\.seed\][\s\S]*?(?=\n\[|$)/)?.[0] ?? "";

  assert.match(config, /^project_id = "santino-local"$/m);
  assert.match(config, /^auto_expose_new_tables = false$/m);
  assert.match(seedConfig, /^enabled = false$/m);
});

test("Pages workflow validates migrations only against a local database", async () => {
  const workflow = await readFile(
    path.join(REPOSITORY_ROOT, ".github", "workflows", "pages.yml"),
    "utf8",
  );

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /run: supabase db start/);
  assert.match(workflow, /run: supabase db reset --no-seed/);
  assert.match(workflow, /run: supabase test db/);
  assert.match(workflow, /hashFiles\('supabase\/migrations\/\*\*\/\*\.sql'\)/);
  assert.doesNotMatch(workflow, /--remote|supabase db push|SUPABASE_ACCESS_TOKEN/i);
});

test("pgTAP plans match the assertions declared in every SQL test file", async () => {
  const testDirectory = path.join(REPOSITORY_ROOT, "supabase", "tests");
  const sqlFiles = (await readdir(testDirectory)).filter((name) => name.endsWith(".test.sql"));

  for (const name of sqlFiles) {
    const sql = await readFile(path.join(testDirectory, name), "utf8");
    const plan = sql.match(/^\s*select\s+plan\((\d+)\)\s*;/im);
    const assertions = [...sql.matchAll(/^\s*select\s+(?:ok|is|isnt|has_column|has_index|throws_ok|lives_ok)\s*\(/gim)].length;
    assert.ok(plan, `${name} declares a pgTAP plan`);
    assert.equal(Number(plan[1]), assertions, `${name} plan matches its pgTAP assertions`);
  }
});
