import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../supabase/functions/create-order/index.ts", import.meta.url), "utf8");

test("create-order requires a server token and service role", () => {
  assert.match(source, /SANTINO_ORDER_API_TOKEN/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /x-santino-order-token/);
  assert.doesNotMatch(source, /sb_publishable_|SUPABASE_SERVICE_ROLE_KEY\s*=/);
});

test("create-order validates active variants and calculates totals server-side", () => {
  assert.match(source, /products\.is_active/);
  assert.match(source, /eq\("is_active", true\)/);
  assert.match(source, /subtotal_cents: subtotal/);
  assert.match(source, /price_cents === null/);
  assert.match(source, /pending_contact/);
});

test("create-order rejects malformed input and never handles payment", () => {
  assert.match(source, /invalid_items/);
  assert.match(source, /invalid_item/);
  assert.match(source, /item_unavailable/);
  assert.doesNotMatch(source, /stripe|mercadopago|payment_intent/i);
});
