import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '@/types/article';
import { LanguageProfile, ORDER_LABEL, languageOf } from '@/data/languages';
import { ARCHITAIP_URL, Civilization, civilizationOf } from '@/data/civilizations';
import { countryCode, countryOf } from '@/data/geo';
import Rich, { InsightBlock } from '@/components/Rich';

const label = 'mb-2 block font-mono text-[11px] tracking-wide text-muted-foreground';
const SCRIPT_FONTS = "'Playfair Display', 'Noto Serif JP', 'Noto Naskh Arabic', 'Noto Serif Devanagari', serif";

const worldLink = (by: string, group: string) => `/world?by=${by}&group=${encodeURIComponent(group)}`;

/**
 * From the macro to the micro and back: world, ancient civilization, cultural
 * region, language, word. Each rung opens the world page grouped at that scale.
 */
export const ZoomLadder: React.FC<{ article: Article }> = ({ article }) => {
  const o = article.dimensions.origin;
  const code = countryCode(o);
  const country = countryOf(code);
  const civ = civilizationOf(code, o.culture);
  const lang = languageOf({ ...o, country: code });
  const rungs: { name: string; value: string; to: string }[] = [
    { name: 'עולם', value: 'כל המילים', to: '/world' },
    ...(civ ? [{ name: 'שורש עתיק', value: civ.name, to: worldLink('civilization', civ.name) }] : []),
    ...(country ? [{ name: 'אזור', value: country.region, to: worldLink('region', country.region) }] : []),
    ...(lang ? [{ name: 'שפה', value: lang.he, to: worldLink('syntax', `${lang.order}: ${ORDER_LABEL[lang.order]}`) }] : []),
  ];
  return (
    <nav aria-label="מהמקרו למיקרו" className="mt-6 flex flex-wrap items-stretch gap-1 text-right">
      {rungs.map(r => (
        <Link
          key={r.name}
          to={r.to}
          className="border border-border bg-background/60 px-2.5 py-1 shadow-sm transition-all hover:-translate-y-px hover:border-accent/60 hover:shadow-md"
        >
          <span className="block font-mono text-[9px] text-muted-foreground">{r.name}</span>
          <span className="block text-xs font-bold">{r.value}</span>
        </Link>
      ))}
      <span className="border border-accent/60 bg-accent/10 px-2.5 py-1">
        <span className="block font-mono text-[9px] text-muted-foreground">מילה</span>
        <span className="block text-xs font-bold">{article.concept}</span>
      </span>
    </nav>
  );
};

