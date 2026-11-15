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

