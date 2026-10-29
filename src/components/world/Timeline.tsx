import React, { useMemo, useState } from 'react';
import { WorldGroup, WorldItem, yearLabel } from '@/lib/world';

// Time runs right to left, as Hebrew reads. A log scale of "years before 2100"
// gives the last centuries room while antiquity still fits on the same line.
const NOW = 2100;
const MIN_YEAR = -1500;
const TICKS = [-1000, 0, 1000, 1500, 1800, 1900, 1950, 2000];

const W = 1000;
const LABEL_W = 150;
const PAD = 24;
const ROW = 22;

const scale = (year: number) => {
  const y = Math.max(MIN_YEAR, Math.min(year, 2025));
  const t = (Math.log(NOW - y) - Math.log(NOW - 2025)) / (Math.log(NOW - MIN_YEAR) - Math.log(NOW - 2025));
  // t = 0 is today, 1 is the oldest; today sits on the left, the oldest on the right.
  return PAD + t * (W - LABEL_W - PAD * 2);
};

interface Placed {
  it: WorldItem;
  x: number;
  row: number;
}

/** Stacks the words of one lane so none covers another. */
function place(items: WorldItem[]): { placed: Placed[]; rows: number } {
  const sorted = items.filter(i => i.year !== null).sort((a, b) => a.year! - b.year!);
  const ends: number[] = [];
  const placed: Placed[] = sorted.map(it => {
    const x = scale(it.year!);
    const width = Math.max(48, it.article.concept.length * 7 + 22);
    // A label runs leftward from its dot; the next, newer word sits further
    // left, so it fits in a row only past that row's last left edge.
    let row = ends.findIndex(left => x < left - 6);
    if (row === -1) {
      row = ends.length;
      ends.push(Infinity);
    }
    ends[row] = x - width;
    return { it, x, row };
  });
  return { placed, rows: Math.max(1, ends.length) };
}

interface TimelineProps {
  groups: WorldGroup[];
  selected: string | null;
  onSelectGroup: (key: string | null) => void;
  onOpen: (item: WorldItem) => void;
}

const Timeline: React.FC<TimelineProps> = ({ groups, selected, onSelectGroup, onOpen }) => {
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const lanes = useMemo(() => {
    let y = 36;
    return groups.map(g => {
      const { placed, rows } = place(g.items);
      const lane = { g, placed, top: y, height: rows * ROW + 14 };
      y += lane.height;
      return lane;
    });
  }, [groups]);
  const last = lanes[lanes.length - 1];
  const height = (last?.top ?? 36) + (last?.height ?? 0) + 8;
  const undated = groups.reduce((n, g) => n + g.items.filter(i => i.year === null).length, 0);

  // Words within a generation of the hovered year, across every lane.
  const sameTime = hoverYear === null
    ? []
    : groups.flatMap(g => g.items).filter(i => i.year !== null && Math.abs(i.year - hoverYear) <= 40);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="h-auto w-full min-w-[720px]"
          // SVG text anchoring flips inside a right-to-left page; the drawing
          // keeps its own coordinates, and Hebrew still reads right to left.
          direction="ltr"
          role="img"
          aria-label="ציר זמן של מקורות המילים, מהעת העתיקה מימין ועד היום משמאל"
          onMouseLeave={() => setHoverYear(null)}
        >
          {TICKS.map(t => (
            <g key={t} transform={`translate(${scale(t)},0)`}>
              <line y1={24} y2={height} stroke="hsl(var(--border))" strokeDasharray="2 4" />
              <text y={16} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
                {yearLabel(t)}
              </text>
            </g>
          ))}

          {lanes.map(({ g, placed, top, height: h }) => {
            const dim = selected && selected !== g.key;
            return (
              <g key={g.key} opacity={dim ? 0.25 : 1}>
                <rect x={0} y={top} width={W} height={h} fill={g.color} fillOpacity={0.04} />
                <line x1={0} x2={W} y1={top} y2={top} stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectGroup(selected === g.key ? null : g.key)}
                >
                  <rect x={W - LABEL_W} y={top} width={LABEL_W} height={h} fill="transparent" />
                  <rect x={W - 6} y={top + 6} width={4} height={h - 12} fill={g.color} />
                  <text x={W - 14} y={top + 18} textAnchor="end" className="fill-foreground text-[12px] font-bold">
                    {g.key}
                  </text>
                  <text x={W - 14} y={top + 32} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
                    {g.items.length} מילים
                  </text>
                </g>
                {placed.map(({ it, x, row }) => {
                  const cy = top + 14 + row * ROW;
                  return (
                    <g
                      key={it.article.id}
                      transform={`translate(${x},${cy})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverYear(it.year)}
                      onClick={() => onOpen(it)}
                    >
                      <title>
                        {`${it.article.concept} · ${it.article.dimensions.origin.literal} · ${it.article.dimensions.origin.era || yearLabel(it.year!)}`}
                      </title>
                      <circle r={4.5} fill={g.color} stroke="hsl(var(--background))" />
                      <text x={-8} y={4} textAnchor="end" className="fill-foreground text-[11px]">
                        {it.article.concept}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {hoverYear !== null && (
            <line
              x1={scale(hoverYear)}
              x2={scale(hoverYear)}
              y1={24}
              y2={height}
              stroke="hsl(var(--accent))"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}
        </svg>
      </div>

      <div className="mt-3 min-h-[2.5rem] text-sm text-muted-foreground" aria-live="polite">
        {hoverYear !== null && sameTime.length > 1 ? (
          <p>
            <span className="font-bold text-accent">באותה תקופה ({yearLabel(hoverYear)}, בטווח דור): </span>
            {sameTime.map(i => i.article.concept).join(' · ')}
          </p>
        ) : (
          <p>
            מעבר מעל מילה מראה מה נולד באותה תקופה במקומות אחרים. לחיצה על שם קבוצה מדגישה אותה, לחיצה על מילה פותחת אותה.
            {undated > 0 && ` ${undated} מילים עוד בלי תאריך ולא מופיעות על הציר.`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Timeline;
