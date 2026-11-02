import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Article, articleLede } from '@/types/article';
import FitImage, { usableImage } from '@/components/FitImage';
import { Flag } from '@/components/CultureMarks';
import { countryCode, countryOf } from '@/data/geo';
import { civilizationOf, ARCHITAIP_URL } from '@/data/civilizations';
import { languageOf, ORDER_LABEL } from '@/data/languages';

/*
 * The home page's first job: make the idea itself felt before anything is
 * asked of the visitor. Some words have no translation, yet they have a place.
 * The page walks that idea in five moves: wonder (a word in a script you cannot
 * read), a guess (the meaning first, the culture hidden), understanding (the
 * five scales on one real word), seeing (word, source, insight, space) and the
 * museum wall (every image, the numbers, a quote and a haiku).
 * Everything is drawn from the library; nothing on it is invented for show.
 */

const SCRIPT_FONT = "'Playfair Display', 'Noto Serif JP', 'Noto Naskh Arabic', 'Noto Serif Devanagari', serif";
const worldLink = (by: string, group: string) => `/world?by=${by}&group=${encodeURIComponent(group)}`;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`block font-mono text-[11px] tracking-[0.18em] text-muted-foreground ${className}`}>{children}</span>
);

const Marker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <mark className="bg-[hsl(48_96%_60%/0.4)] px-1 text-foreground">{children}</mark>
);

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/* 1. The lens: a word you cannot read, then what it says, then its place. */

const PHASES = [1900, 1900, 3600];

const WordLens: React.FC<{ pool: Article[]; index: number; onIndex: (i: number) => void }> = ({ pool, index, onIndex }) => {
  const reduced = useMemo(reducedMotion, []);
  const [phase, setPhase] = useState(reduced ? 2 : 0);
  const [paused, setPaused] = useState(false);
  const a = pool[index];

  useEffect(() => {
    setPhase(reduced ? 2 : 0);
  }, [index, reduced]);

  useEffect(() => {
    if (reduced || paused || pool.length === 0) return;
    const t = setTimeout(() => {
      if (phase < 2) setPhase(phase + 1);
      else onIndex((index + 1) % pool.length);
    }, PHASES[phase]);
    return () => clearTimeout(t);
  }, [phase, paused, reduced, index, pool.length, onIndex]);

  if (!a) return null;
  const o = a.dimensions.origin;
  const image = usableImage(a.images.exterior);

  return (
    <div
      className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="min-w-0">
        <Label>CULTUREARCH · מילים שאין להן תרגום</Label>
        <h1 className="mt-5 font-heading text-fluid-xl font-bold leading-[1.08] text-primary">
          יש מילים
          <br />
          שאין להן תרגום.
          <br />
          <span className="text-muted-foreground">אבל יש להן מקום.</span>
        </h1>
        <p className="mt-6 max-w-md text-fluid-md leading-relaxed text-foreground/80">
          כל מילה כאן נולדה בשפה אחת.
          <br />
          היא נבדקת מול <strong>מקור</strong>, מתפרקת לשורשים,
          <br />
          והופכת ל<strong>מרחב מחייה בישראל</strong>.
        </p>

        {/* The word itself, revealed in three beats */}
        <div className="mt-10 min-h-[13rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <Label>מילה {String(index + 1).padStart(2, '0')} מתוך {String(pool.length).padStart(2, '0')}</Label>
              <p
                className="mt-2 text-5xl leading-tight text-foreground sm:text-6xl"
                dir="auto"
                style={{ fontFamily: SCRIPT_FONT, textAlign: 'right' }}
              >
                {o.script || a.concept}
              </p>
              <motion.div animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 0.6 }} className="mt-3 space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Flag article={a} />
                  <strong>{a.concept}</strong>
                  <span className="text-muted-foreground" dir="ltr">{o.transliteration}</span>
                  {o.culture && <span className="text-muted-foreground">· {o.culture}</span>}
                </p>
                <p className="text-xl font-bold leading-snug">״{o.literal}״</p>
              </motion.div>
              <motion.div animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 0.6 }} className="mt-3">
                <Link to={`/article/${a.id}`} className="group inline-flex items-baseline gap-2 text-sm">
                  <Label className="inline">המרחב</Label>
                  <span className="font-heading text-lg font-bold underline-offset-4 group-hover:underline">
                    {a.dimensions.spaceName}
                  </span>
                  <span className="text-muted-foreground transition-transform group-hover:-translate-x-1">←</span>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href="#guess"
            className="bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            נחשי מילה ↓
          </a>
          <a
            href="#create"
            className="border border-foreground/80 px-5 py-3 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            לכתוב מילה משלך
          </a>
          <div className="flex items-center gap-1" role="group" aria-label="מילה הבאה">
            <button
              type="button"
              onClick={() => onIndex((index - 1 + pool.length) % pool.length)}
              className="px-2 py-1 text-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="המילה הקודמת"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % pool.length)}
              className="px-2 py-1 text-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="המילה הבאה"
            >
              ←
            </button>
          </div>
        </div>
      </div>

      {/* The place: the image arrives last, whole and unframed */}
      <Link to={`/article/${a.id}`} className="group relative -mx-4 block sm:mx-0" aria-label={a.dimensions.spaceName}>
        <div className="relative aspect-square w-full bg-muted shadow-[0_30px_60px_-34px_rgb(0_0_0/0.55)]">
          <span
            className="absolute inset-0 flex items-center justify-center px-6 text-center text-[clamp(4rem,14vw,10rem)] leading-none text-foreground/15"
            dir="auto"
            style={{ fontFamily: SCRIPT_FONT }}
          >
            {o.script || a.concept}
          </span>
          {image && (
            <motion.div
              key={image}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            >
              <FitImage src={image} alt={a.dimensions.spaceName} className="h-full w-full" loading="eager" />
            </motion.div>
          )}
        </div>
        <p className="mt-2 px-4 text-xs text-muted-foreground sm:px-0">
          {phase < 2 ? 'המילה מחפשת את המקום שלה…' : `${o.culture ? o.culture + ' · ' : ''}${o.region_en}`}
        </p>
      </Link>
    </div>
  );
};

