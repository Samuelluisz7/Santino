begin;

select plan(10);

select ok(to_regclass('public.orders') is not null, 'orders table exists');
select ok(to_regclass('public.order_items') is not null, 'order items table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.orders'::regclass), 'orders has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.order_items'::regclass), 'order items have RLS enabled');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders'), 'orders has no public policies');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items'), 'order items have no public policies');
select has_column('public', 'orders', 'total_cents', 'orders store a generated total');
select has_column('public', 'order_items', 'product_name', 'items store product snapshots');
select has_column('public', 'order_items', 'unit_price_cents', 'items store accepted unit prices');
select has_index('public', 'orders_status_created_idx', 'orders have status index');
select has_index('public', 'order_items_order_id_idx', 'items have order index');
select throws_ok(
  $$insert into public.order_items (order_id, product_slug, product_name, product_brand, presentation_type, display_label, volume_ml, unit_price_cents, quantity)
    values (999999, 'x', 'X', 'X', 'decant', '5 ml', 5, 100, 0)$$,
  '23503',
  null,
  'items require an existing order and valid quantity'
);

select * from finish();
rollback;
