-- Groups on the world page (a region, continent, tradition, period, word order
-- or ancient civilization) keep their distillation in culture_atlas too.
alter table public.culture_atlas drop constraint if exists culture_atlas_kind_check;
alter table public.culture_atlas add constraint culture_atlas_kind_check check (kind in ('theme', 'culture', 'group'));