/* 2. Guess: the meaning is shown, the culture is hidden. */

const GuessCard: React.FC<{ a: Article; options: string[] }> = ({ a, options }) => {
  const [picked, setPicked] = useState<string | null>(null);
  const o = a.dimensions.origin;
  const image = usableImage(a.images.exterior);
  const right = picked === o.culture;

  return (
    <div className="flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden bg-muted shadow-[0_18px_36px_-26px_rgb(0_0_0/0.5)]">
        <AnimatePresence mode="wait">
          {picked && image ? (
            <motion.div key="img" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
              <FitImage src={image} alt={a.dimensions.spaceName} className="h-full w-full" />
            </motion.div>
          ) : (
            <motion.div
              key="meaning"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              exit={{ opacity: 0 }}
            >
              <Label>הפירוש</Label>
              <p className="font-heading text-2xl font-bold leading-snug sm:text-3xl">״{o.literal}״</p>
              {a.dimensions.humanNeed && <p className="text-xs text-muted-foreground">צורך: {a.dimensions.humanNeed}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!picked ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold">באיזו תרבות נולדה המילה?</p>
          <div className="flex flex-wrap gap-2">
            {options.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setPicked(c)}
                className="bg-card px-3 py-2 text-sm text-muted-foreground shadow-[0_2px_6px_rgb(0_0_0/0.12)] transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-[0_6px_14px_rgb(0_0_0/0.16)] active:translate-y-0"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-1">
          <p className={`text-sm font-bold ${right ? 'text-[hsl(145_55%_32%)]' : 'text-[hsl(0_65%_44%)]'}`}>
            {right ? 'נכון.' : `לא ${picked}.`}
          </p>
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl" dir="auto" style={{ fontFamily: SCRIPT_FONT }}>
              {o.script || a.concept}
            </span>
            <strong>{a.concept}</strong>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Flag article={a} /> {o.culture}
            {o.region_en && <span dir="ltr">· {o.region_en}</span>}
          </p>
          <Link to={`/article/${a.id}`} className="inline-block pt-1 text-sm font-bold underline underline-offset-4">
            {a.dimensions.spaceName} ←
          </Link>
        </motion.div>
      )}
    </div>
  );
};

const GuessGame: React.FC<{ pool: Article[] }> = ({ pool }) => {
  const [round, setRound] = useState(0);
  const cultures = useMemo(() => [...new Set(pool.map(a => a.dimensions.origin.culture).filter(Boolean))], [pool]);
  const cards = useMemo(() => {
    // Three words from three different cultures, so the choice is a real one.
    const seen = new Set<string>();
    return shuffled(pool)
      .filter(a => {
        const c = a.dimensions.origin.culture;
        if (!c || seen.has(c)) return false;
        seen.add(c);
        return true;
      })
      .slice(0, 3)
      .map(a => ({
        a,
        options: shuffled([a.dimensions.origin.culture, ...shuffled(cultures.filter(c => c !== a.dimensions.origin.culture)).slice(0, 2)]),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, cultures, round]);

  if (cards.length < 3) return null;

  return (
    <section id="guess" className="scroll-mt-20">
      <motion.div {...inView()} className="mb-10 max-w-2xl">
        <Label>02 · ניחוש</Label>
        <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">קודם התחושה. אחר כך המילה.</h2>
        <p className="mt-3 leading-relaxed text-foreground/80">
          כל אחת מהתחושות האלה מוכרת לך.
          <br />
          רק שפה אחת בעולם טרחה לתת לה שם.
          <br />
          <strong>נחשי איזו.</strong>
        </p>
      </motion.div>
      <div key={round} className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6 lg:gap-10">
        {cards.map(({ a, options }, i) => (
          <motion.div key={a.id} {...inView(i * 0.08)}>
            <GuessCard a={a} options={options} />
          </motion.div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRound(r => r + 1)}
        className="mt-10 border border-foreground/80 px-5 py-3 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
      >
        שלוש מילים אחרות
      </button>
    </section>
  );
};

/* 3. From the world to the letter: the five scales, on one real word. */

const ScaleLens: React.FC<{ a: Article }> = ({ a }) => {
  const o = a.dimensions.origin;
  const code = countryCode(o);
  const country = countryOf(code);
  const civ = civilizationOf(code, o.culture);
  const lang = languageOf({ ...o, country: code });

  const rungs: { n: string; name: string; value: React.ReactNode; note: string; to?: string; href?: string; color?: string }[] = [
    {
      n: '1',
      name: 'עולם',
      value: country ? `${country.he}, ${country.continent}` : o.region_en,
      note: [o.era, o.place].filter(Boolean).join(' · ') || 'איפה ומתי המילה נולדה',
      to: '/world',
    },
    ...(civ
      ? [{
          n: '2',
          name: 'שורש עתיק',
          value: civ.name,
          note: `ארכיטיפ: ${civ.archetype}`,
          href: `${ARCHITAIP_URL}/c/${civ.id}`,
          color: civ.color,
        }]
      : []),
    ...(country
      ? [{ n: '3', name: 'קבוצה', value: country.region, note: o.tradition || 'מה משותף לשכנות, ומה כל אחת שומרת לעצמה', to: worldLink('region', country.region) }]
      : []),
    ...(lang
      ? [{
          n: '4',
          name: 'שפה',
          value: lang.he,
          note: `${lang.script} · ${ORDER_LABEL[lang.order]}`,
          to: worldLink('syntax', `${lang.order}: ${ORDER_LABEL[lang.order]}`),
        }]
      : []),
    {
      n: '5',
      name: 'מילה',
      value: (
        <span dir="auto" style={{ fontFamily: SCRIPT_FONT }}>
          {o.script || a.concept}
        </span>
      ),
      note: `${a.concept} · ״${o.literal}״`,
      to: `/article/${a.id}`,
    },
  ];
  // The lens narrows step by step, from the whole world to one word.
  const widths = ['100%', '88%', '76%', '64%', '52%'];

  return (
    <section>
      <motion.div {...inView()} className="mb-10 max-w-2xl">
        <Label>03 · קנה מידה</Label>
        <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">מהעולם אל האות, ובחזרה.</h2>
        <p className="mt-3 leading-relaxed text-foreground/80">
          תרבות נקראת בחמישה קני מידה.
          <br />
          כאן כולם על מילה אחת: <strong>{a.concept}</strong>.
        </p>
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        {rungs.map((r, i) => {
          const body = (
            <div className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-6">
              <span className="min-w-0">
                <Label>{r.n} · {r.name}</Label>
                <span className="mt-1 block font-heading text-lg font-bold sm:text-xl">{r.value}</span>
                <span className="block truncate text-xs text-muted-foreground">{r.note}</span>
              </span>
              <span className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1">←</span>
            </div>
          );
          const cls =
            'group block bg-card text-right shadow-[0_6px_18px_-10px_rgb(0_0_0/0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-14px_rgb(0_0_0/0.4)]';
          const style: React.CSSProperties = {
            width: `max(${widths[i] ?? '52%'}, 17rem)`,
            maxWidth: '100%',
            borderRight: `4px solid ${r.color ?? 'hsl(var(--foreground) / ' + (0.15 + i * 0.17) + ')'}`,
          };
          return (
            <motion.div key={r.name} {...inView(i * 0.1)} style={style}>
              {r.href ? (
                <a href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {body}
                </a>
              ) : (
                <Link to={r.to ?? '/'} className={cls}>
                  {body}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        הפס מימין מתכהה ככל שמתקרבים למילה. צבע מופיע רק בשורש העתיק, בצבע שלו ב-ARCHITAIP.
      </p>
    </section>
  );
};

/* 4. How a word becomes a space, on one real article. */

const Method: React.FC<{ a: Article }> = ({ a }) => {
  const o = a.dimensions.origin;
  const local = usableImage(a.images.interior);
  const steps: { n: string; name: string; body: React.ReactNode }[] = [
    {
      n: '01',
      name: 'מילה',
      body: (
        <>
          <span className="block text-4xl leading-tight" dir="auto" style={{ fontFamily: SCRIPT_FONT, textAlign: 'right' }}>
            {o.script || a.concept}
          </span>
          <span className="mt-1 block text-sm">
            <strong>{a.concept}</strong> · ״{o.literal}״
          </span>
        </>
      ),
    },
    {
      n: '02',
      name: 'מקור',
      body: (
        <>
          <span className="block text-sm leading-relaxed">{o.story || [o.era, o.place].filter(Boolean).join(' · ')}</span>
          <span className="mt-2 block text-xs text-muted-foreground">
            {o.basis === 'wikipedia' ? 'נבדק מול ויקיפדיה' : 'הערכת מודל, מסומנת ככזו'}
          </span>
        </>
      ),
    },
    {
      n: '03',
      name: 'תובנה',
      body: <span className="block text-sm font-bold leading-relaxed">{articleLede(a.dimensions)}</span>,
    },
    {
      n: '04',
      name: 'מרחב בישראל',
      body: local ? (
        <>
          <FitImage src={local} alt={a.dimensions.spaceName} mode="natural" imgClassName="shadow-[0_14px_28px_-18px_rgb(0_0_0/0.5)]" />
          <span className="mt-2 block font-heading font-bold">{a.dimensions.spaceName}</span>
        </>
      ) : (
        <span className="block font-heading font-bold">{a.dimensions.spaceName}</span>
      ),
    },
  ];

  return (
    <section>
      <motion.div {...inView()} className="mb-10 max-w-2xl">
        <Label>04 · שיטה</Label>
        <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">איך מילה הופכת לחדר.</h2>
        <p className="mt-3 leading-relaxed text-foreground/80">
          עובדה עם מקור, אחריה תובנה, אחריה מרחב.
          <br />
          כך זה נראה בעיר שלנו: <strong>חצר</strong> בבית הערבי הישן ביפו (Jaffa) היא מילה וגם מבנה.
          <br />
          לב פתוח בתוך הבית, שהמשפחה כולה חיה סביבו.
        </p>
      </motion.div>
      <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <span aria-hidden className="absolute inset-x-0 top-[0.6rem] hidden h-px bg-border lg:block" />
        {steps.map((s, i) => (
          <motion.li key={s.n} {...inView(i * 0.1)} className="relative min-w-0">
            <span className="relative z-10 inline-block bg-background pl-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
              {s.n} · {s.name}
            </span>
            <div className="mt-4">{s.body}</div>
          </motion.li>
        ))}
      </ol>
      <Link
        to={`/article/${a.id}`}
        className="mt-8 inline-block text-sm font-bold underline underline-offset-4 transition-opacity hover:opacity-70"
      >
        לקרוא את כל המאמר על {a.concept} ←
      </Link>
    </section>
  );
};

/* 5. The museum wall: every image, the numbers, a quote and a haiku. */

const Wall: React.FC<{ articles: Article[] }> = ({ articles }) => {
  const tiles = articles.filter(a => usableImage(a.images.exterior));
  const cultures = new Set(articles.map(a => a.dimensions.origin.culture).filter(Boolean)).size;
  const countries = new Set(articles.map(a => countryCode(a.dimensions.origin)).filter(Boolean)).size;
  const needs = new Set(articles.map(a => a.dimensions.humanNeed).filter(Boolean)).size;
  const numbers: [string, number][] = [
    ['מרחבים', articles.length],
    ['תרבויות', cultures],
    ['ארצות', countries],
    ['צרכים אנושיים', needs],
  ];

  return (
    <section>
      <motion.div {...inView()} className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <Label>05 · הקיר</Label>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">כל המילים, כמקומות.</h2>
          <p className="mt-3 text-sm text-muted-foreground">כל ריבוע הוא מילה. לחיצה פותחת את המרחב שלה.</p>
        </div>
        <dl className="grid grid-cols-4 gap-6 text-right">
          {numbers.map(([label, n]) => (
            <div key={label}>
              <dt className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">{label}</dt>
              <dd className="font-heading text-3xl font-bold sm:text-4xl">{n}</dd>
            </div>
          ))}
        </dl>
      </motion.div>

      <div className="grid grid-cols-6 gap-1 sm:grid-cols-10 lg:grid-cols-[repeat(14,minmax(0,1fr))]">
        {tiles.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.012, 0.8) }}
          >
            <Link
              to={`/article/${a.id}`}
              title={`${a.concept} · ${a.dimensions.origin.literal}`}
              className="group relative block aspect-square overflow-hidden bg-muted transition-transform duration-300 hover:z-10 hover:scale-[1.6] hover:shadow-xl"
            >
              <img src={usableImage(a.images.exterior)!} alt={a.concept} loading="lazy" className="h-full w-full object-contain" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Wall text: a quote with its source, the insight, a haiku */}
      <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
        <motion.figure {...inView()}>
          <blockquote className="font-heading text-3xl font-bold leading-snug sm:text-4xl">״גבולות שפתי הם גבולות עולמי.״</blockquote>
          <figcaption className="mt-4 text-sm">
            <strong>לודוויג ויטגנשטיין</strong> <span className="text-muted-foreground">Ludwig Wittgenstein</span>
            <span className="block text-xs text-muted-foreground">
              טרקטטוס לוגיקו-פילוסופיקוס (Tractatus Logico-Philosophicus), 5.6, 1921
            </span>
          </figcaption>
          <p className="mt-8 text-lg leading-relaxed">
            <Marker>מילה שאין לה תרגום מסמנת צורך שעוד אין לו מקום.</Marker>
            <br />
            האפליקציה בונה לו את המקום.
          </p>
        </motion.figure>
        <motion.div {...inView(0.15)} className="border-r-2 border-foreground/80 pr-6">
          <Label>הייקו</Label>
          <p className="mt-3 font-heading text-2xl leading-[1.7]">
            מילה בלי תרגום
            <br />
            פותחת חלון בקיר
            <br />
            אור של ארץ אחרת
          </p>
        </motion.div>
      </div>
    </section>
  );
};

/* The whole opening, built from the library. */

const HomeIdea: React.FC<{ articles: Article[] }> = ({ articles }) => {
  const pool = useMemo(
    () =>
      shuffled(
        articles.filter(
          a =>
            usableImage(a.images.exterior) &&
            a.dimensions.origin.literal &&
            a.dimensions.origin.culture &&
            // A Hebrew reader already has these words: no wonder, no guess.
            countryCode(a.dimensions.origin) !== 'IL' &&
            !/יהוד|עבר|ישראל/.test(a.dimensions.origin.culture)
        )
      ),
    [articles]
  );
  const [index, setIndex] = useState(0);
  // The method is shown on a word whose story rests on a source and has both images.
  const example = useMemo(
    () =>
      pool.find(a => a.dimensions.origin.story && a.dimensions.origin.basis === 'wikipedia' && usableImage(a.images.interior)) ??
      pool[0],
    [pool]
  );

  if (pool.length === 0) return null;
  // The scale lens stays on the first word shown, so it does not change under
  // the reader while the opening keeps turning above.
  const lensWord = pool[0];

  return (
    <div className="container max-w-6xl space-y-28 px-4 pb-24 pt-10 sm:pt-16">
      <section className="min-h-[calc(100vh-8rem)]">
        <WordLens pool={pool} index={index} onIndex={setIndex} />
      </section>
      <GuessGame pool={pool} />
      <ScaleLens a={lensWord} />
      {example && <Method a={example} />}
      <Wall articles={articles} />
    </div>
  );
};

export default HomeIdea;
