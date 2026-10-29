import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Column<T> {
  key: string;
  label: string;
  /** Plain text: used for sorting, filtering and copying. */
  text: (row: T) => string;
  /** Optional richer cell; falls back to text. */
  render?: (row: T) => React.ReactNode;
  /** Hidden until the user turns it on. */
  hidden?: boolean;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowHint?: string;
  empty?: string;
}

/**
 * The one table of the atlas. Every table here sorts by any column, filters by
 * free text, hides and shows columns, and copies as tab-separated text that
 * pastes straight into a spreadsheet or a document as a table.
 */
function DataTable<T>({ columns, rows, rowKey, onRowClick, rowHint, empty = 'אין שורות להצגה.' }: Props<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [filter, setFilter] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter(c => c.hidden).map(c => c.key)));
  const [copied, setCopied] = useState(false);

  const visible = columns.filter(c => !hidden.has(c.key));

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    let list = q ? rows.filter(r => columns.some(c => c.text(r).toLowerCase().includes(q))) : rows;
    if (sort) {
      const col = columns.find(c => c.key === sort.key);
      if (col) {
        list = [...list].sort(
          (a, b) => col.text(a).localeCompare(col.text(b), 'he', { numeric: true }) * sort.dir
        );
      }
    }
    return list;
  }, [rows, columns, filter, sort]);

  const toggleSort = (key: string) =>
    setSort(s => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  const toggleColumn = (key: string) =>
    setHidden(h => {
      const next = new Set(h);
      if (next.has(key)) next.delete(key);
      else if (visible.length > 1) next.add(key);
      return next;
    });

  const copy = async () => {
    const clean = (v: string) => v.replace(/\s+/g, ' ').trim();
    const tsv = [visible.map(c => c.label), ...shown.map(r => visible.map(c => clean(c.text(r))))]
      .map(line => line.join('\t'))
      .join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="סינון חופשי בכל העמודות"
          className="h-9 max-w-xs text-right text-sm"
          dir="rtl"
        />
        <Button size="sm" variant={copied ? 'default' : 'outline'} onClick={copy} title="הטבלה מועתקת כטקסט עם טאבים, ונדבקת כטבלה בגיליון או במסמך">
          {copied ? 'הועתק' : 'העתק טבלה'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {shown.length} מתוך {rows.length} שורות{rowHint ? ` · ${rowHint}` : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="עמודות להצגה">
        <span className="ml-1 text-xs text-muted-foreground">עמודות:</span>
        {columns.map(c => {
          const on = !hidden.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => toggleColumn(c.key)}
              aria-pressed={on}
              className={`border px-2 py-0.5 text-xs shadow-sm transition-all hover:-translate-y-px active:translate-y-0 ${
                on ? 'border-accent/60 bg-accent/15 text-foreground' : 'border-border text-muted-foreground line-through'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto border border-border bg-card/60 shadow-[0_10px_30px_-18px_hsl(var(--foreground)/0.4)]">
        <table className="w-full min-w-[640px] border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {visible.map(c => (
                <th key={c.key} scope="col" className="p-0 font-bold">
                  <button
                    onClick={() => toggleSort(c.key)}
                    className="w-full px-3 py-2 text-right transition-colors hover:bg-muted hover:text-accent"
                    title="מיון לפי העמודה. לחיצה נוספת הופכת את הסדר, ושלישית מבטלת."
                  >
                    {c.label}
                    {sort?.key === c.key && <span className="mr-1 text-accent">{sort.dir === 1 ? '↓' : '↑'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={visible.length} className="px-3 py-6 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : (
              shown.map(r => (
                <tr
                  key={rowKey(r)}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={`border-b border-border/60 align-top last:border-0 ${
                    onRowClick ? 'cursor-pointer transition-colors hover:bg-accent/10' : ''
                  }`}
                >
                  {visible.map(c => (
                    <td key={c.key} className={`px-3 py-2 leading-relaxed ${c.className ?? ''}`}>
                      {c.render ? c.render(r) : c.text(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
