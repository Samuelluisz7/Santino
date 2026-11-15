-- Safe baseline for the legacy search table already present in Santino Nobre.
-- IF NOT EXISTS and the conditional policy preserve its existing rows and policy.
create table if not exists public.pesquisas_santino (
  id bigint generated always as identity not null,
  termo text not null,
  pesquisado_em timestamp with time zone not null default now(),
  constraint pesquisas_santino_pkey primary key (id)
);

alter table public.pesquisas_santino enable row level security;

revoke all on table public.pesquisas_santino from public, anon, authenticated;
grant insert on table public.pesquisas_santino to anon;

do $migration$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pesquisas_santino'
      and policyname = 'Permitir registrar pesquisas'
  ) then
    create policy "Permitir registrar pesquisas"
      on public.pesquisas_santino
      for insert
      to anon
      with check (char_length(trim(termo)) between 1 and 100);
  end if;
end
$migration$;
