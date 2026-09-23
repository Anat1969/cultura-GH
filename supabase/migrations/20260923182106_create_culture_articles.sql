-- CultureArch: the shared library of generated culture concepts.
-- Public by design: the site has no sign-in and the repository is public.
-- No secret ever belongs in this table; the Claude key lives in an Edge
-- Function secret, where the browser cannot reach it.
create table if not exists public.culture_articles (
  id uuid primary key default gen_random_uuid(),
  concept text not null,
  space_name text not null,
  insight text not null,
  proverb text not null,
  interpretation text not null,
  human_need text,
  origin jsonb not null default '{}'::jsonb,   -- { script, transliteration, literal, culture, region_en }
  practice jsonb not null default '{}'::jsonb, -- { why, how, when, where }
  image_exterior text,
  image_interior text,
  exterior_prompt text,
  interior_prompt text,
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_culture_articles_created_at on public.culture_articles (created_at desc);
create index if not exists idx_culture_articles_need on public.culture_articles (human_need);
create index if not exists idx_culture_articles_culture on public.culture_articles ((origin ->> 'culture'));
create index if not exists idx_culture_articles_tags on public.culture_articles using gin (tags);

alter table public.culture_articles enable row level security;

create policy "Public read access"
  on public.culture_articles for select
  to anon, authenticated
  using (true);

create policy "Public insert access"
  on public.culture_articles for insert
  to anon, authenticated
  with check (true);

create policy "Public update access"
  on public.culture_articles for update
  to anon, authenticated
  using (true) with check (true);

-- Deliberately no delete policy: the library is append-and-correct only, so a
-- stray visitor cannot empty it. Deletions are done from the Supabase dashboard.

create trigger culture_articles_touch_updated_at
  before update on public.culture_articles
  for each row execute function public.touch_updated_at();
