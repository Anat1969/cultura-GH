import React from 'react';
import { Article, Origin } from '@/types/article';
import { countryCode, countryOf } from '@/data/geo';

/** A small flag for where the word comes from. Quiet: it identifies, it does not decorate. */
export const Flag: React.FC<{ article?: Article; origin?: Origin; code?: string; className?: string }> = ({
  article,
  origin,
  code,
  className = '',
}) => {
  const c = code ?? countryCode(origin ?? article?.dimensions.origin ?? {});
  if (!c) return null;
  const name = countryOf(c)?.he ?? c;
  return (
    <img
      src={`https://flagcdn.com/${c.toLowerCase()}.svg`}
      alt={name}
      title={name}
      loading="lazy"
      width={16}
      height={12}
      className={`inline-block h-3 w-4 shrink-0 object-cover opacity-90 shadow-[0_0_0_1px_hsl(var(--border))] ${className}`}
    />
  );
};

/** The word's short meaning, right under it, so it is understood at first sight. */
export const Gloss: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
  <p className={`text-[11px] leading-snug text-foreground/70 ${className}`}>{text}</p>
);

const yearLabel = (year: number) => (year < 0 ? `${Math.abs(year)} לפנה״ס` : String(year));

/** Where the word comes from: time, place, figure, story, and on what it rests. */
export const OriginStory: React.FC<{ origin: Origin; className?: string }> = ({ origin, className = '' }) => {
  if (!origin.story && !origin.era && !origin.place) return null;
  const facts: [string, string][] = [
    ['זמן', [origin.era, typeof origin.year === 'number' ? `(${yearLabel(origin.year)})` : ''].filter(Boolean).join(' ')],
    ['מקום', origin.place ?? ''],
    ['דמות', origin.figure ?? ''],
    ['מסורת', origin.tradition ?? ''],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <section className={className}>
      <h2 className="mb-4 font-heading text-lg font-bold text-accent">מקור המילה</h2>
      {origin.story && <p className="mb-4 text-base leading-[1.9] text-foreground/85">{origin.story}</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-sm">
        {facts.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="font-bold text-accent">{k}</dt>
            <dd className="text-foreground/85">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {origin.basis === 'wikipedia' && origin.source ? (
          <>
            על פי{' '}
            <a href={origin.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
              ויקיפדיה
            </a>
          </>
        ) : (
          <>
            הערכת מודל, לא אומתה במקור חיצוני
            {origin.source && (
              <>
                {' · '}
                <a href={origin.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  ערך קרוב בוויקיפדיה
                </a>
              </>
            )}
          </>
        )}
      </p>
    </section>
  );
};
