import { matchesKeywords } from '@/lib/search';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import DataTable, { Column } from '@/components/atlas/DataTable';
import DistillPanel from '@/components/atlas/DistillPanel';
import DiscoverPanel from '@/components/atlas/DiscoverPanel';
import {
  CultureDistillation,
  CultureProfile,
  ThemeDistillation,
  ThemeGroup,
  atlasId,
  cultureOf,
  cultureProfiles,
  distillCulture,
  distillTheme,
  distinctArticles,
  listEntries,
  themeGroups,
} from '@/lib/atlas';
import { getArticles, syncArticlesFromSupabase } from '@/lib/storage';
import { Article } from '@/types/article';

type Tab = 'theme' | 'culture' | 'discover';

const TABS: { id: Tab; label: string; lead: string }[] = [
  {
    id: 'theme',
    label: 'חפיפות לפי נושא',
    lead: 'צורך אנושי אחד, וכל התרבויות שעונות עליו. מה משותף לכולן, ובמה כל קריאה שונה.',
  },
  {
    id: 'culture',
    label: 'ייחודיות לפי תרבות',
    lead: 'תרבות אחת מול כל האחרות בספרייה. איפה התשובה שלה שונה, ומה חסר בה.',
  },
  {
    id: 'discover',
    label: 'מצא עוד ביטויים',
    lead: 'ביטויים שמייחדים כל תרבות ועוד אינם בספרייה. בוחרים ויוצרים ברצף.',
  },
];

/** A square, liftable tile used to pick a theme or a culture. */
const Tile: React.FC<{
  active: boolean;
  saved: boolean;
  title: string;
  meta: string;
  sub?: string;
  bar?: number;
  onClick: () => void;
}> = ({ active, saved, title, meta, sub, bar, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`group relative min-w-0 border p-3 text-right shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
      active ? 'border-accent bg-accent/15 shadow-md' : 'border-border bg-card/60 hover:border-accent/50'
    }`}
  >
    <span className="flex items-baseline justify-between gap-2">
      <span className="truncate font-heading font-bold">{title}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
    </span>
    {sub && <span className="mt-1 block truncate text-xs text-muted-foreground">{sub}</span>}
    {bar !== undefined && (
      <span className="mt-2 block h-1 w-full bg-muted" aria-hidden>
        <span className="block h-1 bg-accent" style={{ width: `${Math.round(bar * 100)}%` }} />
      </span>
    )}
    {saved && <span className="absolute left-2 top-1 text-[10px] text-accent">זוקק</span>}
  </button>
);

