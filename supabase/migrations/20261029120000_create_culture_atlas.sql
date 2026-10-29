-- CultureArch atlas: saved distillations that compare cultures.
-- One row per view: kind 'theme' (a human need across cultures) or 'culture'
-- (one culture against the rest). data holds the model's tables and insights;
-- image_url and notes are what the user adds by hand. Public like the library:
-- the site has no sign-in, and nothing private belongs here.
create table if not exists public.culture_atlas (
  id text primary key,                 -- '<kind>:<key>', e.g. 'theme:מנוחה'
  kind text not null check (kind in ('theme', 'culture')),
  key text not null,
  data jsonb not null default '{}'::jsonb,
  image_url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.culture_atlas enable row level security;

create policy "Atlas public read" on public.culture_atlas
  for select to anon, authenticated using (true);

create policy "Atlas public insert" on public.culture_atlas
  for insert to anon, authenticated with check (true);

create policy "Atlas public update" on public.culture_atlas
  for update to anon, authenticated using (true) with check (true);

-- No delete policy, as with culture_articles.

create trigger culture_atlas_touch_updated_at
  before update on public.culture_atlas
  for each row execute function public.touch_updated_at();
