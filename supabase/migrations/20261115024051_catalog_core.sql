-- Additive catalog foundation. No commercial rows are imported or seeded here.
-- Public catalog records remain hidden until explicitly reviewed and activated.

create table public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  brand text not null,
  badge text,
  description text,
  image_url text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint products_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_name_nonempty_check
    check (char_length(btrim(name)) between 1 and 160),
  constraint products_brand_nonempty_check
    check (char_length(btrim(brand)) between 1 and 120),
  constraint products_badge_length_check
    check (badge is null or char_length(badge) <= 80),
  constraint products_description_length_check
    check (description is null or char_length(description) <= 4000),
  constraint products_image_url_length_check
    check (image_url is null or char_length(image_url) <= 2048)
);

create table public.product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null,
  presentation_type text not null,
  display_label text not null,
  volume_ml integer not null,
  price_cents bigint,
  currency_code text not null default 'BRL',
  price_on_request boolean not null default false,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint product_variants_product_id_fkey
    foreign key (product_id) references public.products (id) on delete restrict,
  constraint product_variants_product_presentation_label_key
    unique (product_id, presentation_type, display_label),
  constraint product_variants_id_product_id_key
    unique (id, product_id),
  constraint product_variants_presentation_type_check
    check (presentation_type in ('decant', 'bottle', 'refill', 'other')),
  constraint product_variants_display_label_nonempty_check
    check (char_length(btrim(display_label)) between 1 and 120),
  constraint product_variants_volume_positive_check
    check (volume_ml > 0),
  constraint product_variants_price_nonnegative_check
    check (price_cents is null or price_cents >= 0),
  constraint product_variants_price_state_check
    check (
      (price_on_request and price_cents is null)
      or (not price_on_request and price_cents is not null)
    ),
  constraint product_variants_currency_code_check
    check (currency_code ~ '^[A-Z]{3}$')
);

create table public.kits (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  display_label text,
  description text,
  image_url text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint kits_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint kits_name_nonempty_check
    check (char_length(btrim(name)) between 1 and 160),
  constraint kits_display_label_length_check
    check (display_label is null or char_length(display_label) <= 120),
  constraint kits_description_length_check
    check (description is null or char_length(description) <= 4000),
  constraint kits_image_url_length_check
    check (image_url is null or char_length(image_url) <= 2048)
);

create table public.kit_components (
  id bigint generated always as identity primary key,
  kit_id bigint not null,
  product_id bigint not null,
  min_quantity smallint not null default 1,
  max_quantity smallint not null default 5,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint kit_components_kit_id_fkey
    foreign key (kit_id) references public.kits (id) on delete restrict,
  constraint kit_components_product_id_fkey
    foreign key (product_id) references public.products (id) on delete restrict,
  constraint kit_components_kit_product_key unique (kit_id, product_id),
  constraint kit_components_id_product_id_key unique (id, product_id),
  constraint kit_components_min_quantity_check check (min_quantity > 0),
  constraint kit_components_max_quantity_check check (max_quantity >= min_quantity)
);

create table public.kit_component_variants (
  kit_component_id bigint not null,
  product_id bigint not null,
  product_variant_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint kit_component_variants_pkey
    primary key (kit_component_id, product_variant_id),
  constraint kit_component_variants_component_product_fkey
    foreign key (kit_component_id, product_id)
    references public.kit_components (id, product_id) on delete restrict,
  constraint kit_component_variants_variant_product_fkey
    foreign key (product_variant_id, product_id)
    references public.product_variants (id, product_id) on delete restrict
);

-- Index public listing filters and every foreign-key path used by joins or RLS.
create index products_active_sort_idx
  on public.products (sort_order, name)
  where is_active;

create index product_variants_active_listing_idx
  on public.product_variants (product_id, sort_order, volume_ml)
  where is_active;

create index kits_active_sort_idx
  on public.kits (sort_order, name)
  where is_active;

create index kit_components_product_id_idx
  on public.kit_components (product_id);

create index kit_component_variants_component_product_idx
  on public.kit_component_variants (kit_component_id, product_id);

create index kit_component_variants_variant_product_idx
  on public.kit_component_variants (product_variant_id, product_id);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.kits enable row level security;
alter table public.kit_components enable row level security;
alter table public.kit_component_variants enable row level security;

create policy products_active_read
  on public.products
  for select
  to anon, authenticated
  using (is_active);

create policy product_variants_active_read
  on public.product_variants
  for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.products as product
      where product.id = product_variants.product_id
        and product.is_active
    )
  );

create policy kits_active_read
  on public.kits
  for select
  to anon, authenticated
  using (is_active);

create policy kit_components_active_read
  on public.kit_components
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.kits as kit
      where kit.id = kit_components.kit_id
        and kit.is_active
    )
    and exists (
      select 1
      from public.products as product
      where product.id = kit_components.product_id
        and product.is_active
    )
  );

create policy kit_component_variants_active_read
  on public.kit_component_variants
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.kit_components as component
      join public.kits as kit on kit.id = component.kit_id
      where component.id = kit_component_variants.kit_component_id
        and component.product_id = kit_component_variants.product_id
        and kit.is_active
    )
    and exists (
      select 1
      from public.product_variants as variant
      where variant.id = kit_component_variants.product_variant_id
        and variant.product_id = kit_component_variants.product_id
        and variant.is_active
    )
  );

-- Browser roles can only read reviewed active catalog rows. Catalog writes stay server-side.
revoke all on table
  public.products,
  public.product_variants,
  public.kits,
  public.kit_components,
  public.kit_component_variants
from public, anon, authenticated;

grant select on table
  public.products,
  public.product_variants,
  public.kits,
  public.kit_components,
  public.kit_component_variants
to anon, authenticated;

grant select, insert, update, delete on table
  public.products,
  public.product_variants,
  public.kits,
  public.kit_components,
  public.kit_component_variants
to service_role;
