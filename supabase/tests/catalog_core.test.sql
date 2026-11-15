begin;

select plan(34);

insert into public.products (slug, name, brand, is_active)
values
  ('test-active-product', 'Active test product', 'Test', true),
  ('test-inactive-product', 'Inactive test product', 'Test', false);

insert into public.products (slug, name, brand)
values ('test-default-inactive-product', 'Default inactive test product', 'Test');

insert into public.product_variants (
  product_id,
  presentation_type,
  display_label,
  volume_ml,
  price_cents,
  price_on_request,
  is_active
)
values
  ((select id from public.products where slug = 'test-active-product'), 'decant', '5 ml', 5, 1890, false, true),
  ((select id from public.products where slug = 'test-active-product'), 'decant', '10 ml', 10, 3590, false, true),
  ((select id from public.products where slug = 'test-active-product'), 'bottle', 'Price on request', 50, null, true, true),
  ((select id from public.products where slug = 'test-active-product'), 'decant', 'Inactive variant', 20, 5000, false, false),
  ((select id from public.products where slug = 'test-inactive-product'), 'decant', 'Hidden parent variant', 5, 1000, false, true);

insert into public.kits (slug, name, is_active)
values
  ('test-active-kit', 'Active test kit', true),
  ('test-inactive-kit', 'Inactive test kit', false);

insert into public.kit_components (kit_id, product_id, sort_order)
values
  (
    (select id from public.kits where slug = 'test-active-kit'),
    (select id from public.products where slug = 'test-active-product'),
    0
  ),
  (
    (select id from public.kits where slug = 'test-active-kit'),
    (select id from public.products where slug = 'test-inactive-product'),
    1
  ),
  (
    (select id from public.kits where slug = 'test-inactive-kit'),
    (select id from public.products where slug = 'test-active-product'),
    0
  );

insert into public.kit_component_variants (
  kit_component_id,
  product_id,
  product_variant_id
)
select component.id, component.product_id, variant.id
from public.kit_components as component
join public.kits as kit on kit.id = component.kit_id
join public.product_variants as variant
  on variant.product_id = component.product_id
where (kit.slug = 'test-active-kit' and variant.display_label = '5 ml')
   or (kit.slug = 'test-inactive-kit' and variant.display_label = '10 ml');

select ok(
  to_regclass('public.products') is not null,
  'products table exists'
);
select ok(
  to_regclass('public.product_variants') is not null,
  'product variants table exists'
);
select ok(
  to_regclass('public.kits') is not null,
  'kits table exists'
);
select ok(
  to_regclass('public.kit_components') is not null,
  'kit components table exists'
);
select ok(
  to_regclass('public.kit_component_variants') is not null,
  'kit component variants table exists'
);

select ok((select relrowsecurity from pg_class where oid = 'public.products'::regclass), 'products has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.product_variants'::regclass), 'product variants have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.kits'::regclass), 'kits have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.kit_components'::regclass), 'kit components have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.kit_component_variants'::regclass), 'kit component variants have RLS enabled');

select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'products_active_read' and cmd = 'SELECT'), 'products public read policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_variants' and policyname = 'product_variants_active_read' and cmd = 'SELECT'), 'product variants public read policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kits' and policyname = 'kits_active_read' and cmd = 'SELECT'), 'kits public read policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kit_components' and policyname = 'kit_components_active_read' and cmd = 'SELECT'), 'kit components public read policy exists');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kit_component_variants' and policyname = 'kit_component_variants_active_read' and cmd = 'SELECT'), 'kit component variants public read policy exists');

select ok(has_table_privilege('anon', 'public.products', 'SELECT'), 'anon can select products');
select ok(has_table_privilege('anon', 'public.product_variants', 'SELECT'), 'anon can select product variants');
select ok(has_table_privilege('anon', 'public.kits', 'SELECT'), 'anon can select kits');
select ok(has_table_privilege('anon', 'public.kit_components', 'SELECT'), 'anon can select kit components');
select ok(has_table_privilege('anon', 'public.kit_component_variants', 'SELECT'), 'anon can select kit component variants');

select ok(
  not has_table_privilege('anon', 'public.products', 'INSERT')
  and not has_table_privilege('anon', 'public.products', 'UPDATE')
  and not has_table_privilege('anon', 'public.products', 'DELETE')
  and not has_table_privilege('anon', 'public.product_variants', 'INSERT')
  and not has_table_privilege('anon', 'public.product_variants', 'UPDATE')
  and not has_table_privilege('anon', 'public.product_variants', 'DELETE')
  and not has_table_privilege('anon', 'public.kits', 'INSERT')
  and not has_table_privilege('anon', 'public.kits', 'UPDATE')
  and not has_table_privilege('anon', 'public.kits', 'DELETE')
  and not has_table_privilege('anon', 'public.kit_components', 'INSERT')
  and not has_table_privilege('anon', 'public.kit_components', 'UPDATE')
  and not has_table_privilege('anon', 'public.kit_components', 'DELETE')
  and not has_table_privilege('anon', 'public.kit_component_variants', 'INSERT')
  and not has_table_privilege('anon', 'public.kit_component_variants', 'UPDATE')
  and not has_table_privilege('anon', 'public.kit_component_variants', 'DELETE'),
  'anon has no direct catalog write privileges'
);