const List: React.FC<{ items: string[]; ordered?: boolean }> = ({ items, ordered }) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`space-y-1.5 pr-5 text-sm leading-relaxed ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </Tag>
  );
};

const AtlasPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = (['theme', 'culture', 'discover'] as Tab[]).includes(params.get('tab') as Tab)
    ? (params.get('tab') as Tab)
    : 'theme';
  const selected = params.get('key');

  const [raw, setRaw] = useState<Article[]>(getArticles);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [cultureSearch, setCultureSearch] = useState('');
  const [newCulture, setNewCulture] = useState('');

  const refresh = useCallback(() => setRaw(getArticles()), []);

  useEffect(() => {
    void syncArticlesFromSupabase().then(setRaw);
    void listEntries().then(list => setSaved(new Set(list.map(e => e.id))));
  }, []);

  const articles = useMemo(() => distinctArticles(raw), [raw]);
  const themes = useMemo(() => themeGroups(articles), [articles]);
  const profiles = useMemo(() => cultureProfiles(articles), [articles]);

  const go = (t: Tab, key?: string | null) => {
    const next: Record<string, string> = { tab: t };
    if (key) next.key = key;
    setParams(next);
  };

  const theme = tab === 'theme' ? themes.find(t => t.need === selected) ?? null : null;
  const profile = tab !== 'theme' ? profiles.find(p => p.culture === selected) ?? null : null;

  // ---------- Theme tables ----------

  const overviewColumns: Column<ThemeGroup>[] = [
    { key: 'need', label: 'צורך', text: g => g.need, className: 'font-bold' },
    { key: 'count', label: 'תרבויות', text: g => String(g.cultures.length).padStart(3, '0'), render: g => g.cultures.length },
    { key: 'cultures', label: 'אילו תרבויות', text: g => g.cultures.join(', ') },
    { key: 'concepts', label: 'מושגים', text: g => g.articles.map(a => a.concept).join(', '), hidden: true },
  ];

  const themeColumns: Column<Article>[] = [
    { key: 'culture', label: 'תרבות', text: a => cultureOf(a), className: 'whitespace-nowrap font-bold' },
    { key: 'concept', label: 'מושג', text: a => a.concept },
    {
      key: 'script',
      label: 'כתב מקור',
      text: a => a.dimensions.origin.script,
      render: a => <span className="text-base text-accent" dir="auto">{a.dimensions.origin.script}</span>,
    },
    { key: 'literal', label: 'משמעות מילולית', text: a => a.dimensions.origin.literal },
    { key: 'how', label: 'איך זה נעשה', text: a => a.dimensions.practice.how },
    { key: 'where', label: 'איך זה נראה במרחב', text: a => a.dimensions.practice.where },
    { key: 'space', label: 'שם המרחב', text: a => a.dimensions.spaceName, hidden: true },
    { key: 'lede', label: 'בשורה אחת', text: a => a.dimensions.lede, hidden: true },
  ];

  type ThemeRow = ThemeDistillation['rows'][number];
  const themeDistillColumns: Column<ThemeRow>[] = [
    { key: 'culture', label: 'תרבות', text: r => r.culture, className: 'whitespace-nowrap font-bold' },
    { key: 'concept', label: 'מושג', text: r => r.concept },
    { key: 'emphasis', label: 'מה היא מדגישה', text: r => r.emphasis },
    { key: 'mechanism', label: 'איך זה פועל', text: r => r.mechanism },
    { key: 'space', label: 'תרגום למרחב', text: r => r.space },
    { key: 'unique', label: 'מה רק היא מביאה', text: r => r.unique },
  ];

  type Tension = ThemeDistillation['tensions'][number];
  const tensionColumns: Column<Tension>[] = [
    { key: 'axis', label: 'ציר המתח', text: t => t.axis, className: 'font-bold' },
    { key: 'poles', label: 'בקצוות', text: t => t.poles },
    { key: 'meaning', label: 'מה זה חושף', text: t => t.meaning },
  ];

  // ---------- Culture tables ----------

  interface NeedRow {
    need: string;
    own: Article[];
    others: Article[];
  }
  const cultureRows: NeedRow[] = profile
    ? profile.needs.map(need => ({
        need,
        own: profile.articles.filter(a => a.dimensions.humanNeed === need),
        others: articles.filter(a => a.dimensions.humanNeed === need && cultureOf(a) !== profile.culture),
      }))
    : [];

  const cultureColumns: Column<NeedRow>[] = [
    { key: 'need', label: 'צורך', text: r => r.need, className: 'font-bold whitespace-nowrap' },
    { key: 'own', label: `המושג ב${profile?.culture ?? ''}`, text: r => r.own.map(a => a.concept).join(', ') },
    {
      key: 'count',
      label: 'תרבויות נוספות',
      text: r => String(new Set(r.others.map(cultureOf)).size).padStart(3, '0'),
      render: r => {
        const n = new Set(r.others.map(cultureOf)).size;
        return n === 0 ? <span className="text-accent">רק כאן</span> : n;
      },
    },
    {
      key: 'others',
      label: 'מקבילות בתרבויות אחרות',
      text: r => r.others.map(a => `${a.concept} (${cultureOf(a)})`).join(', '),
    },
  ];

  type CultureRow = CultureDistillation['rows'][number];
  const cultureDistillColumns: Column<CultureRow>[] = [
    { key: 'need', label: 'צורך', text: r => r.need, className: 'font-bold whitespace-nowrap' },
    { key: 'own', label: 'התשובה כאן', text: r => r.ownAnswer },
    { key: 'others', label: 'התשובה אצל אחרות', text: r => r.othersAnswer },
    { key: 'difference', label: 'ההבדל המכריע', text: r => r.difference },
  ];

  const visibleProfiles = profiles.filter(p => matchesKeywords(p.culture, cultureSearch));

  const cultureTiles = (
    <div className="space-y-3">
      <Input
        value={cultureSearch}
        onChange={e => setCultureSearch(e.target.value)}
        placeholder="חיפוש תרבות"
        className="h-9 max-w-xs text-right"
        dir="rtl"
      />
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {visibleProfiles.map(p => (
          <Tile
            key={p.culture}
            active={p.culture === selected}
            saved={tab === 'culture' && saved.has(atlasId('culture', p.culture))}
            title={p.culture}
            meta={`${p.articles.length} מושגים`}
            sub={p.needs.join(' · ')}
            bar={tab === 'culture' ? p.rarity : undefined}
            onClick={() => go(tab, p.culture)}
          />
        ))}
      </div>
      {tab === 'culture' && (
        <p className="text-xs text-muted-foreground">
          הפס מתחת לכל תרבות: איזה חלק מהצרכים שלה כמעט אף תרבות אחרת בספרייה לא עונה עליהם. פס מלא פירושו ייחודיות גבוהה.
        </p>
      )}
    </div>
  );

  return (
    <div className="container max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'בית', to: '/' },
          { label: 'אטלס', to: '/atlas' },
          ...(selected ? [{ label: selected }] : []),
        ]}
      />

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 font-heading text-fluid-lg font-bold text-primary"
      >
        אטלס תרבויות
      </motion.h1>
      <p className="mb-6 max-w-3xl text-muted-foreground">
        {articles.length} מושגים מ-{profiles.length} תרבויות, על {themes.length} צרכים אנושיים. הטבלאות נגזרות מהספרייה
        ומתעדכנות איתה. הזיקוקים נכתבים על ידי Gemini מתוך המושגים שבספרייה: הם כלי חשיבה, לא מחקר אתנוגרפי.
      </p>

      <nav className="mb-8 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3" aria-label="לשוניות האטלס">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            aria-pressed={tab === t.id}
            className={`border p-4 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
              tab === t.id ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card/60'
            }`}
          >
            <span className="block font-heading text-lg font-bold">{t.label}</span>
            <span className={`mt-1 block text-xs leading-relaxed ${tab === t.id ? 'opacity-80' : 'text-muted-foreground'}`}>
              {t.lead}
            </span>
          </button>
        ))}
      </nav>

      {tab === 'theme' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold">מפת החפיפות</h2>
            <p className="text-sm text-muted-foreground">
              כל צורך, וכמה תרבויות עונות עליו. ככל שיותר תרבויות נפגשות על אותו צורך, כך ההשוואה עשירה יותר. לחיצה על
              שורה פותחת את הנושא.
            </p>
            <DataTable
              columns={overviewColumns}
              rows={themes}
              rowKey={g => g.need}
              onRowClick={g => go('theme', g.need)}
            />
          </section>

          {!theme ? (
            <p className="border border-dashed border-border p-6 text-center text-muted-foreground">
              בחרי צורך מהטבלה כדי לראות את התרבויות זו לצד זו ולזקק את החפיפות.
            </p>
          ) : (
            <motion.div key={theme.need} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <section className="space-y-3">
                <h2 className="font-heading text-2xl font-bold text-primary">{theme.need}</h2>
                <p className="text-sm text-muted-foreground">
                  {theme.cultures.length} תרבויות, {theme.articles.length} מושגים. לחיצה על שורה פותחת את המאמר.
                </p>
                <DataTable
                  columns={themeColumns}
                  rows={theme.articles}
                  rowKey={a => a.id}
                  onRowClick={a => navigate(`/article/${a.id}`)}
                />
              </section>

              {theme.articles.length < 2 ? (
                <p className="text-sm text-muted-foreground">
                  כדי לזקק חפיפות צריך לפחות שני מושגים. אפשר להוסיף מושגים בלשונית "מצא עוד ביטויים".
                </p>
              ) : (
                <DistillPanel<ThemeDistillation>
                  kind="theme"
                  entryKey={theme.need}
                  title={`החפיפות סביב ${theme.need}`}
                  basis={`הזיקוק קורא את ${theme.articles.length} המושגים שבטבלה ומחזיר: הליבה המשותפת, מה כל קריאה מדגישה, צירי המתח ביניהן, תובנות לתכנון ופרומפט להמחשה.`}
                  run={() => distillTheme(theme)}
                  render={d => (
                    <div className="space-y-6">
                      <div className="border-r-2 border-accent pr-4">
                        <h4 className="mb-1 text-sm font-bold text-accent">הליבה המשותפת</h4>
                        <p className="leading-relaxed">{d.core}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-accent">כל קריאה ומה שהיא מביאה</h4>
                        <DataTable columns={themeDistillColumns} rows={d.rows} rowKey={r => `${r.culture}-${r.concept}`} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-accent">צירי המתח</h4>
                        <DataTable columns={tensionColumns} rows={d.tensions} rowKey={t => t.axis} />
                      </div>
                      <div className="grid min-w-0 gap-5 md:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-sm font-bold text-accent">תובנות</h4>
                          <List items={d.insights} ordered />
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-bold text-accent">עקרונות למרחב אחד שמחזיק את כולן</h4>
                          <List items={d.design} />
                        </div>
                      </div>
                    </div>
                  )}
                />
              )}
            </motion.div>
          )}
        </div>
      )}

      {tab === 'culture' && (
        <div className="space-y-8">
          {cultureTiles}
          {!profile ? (
            <p className="border border-dashed border-border p-6 text-center text-muted-foreground">
              בחרי תרבות כדי לראות במה היא שונה מהאחרות.
            </p>
          ) : (
            <CultureView
              profile={profile}
              articles={articles}
              rows={cultureRows}
              columns={cultureColumns}
              distillColumns={cultureDistillColumns}
              onCreated={refresh}
            />
          )}
        </div>
      )}

      {tab === 'discover' && (
        <div className="space-y-8">
          {cultureTiles}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">או תרבות שעוד אין בספרייה:</span>
            <Input
              value={newCulture}
              onChange={e => setNewCulture(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && newCulture.trim() && go('discover', newCulture.trim())}
              placeholder="למשל: מקסיקו, איסלנד, פרס"
              className="h-9 max-w-xs text-right"
              dir="rtl"
            />
            <button
              onClick={() => newCulture.trim() && go('discover', newCulture.trim())}
              disabled={!newCulture.trim()}
              className="border border-border bg-card px-3 py-1.5 text-sm shadow-sm transition-all hover:-translate-y-px hover:border-accent disabled:opacity-50"
            >
              בחר
            </button>
          </div>
          {selected ? (
            <DiscoverPanel key={selected} culture={selected} articles={articles} onCreated={refresh} />
          ) : (
            <p className="border border-dashed border-border p-6 text-center text-muted-foreground">
              בחרי תרבות, או הקלידי תרבות חדשה, כדי לקבל הצעות.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface CultureViewProps {
  profile: CultureProfile;
  articles: Article[];
  rows: { need: string; own: Article[]; others: Article[] }[];
  columns: Column<{ need: string; own: Article[]; others: Article[] }>[];
  distillColumns: Column<CultureDistillation['rows'][number]>[];
  onCreated: () => void;
}

const CultureView: React.FC<CultureViewProps> = ({ profile, articles, rows, columns, distillColumns, onCreated }) => {
  const alone = rows.filter(r => r.others.length === 0).length;
  return (
    <motion.div key={profile.culture} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-bold text-primary">{profile.culture}</h2>
        <p className="text-sm text-muted-foreground">
          {profile.articles.length} מושגים על {profile.needs.length} צרכים.
          {alone > 0 ? ` ב-${alone} מהם היא היחידה בספרייה.` : ''} ייחודיות: {Math.round(profile.rarity * 100)}%.
        </p>
        <DataTable columns={columns} rows={rows} rowKey={r => r.need} />
      </section>

      <DistillPanel<CultureDistillation>
        kind="culture"
        entryKey={profile.culture}
        title={`מה מייחד את ${profile.culture}`}
        basis={`הזיקוק קורא את ${profile.articles.length} המושגים של ${profile.culture} מול ${
          articles.length - profile.articles.length
        } מושגים של תרבויות אחרות, ומחזיר: מהות, חתימות, טבלת הבדלים לפי צורך, צרכים שאין להם מענה בספרייה, תובנות ופרומפט להמחשה.`}
        run={() => distillCulture(profile, articles)}
        render={d => (
          <div className="space-y-6">
            <div className="border-r-2 border-accent pr-4">
              <h4 className="mb-1 text-sm font-bold text-accent">המהות</h4>
              <p className="leading-relaxed">{d.essence}</p>
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              {d.signatures.map(s => (
                <div key={s.trait} className="border border-border bg-background/60 p-3 shadow-sm">
                  <h5 className="font-heading font-bold">{s.trait}</h5>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.evidence}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-accent">התשובה שלה מול האחרות</h4>
              <DataTable columns={distillColumns} rows={d.rows} rowKey={r => r.need} />
            </div>
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-bold text-accent">צרכים בלי מענה בספרייה</h4>
                {d.blindSpots.length ? (
                  <ul className="space-y-1.5 text-sm leading-relaxed">
                    {d.blindSpots.map(b => (
                      <li key={b.need}>
                        <span className="font-bold">{b.need}:</span> {b.note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">אין.</p>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-bold text-accent">תובנות</h4>
                <List items={d.insights} ordered />
              </div>
            </div>
          </div>
        )}
      />

      <DiscoverPanel key={profile.culture} culture={profile.culture} articles={articles} onCreated={onCreated} />
    </motion.div>
  );
};

export default AtlasPage;
