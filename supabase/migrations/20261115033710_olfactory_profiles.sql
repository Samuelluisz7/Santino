-- Store the existing perfume detail content in a normalized, one-to-one table.
-- Note groups remain text so their current wording and ordering can be migrated
-- without reinterpretation. No catalog or commercial rows are seeded here.

create table public.product_olfactory_profiles (
  product_id bigint primary key,
  family text not null,
  top_notes text not null,
  heart_notes text not null,
  base_notes text not null,
  intro text,
  story text,
  occasion text,
  climate text,
  accords text[] not null default array[]::text[],
  created_at timestamp with time zone not null default now(),
  constraint product_olfactory_profiles_product_id_fkey
    foreign key (product_id) references public.products (id) on delete restrict,
  constraint product_olfactory_profiles_family_check
    check (char_length(btrim(family)) between 1 and 160),
  constraint product_olfactory_profiles_top_notes_check
    check (char_length(btrim(top_notes)) between 1 and 2000),
  constraint product_olfactory_profiles_heart_notes_check
    check (char_length(btrim(heart_notes)) between 1 and 2000),
  constraint product_olfactory_profiles_base_notes_check
    check (char_length(btrim(base_notes)) between 1 and 2000),
  constraint product_olfactory_profiles_intro_check
    check (intro is null or char_length(btrim(intro)) between 1 and 2000),
  constraint product_olfactory_profiles_story_check
    check (story is null or char_length(btrim(story)) between 1 and 8000),
  constraint product_olfactory_profiles_occasion_check
    check (occasion is null or char_length(btrim(occasion)) between 1 and 1200),
  constraint product_olfactory_profiles_climate_check
    check (climate is null or char_length(btrim(climate)) between 1 and 1200),
  constraint product_olfactory_profiles_accords_count_check
    check (cardinality(accords) <= 10)
);

alter table public.product_olfactory_profiles enable row level security;

create policy product_olfactory_profiles_active_read
  on public.product_olfactory_profiles
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products as product
      where product.id = product_olfactory_profiles.product_id
        and product.is_active
    )
  );

-- The profile contains descriptive catalog data only. Browser clients may read
-- it for active products; all writes remain server-side.
revoke all on table public.product_olfactory_profiles
  from public, anon, authenticated;

grant select on table public.product_olfactory_profiles
  to anon, authenticated;

grant select, insert, update, delete on table public.product_olfactory_profiles
  to service_role;
