revoke all on public.live_orders, public.kiosk_sessions, public.processed_square_events from anon, authenticated;
grant select on public.live_orders to authenticated;
grant update(status) on public.live_orders to authenticated;
grant all on public.live_orders, public.kiosk_sessions, public.processed_square_events to service_role;
