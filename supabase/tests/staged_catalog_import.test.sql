begin;

select plan(7);

select is(
  (select count(*)::integer from public.products),
  51,
  'staged import contains only the 51 conflict-free products'
);

select is(
  (select count(*)::integer from public.product_variants),
  116,
  'staged import contains the source presentations'
);

select is(
  (select count(*)::integer from public.products where is_active),
  0,
  'staged products remain inactive'
);

select is(
  (select count(*)::integer from public.product_variants where is_active),
  0,
  'staged variants remain inactive'
);

select ok(
  not exists (
    select 1 from public.products where slug in ('k-max', 'full-cebolinha', 'full-nautica-voyage')
  ),
  'conflicting products are excluded from the staged import'
);

select ok(
  exists (
    select 1 from public.product_variants
    where image_url is not null
  ),
  'presentation-specific source images are retained'
);

select ok(
  not exists (
    select 1 from public.product_variants
    where (price_on_request and price_cents is not null)
       or (not price_on_request and price_cents is null)
  ),
  'price state remains internally consistent'
);

select * from finish();
rollback;
