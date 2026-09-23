-- CultureArch: articles table (separate from MathArch's `articles`)
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_culture_articles_concept on public.culture_articles(concept);
create index if not exists idx_culture_articles_need on public.culture_articles(human_need);
create index if not exists idx_culture_articles_culture on public.culture_articles((origin->>'culture'));
create index if not exists idx_culture_articles_tags on public.culture_articles using gin(tags);
create index if not exists idx_culture_articles_created_at on public.culture_articles(created_at desc);

alter table public.culture_articles enable row level security;

-- Same open policies as MathArch (no auth). Tighten before public launch.
create policy "Public read access" on public.culture_articles for select using (true);
create policy "Public insert access" on public.culture_articles for insert with check (true);
create policy "Public update access" on public.culture_articles for update using (true);
create policy "Public delete access" on public.culture_articles for delete using (true);
