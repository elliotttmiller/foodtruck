create schema if not exists private;

create or replace function private.kiosk_is_authorized()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.kiosk_sessions s
    where s.user_id = auth.uid() and s.authorized_until > now()
  );
$$;

revoke all on function private.kiosk_is_authorized() from public;
grant usage on schema private to authenticated;
grant execute on function private.kiosk_is_authorized() to authenticated;

drop policy "authorized kiosks can read live orders" on public.live_orders;
create policy "authorized kiosks can read live orders" on public.live_orders
  for select to authenticated using (private.kiosk_is_authorized());

drop policy "authorized kiosks can update workflow status" on public.live_orders;
create policy "authorized kiosks can update workflow status" on public.live_orders
  for update to authenticated
  using (private.kiosk_is_authorized())
  with check (private.kiosk_is_authorized());

drop function public.kiosk_is_authorized();
alter function public.set_live_order_updated_at() set search_path = '';