select ok(
  not has_table_privilege('authenticated', 'public.products', 'INSERT')
  and not has_table_privilege('authenticated', 'public.products', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.products', 'DELETE')
  and not has_table_privilege('authenticated', 'public.product_variants', 'INSERT')
  and not has_table_privilege('authenticated', 'public.product_variants', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.product_variants', 'DELETE')
  and not has_table_privilege('authenticated', 'public.kits', 'INSERT')
  and not has_table_privilege('authenticated', 'public.kits', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.kits', 'DELETE')
  and not has_table_privilege('authenticated', 'public.kit_components', 'INSERT')
  and not has_table_privilege('authenticated', 'public.kit_components', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.kit_components', 'DELETE')
  and not has_table_privilege('authenticated', 'public.kit_component_variants', 'INSERT')
  and not has_table_privilege('authenticated', 'public.kit_component_variants', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.kit_component_variants', 'DELETE'),
  'authenticated has no direct catalog write privileges'
);

select ok(
  has_table_privilege('service_role', 'public.products', 'SELECT')
  and has_table_privilege('service_role', 'public.products', 'INSERT')
  and has_table_privilege('service_role', 'public.products', 'UPDATE')
  and has_table_privilege('service_role', 'public.products', 'DELETE')
  and has_table_privilege('service_role', 'public.product_variants', 'SELECT')
  and has_table_privilege('service_role', 'public.product_variants', 'INSERT')
  and has_table_privilege('service_role', 'public.product_variants', 'UPDATE')
  and has_table_privilege('service_role', 'public.product_variants', 'DELETE')
  and has_table_privilege('service_role', 'public.kits', 'SELECT')
  and has_table_privilege('service_role', 'public.kits', 'INSERT')
  and has_table_privilege('service_role', 'public.kits', 'UPDATE')
  and has_table_privilege('service_role', 'public.kits', 'DELETE')
  and has_table_privilege('service_role', 'public.kit_components', 'SELECT')
  and has_table_privilege('service_role', 'public.kit_components', 'INSERT')
  and has_table_privilege('service_role', 'public.kit_components', 'UPDATE')
  and has_table_privilege('service_role', 'public.kit_components', 'DELETE')
  and has_table_privilege('service_role', 'public.kit_component_variants', 'SELECT')
  and has_table_privilege('service_role', 'public.kit_component_variants', 'INSERT')
  and has_table_privilege('service_role', 'public.kit_component_variants', 'UPDATE')
  and has_table_privilege('service_role', 'public.kit_component_variants', 'DELETE'),
  'service_role can manage catalog data server-side'
);

select is(
  (select is_active from public.products where slug = 'test-default-inactive-product'),
  false,
  'new products default to inactive'
);
select ok(
  (select price_on_request from public.product_variants where display_label = 'Price on request')
  and (select price_cents is null from public.product_variants where display_label = 'Price on request'),
  'a request-only variant can omit a fixed price'
);
select throws_ok(
  $$
    insert into public.product_variants (
      product_id, presentation_type, display_label, volume_ml, price_cents, price_on_request
    ) values (
      (select id from public.products where slug = 'test-active-product'),
      'decant', 'Invalid price state', 10, null, false
    )
  $$,
  '23514',
  null,
  'missing fixed prices must be explicitly marked as request-only'
);
select throws_ok(
  $$
    insert into public.product_variants (
      product_id, presentation_type, display_label, volume_ml, price_cents, price_on_request
    ) values (
      (select id from public.products where slug = 'test-active-product'),
      'decant', 'Negative price', 10, -1, false
    )
  $$,
  '23514',
  null,
  'variant prices cannot be negative'
);
select throws_ok(
  $$
    insert into public.kit_component_variants (
      kit_component_id, product_id, product_variant_id
    )
    select component.id, component.product_id, variant.id
    from public.kit_components as component
    join public.kits as kit on kit.id = component.kit_id
    join public.product_variants as variant
      on variant.display_label = 'Hidden parent variant'
    where kit.slug = 'test-active-kit'
      and component.product_id = (
        select id from public.products where slug = 'test-active-product'
      )
  $$,
  '23503',
  null,
  'kit variant choices must belong to the component product'
);

set local role anon;
select is((select count(*)::integer from public.products), 1, 'anon only sees active products');
select is((select count(*)::integer from public.product_variants), 3, 'anon only sees active variants for active products');
select is((select count(*)::integer from public.kits), 1, 'anon only sees active kits');
select is((select count(*)::integer from public.kit_components), 1, 'anon only sees components of active kits and products');
select is((select count(*)::integer from public.kit_component_variants), 1, 'anon only sees eligible variants for active kit components');

reset role;
set local role authenticated;
select is((select count(*)::integer from public.products), 1, 'authenticated only sees active products');
reset role;

select * from finish();
rollback;

