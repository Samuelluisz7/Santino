import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://samuelluisz7.github.io",
  "Access-Control-Allow-Headers": "authorization, content-type, x-santino-order-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestItem = {
  slug?: unknown;
  presentationType?: unknown;
  displayLabel?: unknown;
  quantity?: unknown;
};

type RequestBody = {
  customer?: { name?: unknown; phone?: unknown; note?: unknown };
  items?: RequestItem[];
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function validText(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expectedToken = Deno.env.get("SANTINO_ORDER_API_TOKEN");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!expectedToken || !serviceKey || !supabaseUrl) {
    return json({ error: "order_service_not_configured" }, 503);
  }
  if (request.headers.get("x-santino-order-token") !== expectedToken) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!body || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return json({ error: "invalid_items" }, 400);
  }

  const requested = body.items.map((item) => ({
    slug: typeof item.slug === "string" ? item.slug.trim() : "",
    presentationType: typeof item.presentationType === "string" ? item.presentationType.trim() : "",
    displayLabel: typeof item.displayLabel === "string" ? item.displayLabel.trim() : "",
    quantity: Number(item.quantity),
  }));
  if (requested.some((item) =>
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
    !["decant", "bottle", "refill", "other"].includes(item.presentationType) ||
    !validText(item.displayLabel, 120) ||
    !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100
  )) {
    return json({ error: "invalid_item" }, 400);
  }

  const customer = body.customer ?? {};
  if (customer.name !== undefined && !validText(customer.name, 160)) return json({ error: "invalid_customer_name" }, 400);
  if (customer.phone !== undefined && !validText(customer.phone, 40)) return json({ error: "invalid_customer_phone" }, 400);
  if (customer.note !== undefined && typeof customer.note !== "string" || (typeof customer.note === "string" && customer.note.length > 4000)) {
    return json({ error: "invalid_customer_note" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const lookups = requested.map((item) =>
    supabase
      .from("product_variants")
      .select("id, product_id, presentation_type, display_label, volume_ml, price_cents, products!inner(id, slug, name, brand, is_active)")
      .eq("presentation_type", item.presentationType)
      .eq("display_label", item.displayLabel)
      .eq("products.slug", item.slug)
      .eq("products.is_active", true)
      .eq("is_active", true)
      .maybeSingle()
  );
  const results = await Promise.all(lookups);
  if (results.some((result) => result.error || !result.data || result.data.price_cents === null)) {
    return json({ error: "item_unavailable" }, 409);
  }

  const lines = results.map((result, index) => {
    const variant = result.data as any;
    const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
    const quantity = requested[index].quantity;
    return {
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.name,
      product_brand: product.brand,
      presentation_type: variant.presentation_type,
      display_label: variant.display_label,
      volume_ml: variant.volume_ml,
      unit_price_cents: variant.price_cents,
      quantity,
      line_total_cents: variant.price_cents * quantity,
    };
  });
  const subtotal = lines.reduce((total, line) => total + line.line_total_cents, 0);

  const orderResult = await supabase.from("orders").insert({
    status: "pending_contact",
    customer_name: typeof customer.name === "string" ? customer.name.trim() : null,
    customer_phone: typeof customer.phone === "string" ? customer.phone.trim() : null,
    customer_note: typeof customer.note === "string" ? customer.note : null,
    subtotal_cents: subtotal,
    shipping_cents: 0,
  }).select("id, status, subtotal_cents, shipping_cents, total_cents").single();
  if (orderResult.error || !orderResult.data) return json({ error: "order_creation_failed" }, 500);

  const itemResult = await supabase.from("order_items").insert(lines.map(({ line_total_cents: _lineTotal, ...line }) => ({ ...line, order_id: orderResult.data.id })));
  if (itemResult.error) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderResult.data.id);
    return json({ error: "order_creation_failed" }, 500);
  }

  return json({ order: orderResult.data }, 201);
});
