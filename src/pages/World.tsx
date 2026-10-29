import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import Globe from '@/components/world/Globe';
import Timeline from '@/components/world/Timeline';
import { Flag } from '@/components/CultureMarks';
import { getArticles } from '@/lib/storage';
import { keywordMatcher } from '@/lib/search';
import { GROUP_LABELS, GroupBy, WorldItem, worldGroups, worldItems, yearLabel } from '@/lib/world';

const GROUPINGS = Object.keys(GROUP_LABELS) as GroupBy[];

/**
 * Where the words come from and when: a globe for place, a time axis for
 * period, and one grouping that drives both - cultural region (Scandinavia,
 * East Asia), continent, tradition or period. The state lives in the address,
 * so a view can be shared as a link.
 */
const WorldPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const by = (GROUPINGS.includes(params.get('by') as GroupBy) ? params.get('by') : 'region') as GroupBy;
  const selected = params.get('group');
  const [query, setQuery] = useState(params.get('q') ?? '');

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  };

  const items = useMemo(() => {
    const match = keywordMatcher(query);
    return worldItems(getArticles()).filter(it => match(it.article));
  }, [query]);
  const groups = useMemo(() => worldGroups(items, by), [items, by]);
  const open = (it: WorldItem) => navigate(`/article/${it.article.id}`);
  const located = items.filter(i => i.point).length;
  const dated = items.filter(i => i.year !== null).length;

  return (
    <div className="container max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ label: 'בית', to: '/' }, { label: 'עולם' }]} />
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-fluid-lg font-heading font-bold text-primary">עולם המילים</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          מאיפה כל מילה ומתי נולדה. הגלובוס מראה מקום, הציר מראה זמן, והקיבוץ מחבר בין תרבויות קרובות.
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {items.length} מילים · {located} על הגלובוס · {dated} על ציר הזמן
        </p>
      </motion.header>

      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="world-q" className="mb-1 block text-xs text-muted-foreground">
            מילות מפתח
          </label>
          <Input
            id="world-q"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              set({ q: e.target.value || null });
            }}
            placeholder="למשל: אירוח, יפן, המאה ה-18, בודהיזם"
            dir="rtl"
          />
        </div>
        <div className="min-w-0">
          <span className="mb-1 block text-xs text-muted-foreground">קיבוץ לפי</span>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="קיבוץ לפי">
            {GROUPINGS.map(g => (
              <button
                key={g}
                role="radio"
                aria-checked={by === g}
                onClick={() => set({ by: g, group: null })}
                className={`border px-3 py-1.5 text-sm shadow-sm transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-none ${
                  by === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'
                }`}
              >
                {GROUP_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section aria-label="גלובוס">
          <Globe groups={groups} selected={selected} onSelectGroup={k => set({ group: k })} onOpen={open} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            גררי לסיבוב. לחיצה על נקודה בוחרת את הקבוצה שלה, לחיצה שנייה פותחת את המילה.
          </p>
        </section>

        <section aria-label="קבוצות" className="min-w-0 space-y-3">
          {groups.map(g => {
            const active = selected === g.key;
            return (
              <div
                key={g.key}
                className={`border bg-card/70 p-3 shadow-sm transition-all ${active ? 'border-primary shadow-md' : 'border-border'}`}
              >
                <button
                  onClick={() => set({ group: active ? null : g.key })}
                  className="mb-2 flex w-full items-center justify-between gap-2 text-right"
                  aria-pressed={active}
                >
                  <span className="flex items-center gap-2 font-heading font-bold">
                    <span className="inline-block h-3 w-3" style={{ background: g.color }} />
                    {g.key}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{g.items.length}</span>
                </button>
                <ul className="flex flex-wrap gap-1.5">
                  {g.items
                    .slice()
                    .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999))
                    .map(it => (
                      <li key={it.article.id}>
                        <button
                          onClick={() => open(it)}
                          className="flex items-start gap-1.5 border border-border bg-background/60 px-2 py-1 text-right shadow-sm transition-all hover:-translate-y-px hover:border-accent/60 hover:shadow-md active:translate-y-0"
                          title={[it.article.dimensions.origin.era, it.article.dimensions.origin.place].filter(Boolean).join(' · ')}
                        >
                          <Flag code={it.code} className="mt-1" />
                          <span>
                            <span className="block text-sm leading-tight">{it.article.concept}</span>
                            <span className="block text-[10px] leading-tight text-muted-foreground">
                              {it.article.dimensions.origin.literal}
                              {it.year !== null && ` · ${yearLabel(it.year)}`}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
          {groups.length === 0 && <p className="py-8 text-center text-muted-foreground">אין מילים שתואמות את החיפוש</p>}
        </section>
      </div>

      <section aria-label="ציר זמן" className="mt-12">
        <h2 className="mb-1 font-heading text-xl font-bold text-accent">ציר הזמן</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          מימין העת העתיקה, משמאל היום. כל שורה היא {GROUP_LABELS[by]}; מילים מאותה תקופה עומדות זו מעל זו גם כשהן רחוקות במרחב.
        </p>
        <Timeline groups={groups} selected={selected} onSelectGroup={k => set({ group: k })} onOpen={open} />
      </section>
    </div>
  );
};

export default WorldPage;
