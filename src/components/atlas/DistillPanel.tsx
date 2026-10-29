import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CopyPrompt } from '@/components/PromptStudio';
import { AtlasEntry, AtlasKind, Visual, loadEntry, saveEntry, uploadAtlasImage } from '@/lib/atlas';

interface Props<T extends { visual: Visual }> {
  kind: AtlasKind;
  entryKey: string;
  title: string;
  /** Says what the distillation will read, before anyone presses the button. */
  basis: string;
  run: () => Promise<T>;
  render: (data: T) => React.ReactNode;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * A distillation that is kept: the model's tables and insights, the
 * illustration prompt, an image the user pastes, and free notes. Everything is
 * stored in culture_atlas as soon as it exists, and reloads on the next visit.
 */
function DistillPanel<T extends { visual: Visual }>({ kind, entryKey, title, basis, run, render }: Props<T>) {
  const [entry, setEntry] = useState<AtlasEntry<T> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>();
  // The note is saved after a pause; by then an image may have arrived, so the
  // timer saves the latest entry rather than the one it was started with.
  const latest = useRef<AtlasEntry<T> | null>(null);
  latest.current = entry;

  useEffect(() => {
    let alive = true;
    setEntry(null);
    setError(null);
    setLoadError(null);
    loadEntry<T>(kind, entryKey)
      .then(e => alive && setEntry(e))
      .catch(e => alive && setLoadError(e instanceof Error ? e.message : 'הטעינה נכשלה.'));
    return () => {
      alive = false;
    };
  }, [kind, entryKey]);

  const persist = useCallback(async (next: AtlasEntry<T>) => {
    setEntry(next);
    setSaveState('saving');
    try {
      await saveEntry(next);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  const distill = async () => {
    if (!entry) return;
    setBusy(true);
    setError(null);
    setElapsed(0);
    const tick = setInterval(() => setElapsed(s => s + 1), 1000);
    try {
      const data = await run();
      await persist({ ...entry, data });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הזיקוק נכשל.');
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
  };

  const setImage = async (file: File) => {
    if (!entry) return;
    setImageBusy(true);
    setImageError(null);
    try {
      const url = await uploadAtlasImage(file, kind);
      await persist({ ...entry, image_url: url });
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'ההעלאה נכשלה.');
    } finally {
      setImageBusy(false);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const file = [...e.clipboardData.files].find(f => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      void setImage(file);
      return;
    }
    const text = e.clipboardData.getData('text').trim();
    if (/^https?:\/\/\S+$/.test(text) && entry) {
      e.preventDefault();
      void persist({ ...entry, image_url: text });
    }
  };

  const onNotes = (notes: string) => {
    if (!entry) return;
    const next = { ...entry, notes };
    setEntry(next);
    setSaveState('saving');
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => latest.current && void persist(latest.current), 800);
  };

  if (loadError) {
    return <p className="border border-destructive/40 bg-destructive/10 p-4 text-sm">{loadError}</p>;
  }
  if (!entry) {
    return <p className="p-4 text-sm text-muted-foreground">טוען את מה שנשמר…</p>;
  }

  const data = entry.data && Object.keys(entry.data as object).length ? entry.data : null;

  return (
    <section className="space-y-6 border border-border bg-card/70 p-5 shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.5)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-bold text-primary">{title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{basis}</p>
        </div>
        <div className="flex items-center gap-3">
          {saveState !== 'idle' && (
            <span className={`text-xs ${saveState === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} aria-live="polite">
              {saveState === 'saving' ? 'שומר…' : saveState === 'saved' ? 'נשמר' : 'השמירה נכשלה'}
            </span>
          )}
          <Button onClick={distill} disabled={busy}>
            {busy ? `מזקק… ${elapsed} שנ'` : data ? 'זקק מחדש' : 'זקק תובנות'}
          </Button>
        </div>
      </header>

      {error && (
        <p className="border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error} אפשר ללחוץ שוב על הכפתור.
        </p>
      )}

      {!data && !busy && !error && (
        <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
          עדיין לא זוקק. הלחיצה שולחת ל-Gemini את המושגים שבטבלה, ומחזירה טבלת השוואה, תובנות ופרומפט להמחשה. הכול
          נשמר כאן לביקור הבא.
        </p>
      )}

      {data && (
        <>
          {render(data)}

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3 border border-border bg-background/60 p-4">
              <h4 className="text-sm font-bold text-accent">המחשה</h4>
              <p className="text-sm leading-relaxed">{data.visual.distill}</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap bg-muted/60 p-3 font-body text-sm leading-relaxed" dir="auto">
                {data.visual.prompt}
              </pre>
              <CopyPrompt text={data.visual.prompt} label="העתק פרומפט למידג'רני" />
            </div>

            <div
              className="min-w-0 space-y-3 border border-border bg-background/60 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onPaste={onPaste}
              tabIndex={0}
              aria-label="אזור התמונה: אפשר להדביק כאן תמונה או קישור"
            >
              <h4 className="text-sm font-bold text-accent">התמונה</h4>
              {entry.image_url ? (
                // Shown in its own proportions, never cropped to a square.
                <img src={entry.image_url} alt={data.visual.distill} className="block h-auto w-full border border-border" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {imageBusy ? 'מעלה…' : 'לחצי כאן והדביקי תמונה (Ctrl+V), או קישור לתמונה. אפשר גם לבחור קובץ.'}
                </div>
              )}
              {imageError && <p className="text-xs text-destructive">{imageError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} disabled={imageBusy}>
                  בחירת קובץ
                </Button>
                {entry.image_url && (
                  <Button size="sm" variant="ghost" onClick={() => void persist({ ...entry, image_url: null })}>
                    הסר תמונה
                  </Button>
                )}
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) void setImage(f);
                    e.target.value = '';
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!/^https?:\/\//.test(urlInput.trim())}
                  onClick={() => {
                    void persist({ ...entry, image_url: urlInput.trim() });
                    setUrlInput('');
                  }}
                >
                  שמור קישור
                </Button>
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://… קישור לתמונה"
                  dir="ltr"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <label htmlFor={`notes-${entry.id}`} className="text-sm font-bold text-accent">
          הערות שלי
        </label>
        <Textarea
          id={`notes-${entry.id}`}
          value={entry.notes}
          onChange={e => onNotes(e.target.value)}
          placeholder="מחשבות, החלטות תכנון, מקורות לבדיקה. נשמר אוטומטית."
          className="min-h-[100px] text-right"
          dir="rtl"
        />
      </div>
    </section>
  );
}

export default DistillPanel;