/** The structure of the language, as facts with a source. */
export const LanguageCard: React.FC<{ lang: LanguageProfile }> = ({ lang }) => {
  const facts: [string, string][] = [
    ['סדר המשפט', `${lang.order} · ${ORDER_LABEL[lang.order]}${lang.orderNote ? ` (${lang.orderNote})` : ''}`],
    ['כתב', `${lang.script} · ${lang.letters}`],
    ['בניית מילה', lang.build],
    ['מין דקדוקי', lang.gender],
    ['פנייה', lang.politeness],
    ...(lang.context ? ([['תקשורת (Hall)', `הקשר ${lang.context}`]] as [string, string][]) : []),
  ];
  return (
    <div className="border border-border bg-card/60 p-4">
      <span className={label}>השפה: {lang.he} ({lang.en})</span>
      <Rich text={`**${lang.trait}**`} className="mb-3 text-sm leading-relaxed" />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        {facts.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="font-mono text-muted-foreground">{k}</dt>
            <dd className="text-foreground/85">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">WALS Online, 2013 · אלפבית רשמי · Hall, 1976</p>
    </div>
  );
};

/** The ancient civilization the word grows from, with its five spatial vectors. */
export const CivilizationCard: React.FC<{ civ: Civilization }> = ({ civ }) => {
  const vectors: [string, string][] = [
    ['חומר', civ.vectors.material],
    ['אור', civ.vectors.light],
    ['סף', civ.vectors.threshold],
    ['פרופורציה', civ.vectors.proportion],
    ['נרטיב', civ.vectors.narrative],
  ];
  return (
    <div className="border border-border bg-card/60 p-4" style={{ borderInlineStartWidth: 4, borderInlineStartColor: civ.color }}>
      <span className={label}>השורש העתיק · מתוך ARCHITAIP</span>
      <p className="font-heading text-xl font-bold">{civ.name}</p>
      <p className="text-sm">
        <strong>{civ.archetype}</strong>
        <span className="text-muted-foreground"> · הכאוס: {civ.chaos} · הסדר: {civ.order}</span>
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        {vectors.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="font-mono text-muted-foreground">{k}</dt>
            <dd className="text-foreground/85">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      <a
        href={`${ARCHITAIP_URL}/c/${civ.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block border border-border px-3 py-1.5 text-xs font-bold shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
      >
        לפתוח את {civ.name} ב-ARCHITAIP
      </a>
    </div>
  );
};

/** The word, the language and the root: from the smallest part outward. */
export const WordAndLanguage: React.FC<{ article: Article }> = ({ article }) => {
  const o = article.dimensions.origin;
  const a = o.lang;
  const code = countryCode(o);
  const lang = languageOf({ ...o, country: code });
  const civ = civilizationOf(code, o.culture);
  if (!a?.insight && !lang && !civ) return null;

  return (
    <section className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-accent">המילה ושפתה</h2>

      {a?.insight && <InsightBlock insight={a.insight} explanation={a.explanation} />}

      {a?.parts?.length ? (
        <div>
          <span className={label}>האנטומיה של המילה</span>
          <div className="flex flex-wrap items-stretch gap-2">
            {a.parts.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="self-center text-muted-foreground">+</span>}
                <div className="min-w-[5rem] border border-border bg-background/60 px-3 py-2 text-center shadow-sm">
                  <span className="block text-2xl leading-tight text-accent" dir="auto" style={{ fontFamily: SCRIPT_FONTS }}>
                    {p.part}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{p.meaning}</span>
                </div>
              </React.Fragment>
            ))}
            <span className="self-center text-muted-foreground">=</span>
            <div className="border border-accent/60 bg-accent/10 px-3 py-2 text-center">
              <span className="block text-2xl leading-tight" dir="auto" style={{ fontFamily: SCRIPT_FONTS }}>{o.script || article.concept}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{o.literal}</span>
            </div>
          </div>
          {a.root && <p className="mt-2 text-sm"><span className="font-mono text-xs text-muted-foreground">שורש · </span>{a.root}</p>}
        </div>
      ) : null}

      {a?.family?.length ? (
        <div>
          <span className={label}>משפחת המילים, באותה שפה</span>
          <ul className="flex flex-wrap gap-1.5">
            {a.family.map(f => {
              // The model now and then writes the Hebrew gloss where the original belongs.
              const own = /[\u0590-\u05FF]/.test(f.word) && o.lang?.code !== 'he' ? f.transliteration : f.word;
              return (
              <li key={f.word + f.transliteration} className="border border-border bg-background/60 px-2 py-1">
                <span className="text-sm" dir="auto" style={{ fontFamily: SCRIPT_FONTS }}>{own}</span>
                {f.transliteration && f.transliteration !== own && (
                  <span className="mr-1 text-[11px] text-muted-foreground" dir="ltr">{f.transliteration}</span>
                )}
                <span className="block text-[11px] text-foreground/75">{f.meaning}</span>
              </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {(a?.richness || a?.untranslatable) && (
        <div className="space-y-1 text-sm leading-relaxed">
          {a.untranslatable && <p><span className="font-mono text-xs text-muted-foreground">מה חסר בעברית · </span>{a.untranslatable}</p>}
          {a.richness && <p><span className="font-mono text-xs text-muted-foreground">עושר המילים · </span>{a.richness}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lang && <LanguageCard lang={lang} />}
        {civ && <CivilizationCard civ={civ} />}
      </div>

      {a?.insight && (
        <p className="font-mono text-[11px] text-muted-foreground">
          {a.basis === 'wiktionary' && a.source ? (
            <>
              החלקים והשורש על פי{' '}
              <a href={a.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                ויקימילון
              </a>
              . התובנה, המשפחה והעושר הם פרשנות.
            </>
          ) : (
            'ניתוח מודל, לא אומת במקור חיצוני.'
          )}
        </p>
      )}
    </section>
  );
};
