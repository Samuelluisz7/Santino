-- Explicit deny policies make the server-only order boundary visible to advisors.
-- The service_role bypasses RLS for the future server-side order function.
create policy orders_deny_browser_access
  on public.orders
  for all
  to anon, authenticated
  using (false)
  with check (false);

create policy order_items_deny_browser_access
  on public.order_items
  for all
  to anon, authenticated
  using (false)
  with check (false);
