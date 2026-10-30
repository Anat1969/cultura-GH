import React, { useEffect, useState } from 'react';
import { callFunction } from '@/lib/ai';
import { loadEntry, saveEntry, AtlasEntry } from '@/lib/atlas';
import { GROUP_LABELS, GroupBy, WorldGroup, WorldItem } from '@/lib/world';
import { ORDER_LABEL, LanguageProfile } from '@/data/languages';
import { ARCHITAIP_URL, Civilization } from '@/data/civilizations';
import { Flag } from '@/components/CultureMarks';
import Rich, { InsightBlock } from '@/components/Rich';

interface GroupReading {
  insight: string;
  explanation: string;
  shared: { trait: string; evidence: string }[];
  members: { concept: string; unique: string }[];
  tension: { axis: string; poles: string; meaning: string };
  language: string;
  action: string;
  haiku: { lines: string[]; illuminates: string };
  count?: number;
}

const label = 'mb-2 block font-mono text-[11px] tracking-wide text-muted-foreground';

/** The languages of a group side by side: the structure, as facts with a source. */
const LanguageTable: React.FC<{ languages: LanguageProfile[] }> = ({ languages }) => {
  if (!languages.length) return null;
  const rows: [string, (l: LanguageProfile) => string][] = [
    ['סדר המשפט', l => `${l.order} · ${ORDER_LABEL[l.order]}`],
    ['כתב', l => `${l.script} · ${l.letters}`],
    ['בניית מילה', l => l.build],
    ['מין דקדוקי', l => l.gender],
    ['פנייה', l => l.politeness],
    ['הקשר (Hall)', l => l.context ?? ''],
    ['ייחוד', l => l.trait],
  ];
  return (
    <section>
      <span className={label}>השפות בקבוצה</span>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[520px] text-right text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 font-mono font-normal text-muted-foreground" />
              {languages.map(l => (
                <th key={l.code} className="p-2 font-heading text-sm font-bold">{l.he}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .filter(([, f]) => languages.some(l => f(l)))
              .map(([name, f]) => (
                <tr key={name} className="border-t border-border/60 align-top">
                  <th className="whitespace-nowrap p-2 font-mono font-normal text-muted-foreground">{name}</th>
                  {languages.map(l => (
                    <td key={l.code} className="p-2 leading-relaxed text-foreground/85">{f(l) || '·'}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        מקורות: WALS Online (Dryer & Haspelmath, 2013) לסדר ולמין; האלפבית הרשמי של כל שפה; Edward T. Hall, Beyond Culture, 1976
      </p>
    </section>
  );
};

/** The ancient roots in a group, each a door into ARCHITAIP. */
const Roots: React.FC<{ civs: Civilization[] }> = ({ civs }) => {
  if (!civs.length) return null;
  return (
    <section>
      <span className={label}>השורש העתיק (ARCHITAIP)</span>
      <div className="flex flex-wrap gap-2">
        {civs.map(c => (
          <a
            key={c.id}
            href={`${ARCHITAIP_URL}/c/${c.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border bg-background/60 px-3 py-2 text-right shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
            style={{ borderInlineStartWidth: 4, borderInlineStartColor: c.color }}
          >
            <span className="block font-heading text-sm font-bold">{c.name}</span>
            <span className="block text-[11px] text-muted-foreground">{c.archetype} · מול {c.chaos}</span>
          </a>
        ))}
      </div>
    </section>
  );
};

const GroupPanel: React.FC<{ group: WorldGroup; by: GroupBy; onOpen: (it: WorldItem) => void }> = ({ group, by, onOpen }) => {
  const [entry, setEntry] = useState<AtlasEntry<GroupReading> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = `${by}|${group.key}`;
  const items = group.items;

  const languages = [...new Map(items.filter(i => i.language).map(i => [i.language!.code, i.language!])).values()];
  const civs = [...new Map(items.filter(i => i.civilization).map(i => [i.civilization!.id, i.civilization!])).values()];

  const distill = async (base: AtlasEntry<GroupReading>) => {
    setBusy(true);
    setError('');
    try {
      const data = await callFunction<GroupReading>('culture-group', {
        group: group.key,
        by: GROUP_LABELS[by],
        items: items.map(i => ({
          concept: i.article.concept,
          culture: i.article.dimensions.origin.culture,
          literal: i.article.dimensions.origin.literal,
          era: i.article.dimensions.origin.era ?? '',
          insight: (i.article.dimensions.insight ?? '').split(/(?<=[.!?])\s/)[0],
          language: i.language ? `${i.language.he}, ${i.language.order}, ${i.language.build}` : '',
        })),
      });
      const next = { ...base, data: { ...data, count: items.length } };
      setEntry(next);
      await saveEntry(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הזיקוק נכשל');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let live = true;
    setEntry(null);
    setError('');
    loadEntry<GroupReading>('group', key)
      .then(e => {
        if (!live) return;
        setEntry(e);
        // A group of two or more is read once, then kept; reading it costs a free Gemini call.
        if (!e.data && items.length >= 2) void distill(e);
      })
      .catch(() => live && setError('טעינת הניתוח נכשלה'));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reading = entry?.data;
  const byConcept = new Map(items.map(i => [i.article.concept, i]));
  const grown = reading?.count !== undefined && reading.count !== items.length;

  return (
    <div className="space-y-6 border border-border bg-card/80 p-5 shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.5)]">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 font-heading text-2xl font-bold">
          <span className="inline-block h-4 w-4" style={{ background: group.color }} />
          {group.key}
        </h3>
        <span className="font-mono text-xs text-muted-foreground">{items.length} מילים · {GROUP_LABELS[by]}</span>
      </header>

      {items.length < 2 ? (
        <p className="text-sm text-muted-foreground">מילה אחת בקבוצה: אין עם מה להשוות עדיין.</p>
      ) : busy && !reading ? (
        <p className="text-sm text-muted-foreground" role="status">מזקק את הקבוצה: המכנה המשותף והייחוד של כל מילה…</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error}{' '}
          <button className="underline" onClick={() => entry && distill(entry)}>נסי שוב</button>
        </p>
      ) : reading ? (
        <>
          <InsightBlock insight={reading.insight} explanation={reading.explanation} />

          <section>
            <span className={label}>המכנה המשותף</span>
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {reading.shared.map((s, i) => (
                <li key={i} className="border border-border bg-background/60 p-3">
                  <span className="block font-heading font-bold text-accent">{s.trait}</span>
                  <Rich text={s.evidence} className="mt-1 text-xs leading-relaxed text-foreground/80" />
                </li>
              ))}
            </ol>
          </section>

          <section>
            <span className={label}>הייחוד של כל אחת</span>
            <ul className="divide-y divide-border/60 border-y border-border/60">
              {reading.members.map(m => {
                // The model sometimes copies the whole input line; the name is what comes before "(".
                const name = m.concept.split(/\s*\(/)[0].trim();
                const it = byConcept.get(name) ?? items.find(i => name.startsWith(i.article.concept));
                return (
                  <li key={name} className="flex items-start gap-3 py-2">
                    <button
                      onClick={() => it && onOpen(it)}
                      disabled={!it}
                      className="flex shrink-0 basis-32 items-center gap-1.5 text-right font-bold hover:text-accent"
                    >
                      {it && <Flag code={it.code} />}
                      {name}
                    </button>
                    <Rich text={m.unique} className="text-sm leading-relaxed text-foreground/85" />
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="border-r-4 border-[hsl(25_90%_55%)] bg-[hsl(25_90%_55%/0.07)] p-3">
            <span className={label}>המתח בתוך הקבוצה: {reading.tension.axis}</span>
            <p className="text-sm font-bold">{reading.tension.poles}</p>
            <Rich text={reading.tension.meaning} className="mt-1 text-sm text-foreground/80" />
          </section>

          <LanguageTable languages={languages} />
          {reading.language && (
            <section>
              <span className={label}>מה השפה מספרת (קריאה, לא הוכחה)</span>
              <Rich text={reading.language} className="text-sm leading-relaxed" />
            </section>
          )}

          <Roots civs={civs} />

          <section className="border-r-4 border-[hsl(145_55%_42%)] bg-[hsl(145_55%_42%/0.08)] p-3">
            <span className={label}>ליישום</span>
            <Rich text={reading.action} className="text-sm font-bold" />
          </section>

          <figure className="text-center">
            <blockquote className="font-heading text-lg leading-relaxed text-accent">
              {reading.haiku.lines.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </blockquote>
            <figcaption className="mt-1 text-xs text-muted-foreground">{reading.haiku.illuminates}</figcaption>
          </figure>

          <p className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
            <span>ניתוח של Gemini על בסיס הספרייה, נשמר ומשותף. העובדות על השפות מהטבלה שלמעלה.</span>
            <button
              onClick={() => entry && distill(entry)}
              disabled={busy}
              className="border border-border px-2 py-1 shadow-sm hover:-translate-y-px hover:shadow"
            >
              {busy ? 'מזקק…' : grown ? 'הקבוצה השתנתה: זקק מחדש' : 'זקק מחדש'}
            </button>
          </p>
        </>
      ) : (
        <>
          <LanguageTable languages={languages} />
          <Roots civs={civs} />
        </>
      )}
    </div>
  );
};

export default GroupPanel;
