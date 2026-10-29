import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Suggestion, suggestConcepts } from '@/lib/atlas';
import { createArticle } from '@/lib/create';
import { findArticleByConcept } from '@/lib/storage';
import { Article } from '@/types/article';

type Status = 'waiting' | 'writing' | 'done' | 'exists' | 'failed';

const statusLabel: Record<Status, string> = {
  waiting: 'ממתין',
  writing: 'כותב…',
  done: 'נוצר',
  exists: 'כבר בספרייה',
  failed: 'נכשל',
};

interface Props {
  culture: string;
  articles: Article[];
  onCreated: () => void;
}

/**
 * Finds expressions that are distinctive of one culture and missing from the
 * library, then writes the chosen ones one after another, each into the shared
 * library like any other article.
 */
const DiscoverPanel: React.FC<Props> = ({ culture, articles, onCreated }) => {
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [rejected, setRejected] = useState<Suggestion[]>([]);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Record<number, { s: Status; id?: string; error?: string }>>({});
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async () => {
    setBusy(true);
    setError(null);
    setStatus({});
    try {
      const { usable, rejected } = await suggestConcepts(culture, articles);
      setItems(usable);
      setRejected(rejected);
      // Only what has its own Wikipedia page starts selected; a mere mention waits
      // for a look at the source.
      setChosen(new Set(usable.flatMap((s, i) => (s.verified === 'title' ? [i] : []))));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'החיפוש נכשל.');
    } finally {
      setBusy(false);
    }
  };

  const createChosen = async () => {
    if (!items) return;
    setRunning(true);
    for (const i of [...chosen].sort((a, b) => a - b)) {
      const s = items[i];
      const existing = findArticleByConcept(s.concept);
      if (existing) {
        setStatus(st => ({ ...st, [i]: { s: 'exists', id: existing.id } }));
        continue;
      }
      setStatus(st => ({ ...st, [i]: { s: 'writing' } }));
      try {
        const hint = `${s.transliteration} (${s.script}) - ${culture}. ${s.why}`;
        const article = await createArticle(s.concept, hint);
        setStatus(st => ({ ...st, [i]: { s: 'done', id: article.id } }));
        onCreated();
      } catch (e) {
        setStatus(st => ({ ...st, [i]: { s: 'failed', error: e instanceof Error ? e.message : '' } }));
      }
    }
    setRunning(false);
  };

  return (
    <section className="space-y-4 border border-border bg-card/70 p-5 shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.5)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-bold text-primary">עוד ביטויים מ{culture}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Gemini מציע ביטויים שמייחדים את התרבות ועוד אינם בספרייה. כל הצעה נבדקת מול ויקיפדיה האנגלית: ביטוי
            שיש לו ערך משלו מסומן מראש, ביטוי שמוזכר רק בתוך ערך אחר מוצג עם הערך לבדיקה, וביטוי שלא נמצא כלל
            נפסל. המודל טועה, הבדיקה החיצונית היא מה שמגן על הספרייה.
          </p>
        </div>
        <Button onClick={find} disabled={busy || running} variant={items ? 'outline' : 'default'}>
          {busy ? 'מחפש…' : items ? 'הצעות אחרות' : 'מצא ביטויים'}
        </Button>
      </header>

      {error && <p className="border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}

      {items && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          אף הצעה לא אומתה מול ויקיפדיה. כנראה שהמודל החינמי לא מכיר מספיק ביטויים מהתרבות הזאת. אפשר לבקש שוב, או
          להוסיף מושג שאת מכירה ישירות מדף הבית.
        </p>
      )}

      {rejected.length > 0 && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          נפסלו כי לא נמצאו בוויקיפדיה: {rejected.map(r => `${r.concept} (${r.transliteration})`).join(', ')}.
        </p>
      )}

      {items && items.length > 0 && (
        <>
          <ul className="grid min-w-0 gap-3 md:grid-cols-2">
            {items.map((s, i) => {
              const st = status[i];
              const on = chosen.has(i);
              return (
                <li key={`${s.transliteration}-${i}`} className="min-w-0">
                  <label
                    className={`flex h-full cursor-pointer gap-3 border p-3 shadow-sm transition-all hover:-translate-y-px ${
                      on ? 'border-accent/60 bg-accent/10' : 'border-border bg-background/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={running}
                      onChange={() =>
                        setChosen(c => {
                          const n = new Set(c);
                          if (n.has(i)) n.delete(i);
                          else n.add(i);
                          return n;
                        })
                      }
                      className="mt-1 accent-[hsl(var(--accent))]"
                    />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-heading text-lg font-bold">{s.concept}</span>
                        <span className="text-sm text-accent" dir="auto">{s.script}</span>
                        <span className="text-xs text-muted-foreground" dir="ltr">{s.transliteration}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        "{s.literal}" · {s.need} ·{' '}
                        <span className={s.verified === 'title' ? 'text-accent' : 'text-destructive'}>
                          {s.verified === 'title' ? 'אומת: ערך בוויקיפדיה' : 'מוזכר בלבד, לבדוק לפני יצירה'}
                        </span>
                      </span>
                      {s.source && (
                        <a
                          href={s.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="block text-xs text-muted-foreground underline underline-offset-2 hover:text-accent"
                          dir="ltr"
                        >
                          Wikipedia: {s.sourceTitle}
                          {s.hebrewTitle ? ` · ${s.hebrewTitle}` : ''}
                        </a>
                      )}
                      <span className="block text-sm leading-relaxed">{s.why}</span>
                      {st && (
                        <span className={`block text-xs ${st.s === 'failed' ? 'text-destructive' : 'text-accent'}`}>
                          {statusLabel[st.s]}
                          {st.error ? `: ${st.error}` : ''}
                          {st.id && (
                            <>
                              {' · '}
                              <Link to={`/article/${st.id}`} className="underline" onClick={e => e.stopPropagation()}>
                                פתח
                              </Link>
                            </>
                          )}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={createChosen} disabled={running || chosen.size === 0}>
              {running ? 'יוצר, אחד אחרי השני…' : `צור את הנבחרים (${chosen.size})`}
            </Button>
            <span className="text-xs text-muted-foreground">כל מושג נכתב בכמה שניות ונשמר בספרייה המשותפת.</span>
          </div>
        </>
      )}
    </section>
  );
};

export default DiscoverPanel;
