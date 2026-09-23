-- Pin the search_path so the trigger cannot be redirected through a schema an
-- attacker controls (Supabase security linter 0011).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
