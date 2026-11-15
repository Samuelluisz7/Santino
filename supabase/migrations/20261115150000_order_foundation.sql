-- Additive order foundation for manual/WhatsApp fulfillment.
-- No browser role can create or read orders; payment processing is intentionally absent.

create table public.orders (
  id bigint generated always as identity primary key,
  status text not null default 'pending_contact',
  customer_name text,
  customer_phone text,
  customer_note text,
  currency_code text not null default 'BRL',
  subtotal_cents bigint not null default 0,
  shipping_cents bigint not null default 0,
  total_cents bigint generated always as (subtotal_cents + shipping_cents) stored,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint orders_status_check check (status in ('pending_contact', 'confirmed_manual', 'cancelled', 'fulfilled')),
  constraint orders_customer_name_check check (customer_name is null or char_length(btrim(customer_name)) between 1 and 160),
  constraint orders_customer_phone_check check (customer_phone is null or char_length(btrim(customer_phone)) between 3 and 40),
  constraint orders_customer_note_check check (customer_note is null or char_length(customer_note) <= 4000),
  constraint orders_currency_code_check check (currency_code ~ '^[A-Z]{3}$'),
  constraint orders_subtotal_nonnegative_check check (subtotal_cents >= 0),
  constraint orders_shipping_nonnegative_check check (shipping_cents >= 0)
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete restrict,
  product_id bigint references public.products (id) on delete restrict,
  product_slug text not null,
  product_name text not null,
  product_brand text not null,
  presentation_type text not null,
  display_label text not null,
  volume_ml integer not null,
  unit_price_cents bigint not null,
  quantity integer not null,
  line_total_cents bigint generated always as (unit_price_cents * quantity) stored,
  created_at timestamp with time zone not null default now(),
  constraint order_items_product_slug_check check (product_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint order_items_product_name_check check (char_length(btrim(product_name)) between 1 and 160),
  constraint order_items_product_brand_check check (char_length(btrim(product_brand)) between 1 and 120),
  constraint order_items_presentation_check check (presentation_type in ('decant', 'bottle', 'refill', 'other')),
  constraint order_items_display_label_check check (char_length(btrim(display_label)) between 1 and 120),
  constraint order_items_volume_check check (volume_ml > 0),
  constraint order_items_unit_price_check check (unit_price_cents >= 0),
  constraint order_items_quantity_check check (quantity between 1 and 100)
);

create index orders_status_created_idx on public.orders (status, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.orders, public.order_items from public, anon, authenticated;
grant select, insert, update, delete on table public.orders, public.order_items to service_role;
