create table public.staff_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_-]{2,31}$'),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.staff_accounts enable row level security;
revoke all on public.staff_accounts from anon, authenticated;
grant all on public.staff_accounts to service_role;

create or replace function private.staff_is_authorized()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.staff_accounts s
    where s.user_id = auth.uid()
      and (auth.jwt()->>'is_anonymous') is distinct from 'true'
  );
$$;
revoke all on function private.staff_is_authorized() from public;
grant execute on function private.staff_is_authorized() to authenticated;

drop policy "authorized kiosks can read live orders" on public.live_orders;
drop policy "authorized kiosks can update workflow status" on public.live_orders;
create policy "staff can read live orders" on public.live_orders
  for select to authenticated using (private.staff_is_authorized());
create policy "staff can update workflow status" on public.live_orders
  for update to authenticated
  using (private.staff_is_authorized())
  with check (private.staff_is_authorized());

drop function private.kiosk_is_authorized();
drop table public.kiosk_sessions;
