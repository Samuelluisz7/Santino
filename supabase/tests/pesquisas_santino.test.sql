begin;

select plan(21);

select ok(
  to_regclass('public.pesquisas_santino') is not null,
  'legacy search table exists'
);
select ok(
  exists (
    select 1 from pg_attribute
    where attrelid = 'public.pesquisas_santino'::regclass
      and attname = 'id'
      and not attisdropped
  ),
  'id column exists'
);
select ok(
  exists (
    select 1 from pg_attribute
    where attrelid = 'public.pesquisas_santino'::regclass
      and attname = 'id'
      and atttypid = 'bigint'::regtype
      and attnotnull
      and attidentity = 'a'
  ),
  'id is a required bigint identity-always column'
);
select ok(
  exists (
    select 1 from pg_attribute
    where attrelid = 'public.pesquisas_santino'::regclass
      and attname = 'termo'
      and atttypid = 'text'::regtype
      and attnotnull
  ),
  'termo is required text'
);
select ok(
  exists (
    select 1 from pg_attribute
    where attrelid = 'public.pesquisas_santino'::regclass
      and attname = 'pesquisado_em'
      and atttypid = 'timestamp with time zone'::regtype
      and attnotnull
  ),
  'pesquisado_em is required timestamptz'
);
select ok(
  exists (
    select 1
    from pg_attrdef d
    join pg_attribute a
      on a.attrelid = d.adrelid
     and a.attnum = d.adnum
    where d.adrelid = 'public.pesquisas_santino'::regclass
      and a.attname = 'pesquisado_em'
      and pg_get_expr(d.adbin, d.adrelid) = 'now()'
  ),
  'pesquisado_em defaults to now()'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.pesquisas_santino'::regclass
      and contype = 'p'
      and conkey = array[(
        select attnum from pg_attribute
        where attrelid = 'public.pesquisas_santino'::regclass
          and attname = 'id'
      )]::smallint[]
  ),
  'id remains the primary key'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.pesquisas_santino'::regclass),
  'row level security is enabled'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pesquisas_santino'
      and policyname = 'Permitir registrar pesquisas'
      and cmd = 'INSERT'
      and 'anon' = any(roles)
      and with_check is not null
  ),
  'the validated anonymous insert policy exists'
);
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pesquisas_santino'
      and policyname = 'Permitir registrar pesquisas'
      and lower(with_check) like '%char_length%'
      and lower(with_check) like '%trim%'
      and lower(with_check) like '%>= 1%'
      and lower(with_check) like '%<= 100%'
  ),
  'the insert policy rejects blank terms and terms over 100 characters'
);
select ok(
  has_table_privilege('anon', 'public.pesquisas_santino', 'INSERT'),
  'anon can insert search terms'
);
select ok(
  not has_table_privilege('anon', 'public.pesquisas_santino', 'SELECT'),
  'anon cannot read search terms'
);
select ok(
  not has_table_privilege('anon', 'public.pesquisas_santino', 'UPDATE'),
  'anon cannot update search terms'
);
select ok(
  not has_table_privilege('anon', 'public.pesquisas_santino', 'DELETE'),
  'anon cannot delete search terms'
);
select ok(
  not has_table_privilege('authenticated', 'public.pesquisas_santino', 'INSERT'),
  'authenticated has no direct insert grant'
);
select ok(
  not has_table_privilege('authenticated', 'public.pesquisas_santino', 'SELECT'),
  'authenticated cannot read search terms'
);
select ok(
  not has_table_privilege('authenticated', 'public.pesquisas_santino', 'UPDATE'),
  'authenticated cannot update search terms'
);
select ok(
  not has_table_privilege('authenticated', 'public.pesquisas_santino', 'DELETE'),
  'authenticated cannot delete search terms'
);

set local role anon;

select lives_ok(
  $$insert into public.pesquisas_santino (termo) values ('consulta válida')$$,
  'anon can add a valid search term'
);
select throws_ok(
  $$insert into public.pesquisas_santino (termo) values ('   ')$$,
  '42501',
  null,
  'anon cannot add a blank search term'
);
select throws_ok(
  $$insert into public.pesquisas_santino (termo) values (repeat('x', 101))$$,
  '42501',
  null,
  'anon cannot add a search term over 100 characters'
);

reset role;

select * from finish();
rollback;
