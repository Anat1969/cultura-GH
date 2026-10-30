import React from 'react';

/**
 * Anat's text standard (Claude-GH docs/ai-text-standard.md): **word** is bold,
 * ==insight== is the highlighter, numbers are bold on their own, and every
 * sentence starts on a new line. The emphasis is written once, in the data.
 */
function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|==(.+?)==|(\d[\d,.\-–]*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={m.index} className="font-bold text-foreground">{m[1]}</strong>);
    else if (m[2]) out.push(<mark key={m.index} className="bg-[hsl(48_96%_60%/0.35)] px-0.5 text-foreground">{m[2]}</mark>);
    else out.push(<strong key={m.index} className="font-bold">{m[3]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Splits after a sentence end, keeping numbers like 3.5 whole. */
const sentences = (text: string) => text.split(/(?<=[.!?])\s+(?=\S)/).filter(Boolean);

const Rich: React.FC<{ text: string; className?: string; as?: 'p' | 'span' }> = ({ text, className = '', as = 'p' }) => {
  if (!text) return null;
  if (as === 'span') return <span className={className}>{inline(text)}</span>;
  return (
    <div className={className}>
      {sentences(text).map((s, i) => (
        <p key={i}>{inline(s)}</p>
      ))}
    </div>
  );
};

/** The two-level block: an insight line up to 8 words, then one sentence that explains it. */
export const InsightBlock: React.FC<{ insight: string; explanation?: string; className?: string }> = ({
  insight,
  explanation,
  className = '',
}) => (
  <div className={className}>
    <Rich text={insight} className="font-heading text-lg font-bold leading-snug text-primary" />
    {explanation && <Rich text={explanation} className="mt-1 text-sm leading-relaxed text-foreground/80" />}
  </div>
);

export default Rich;
