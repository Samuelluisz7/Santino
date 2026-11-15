begin;

select plan(21);

insert into public.products (slug, name, brand, is_active)
values
  ('test-olfactory-active', 'Active olfactory test product', 'Test', true),
  ('test-olfactory-inactive', 'Inactive olfactory test product', 'Test', false);

insert into public.product_olfactory_profiles (
  product_id,
  family,
  top_notes,
  heart_notes,
  base_notes,
  intro,
  story,
  occasion,
  climate,
  accords
)
values (
  (select id from public.products where slug = 'test-olfactory-active'),
  'Aromático ambarado',
  'Lavanda, menta e sálvia',
  'Baunilha, tabaco e flor de laranjeira',
  'Fava tonka, benjoim e ládano',
  'Abertura herbal com um fundo quente.',
  'A história mantém a descrição aprovada do perfume.',
  'Rotina e encontros.',
  'Versátil em clima ameno.',
  array['Aromático', 'Herbal', 'Tabaco']
);

insert into public.product_olfactory_profiles (
  product_id,
  family,
  top_notes,
  heart_notes,
  base_notes
)
values (
  (select id from public.products where slug = 'test-olfactory-inactive'),
  'Cítrico amadeirado',
  'Bergamota',
  'Lavanda',
  'Cedro'
);

select ok(
  to_regclass('public.product_olfactory_profiles') is not null,
  'product olfactory profiles table exists'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.product_olfactory_profiles'::regclass),
  'product olfactory profiles has RLS enabled'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'product_olfactory_profiles'),
  1,
  'profiles expose only the single active-product read policy'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_olfactory_profiles'
      and policyname = 'product_olfactory_profiles_active_read'
      and cmd = 'SELECT'
      and roles @> array['anon', 'authenticated']::name[]
      and qual like '%is_active%'
  ),
  'profile read policy is restricted to active products'
);

select ok(has_table_privilege('anon', 'public.product_olfactory_profiles', 'SELECT'), 'anon can select profiles');
select ok(has_table_privilege('authenticated', 'public.product_olfactory_profiles', 'SELECT'), 'authenticated can select profiles');
select ok(
  not has_table_privilege('anon', 'public.product_olfactory_profiles', 'INSERT')
  and not has_table_privilege('anon', 'public.product_olfactory_profiles', 'UPDATE')
  and not has_table_privilege('anon', 'public.product_olfactory_profiles', 'DELETE')
  and not has_table_privilege('anon', 'public.product_olfactory_profiles', 'TRUNCATE'),
  'anon cannot write or truncate profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.product_olfactory_profiles', 'INSERT')
  and not has_table_privilege('authenticated', 'public.product_olfactory_profiles', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.product_olfactory_profiles', 'DELETE')
  and not has_table_privilege('authenticated', 'public.product_olfactory_profiles', 'TRUNCATE'),
  'authenticated cannot write or truncate profiles'
);
select ok(
  has_table_privilege('service_role', 'public.product_olfactory_profiles', 'SELECT')
  and has_table_privilege('service_role', 'public.product_olfactory_profiles', 'INSERT')
  and has_table_privilege('service_role', 'public.product_olfactory_profiles', 'UPDATE')
  and has_table_privilege('service_role', 'public.product_olfactory_profiles', 'DELETE'),
  'service_role can maintain profile data server-side'
);

select is(
  (select family from public.product_olfactory_profiles where product_id = (select id from public.products where slug = 'test-olfactory-active')),
  'Aromático ambarado',
  'family is stored without reinterpretation'
);
select ok(
  (select top_notes = 'Lavanda, menta e sálvia'
      and heart_notes = 'Baunilha, tabaco e flor de laranjeira'
      and base_notes = 'Fava tonka, benjoim e ládano'
   from public.product_olfactory_profiles
   where product_id = (select id from public.products where slug = 'test-olfactory-active')),
  'top, heart, and base notes retain their full text'
);
select is(
  (select accords from public.product_olfactory_profiles where product_id = (select id from public.products where slug = 'test-olfactory-active')),
  array['Aromático', 'Herbal', 'Tabaco']::text[],
  'accord labels retain their order'
);
select is(
  (select accords from public.product_olfactory_profiles where product_id = (select id from public.products where slug = 'test-olfactory-inactive')),
  array[]::text[],
  'accords default to an empty array'
);
select ok(
  (select intro is null and story is null and occasion is null and climate is null
   from public.product_olfactory_profiles
   where product_id = (select id from public.products where slug = 'test-olfactory-inactive')),
  'optional narrative fields can remain unknown'
);

select throws_ok(
  $$
    insert into public.product_olfactory_profiles (product_id, family, top_notes, heart_notes, base_notes)
    values ((select id from public.products where slug = 'test-olfactory-active'), ' ', 'Bergamota', 'Lavanda', 'Cedro')
  $$,
  '23514',
  null,
  'family cannot be blank'
);
select throws_ok(
  $$
    insert into public.product_olfactory_profiles (product_id, family, top_notes, heart_notes, base_notes)
    values ((select id from public.products where slug = 'test-olfactory-active'), 'Cítrico', ' ', 'Lavanda', 'Cedro')
  $$,
  '23514',
  null,
  'top notes cannot be blank'
);
select throws_ok(
  $$
    insert into public.product_olfactory_profiles (product_id, family, top_notes, heart_notes, base_notes, accords)
    values (
      (select id from public.products where slug = 'test-olfactory-active'),
      'Cítrico', 'Bergamota', 'Lavanda', 'Cedro',
      array['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
    )
  $$,
  '23514',
  null,
  'accords are limited to ten labels'
);
select throws_ok(
  $$
    insert into public.product_olfactory_profiles (product_id, family, top_notes, heart_notes, base_notes)
    values (-1, 'Cítrico', 'Bergamota', 'Lavanda', 'Cedro')
  $$,
  '23503',
  null,
  'every profile must reference an existing product'
);
select throws_ok(
  $$
    insert into public.product_olfactory_profiles (product_id, family, top_notes, heart_notes, base_notes)
    values ((select id from public.products where slug = 'test-olfactory-active'), 'Cítrico', 'Bergamota', 'Lavanda', 'Cedro')
  $$,
  '23505',
  null,
  'a product can have only one olfactory profile'
);
select throws_ok(
  $$ delete from public.products where slug = 'test-olfactory-active' $$,
  '23503',
  null,
  'a product with an olfactory profile cannot be deleted accidentally'
);

set local role anon;
select is((select count(*)::integer from public.product_olfactory_profiles), 1, 'anon only sees profiles for active products');

reset role;
set local role authenticated;
select is((select count(*)::integer from public.product_olfactory_profiles), 1, 'authenticated only sees profiles for active products');

reset role;
select * from finish();
rollback;
