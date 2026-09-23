import React from 'react';
import { Origin, Practice, practiceLabels, interpretationLines } from '@/types/article';

// Fonts loaded in index.html so original scripts (Japanese, Arabic, Devanagari) render well.
const SCRIPT_FONTS =
  "'Playfair Display', 'Noto Serif JP', 'Noto Naskh Arabic', 'Noto Serif Devanagari', serif";

/** Linguistic layer: original script, transliteration, literal meaning, culture, region. */
export const OriginLine: React.FC<{ origin: Origin; size?: 'lg' | 'sm'; className?: string }> = ({
  origin,
  size = 'lg',
  className = '',
}) => {
  if (!origin?.script && !origin?.transliteration) return null;
  return (
    <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 ${className}`}>
      {origin.script && (
        <span
          className={`font-heading text-accent leading-none ${size === 'lg' ? 'text-5xl lg:text-6xl' : 'text-2xl'}`}
          dir="auto"
          lang="und"
          style={{ fontFamily: SCRIPT_FONTS }}
        >
          {origin.script}
        </span>
      )}
      <span className="text-sm text-muted-foreground" dir="auto">
        {[origin.transliteration, origin.literal].filter(Boolean).join(' · ')}
      </span>
      {(origin.culture || origin.region_en) && (
        <span className="text-xs tracking-wide text-muted-foreground/80">
          {origin.culture}
          {origin.region_en && (
            <span dir="ltr" className="mr-1">
              ({origin.region_en})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

/** Practice model: why / how / when / where. */
export const PracticeBlock: React.FC<{ practice: Practice; compact?: boolean; className?: string }> = ({
  practice,
  compact = false,
  className = '',
}) => {
  const keys = (Object.keys(practiceLabels) as (keyof Practice)[]).filter(k => practice?.[k]);
  if (keys.length === 0) return null;
  return (
    <dl
      className={`grid gap-x-4 gap-y-2 border-t border-border/60 pt-4 ${
        compact ? 'grid-cols-[auto_1fr] text-sm' : 'grid-cols-[auto_1fr] text-base'
      } ${className}`}
    >
      {keys.map(k => (
        <React.Fragment key={k}>
          <dt className="font-bold text-accent">{practiceLabels[k]}</dt>
          <dd className="text-foreground/85 leading-relaxed">{practice[k]}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
};

/** The bridge, as four distilled lines rather than a paragraph. */
export const InterpretationLines: React.FC<{
  value: string[] | string | undefined;
  className?: string;
  compact?: boolean;
}> = ({ value, className = '', compact = false }) => {
  const lines = interpretationLines(value);
  if (lines.length === 0) return null;
  return (
    <ul className={`space-y-2 ${className}`}>
      {lines.map((line, i) => (
        <li
          key={i}
          className={`border-r-2 border-accent/50 pr-3 leading-relaxed text-foreground/85 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          {line}
        </li>
      ))}
    </ul>
  );
};

export const ProverbLabel: React.FC = () => (
  <span className="block text-xs tracking-wide text-muted-foreground mb-1">ברוח המושג</span>
);
