-- Clearing hides a ticket from the working board without deleting the Square order
-- or claiming it was prepared or collected. Restore returns it to its prior lane.
alter table public.live_orders drop constraint if exists live_orders_status_check;
alter table public.live_orders add constraint live_orders_status_check
  check (status in ('active', 'ready', 'complete', 'canceled', 'cleared'));
alter table public.live_orders add column if not exists cleared_at timestamptz;
alter table public.live_orders add column if not exists cleared_from_status text
  check (cleared_from_status in ('active', 'ready'));
create index if not exists live_orders_cleared_at_idx
  on public.live_orders (cleared_at desc) where status = 'cleared';

create or replace function public.set_live_order_updated_at()
returns trigger language plpgsql as $$
begin
  if current_user <> 'service_role' then
    if new.square_order_id is distinct from old.square_order_id
      or not (
        (old.status = 'active' and new.status in ('ready','cleared'))
        or (old.status = 'ready' and new.status in ('complete','cleared'))
        or (old.status = 'cleared' and new.status = old.cleared_from_status)
      ) then
      raise exception 'Invalid order status transition';
    end if;
    if new.status = 'cleared' then
      new.cleared_at = now();
      new.cleared_from_status = old.status;
    elsif old.status = 'cleared' then
      new.cleared_at = null;
      new.cleared_from_status = null;
    elsif new.status = 'ready' then
      new.ready_at = now();
    elsif new.status = 'complete' then
      new.completed_at = now();
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
