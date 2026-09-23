import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Article, Frame, MediaKind, frameLabels } from '@/types/article';
import { uploadMedia, isVideo } from '@/lib/media';

/** Copies the prompt, and says so on the button itself rather than in a toast. */
export const CopyPrompt: React.FC<{ text: string; label?: string }> = ({
  text,
  label = 'העתק פרומפט',
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'ההעתקה נחסמה',
        description: 'סמני את הטקסט והעתיקי ידנית.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button size="sm" variant={copied ? 'default' : 'outline'} onClick={copy}>
      {copied ? 'הועתק' : label}
    </Button>
  );
};

interface SlotProps {
  url: string | null;
  kind: MediaKind;
  onPick: (file: File) => Promise<void>;
  busy: boolean;
}

/** One frame: shows what is in it, or an invitation to fill it. */
const Slot: React.FC<SlotProps> = ({ url, kind, onPick, busy }) => {
  const input = useRef<HTMLInputElement>(null);
  const title = kind === 'video' ? 'סרטון' : 'תמונה';

  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
        {url ? (
          kind === 'video' || isVideo(url) ? (
            <video
              src={url}
              controls
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={url} alt={title} className="h-full w-full object-cover" />
          )
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-accent disabled:opacity-60"
          >
            <span className="text-2xl leading-none">+</span>
            <span>{busy ? 'מעלה…' : `העלה ${title}`}</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="flex gap-1">
          {url && (
            <Button size="sm" variant="ghost" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                פתח
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? 'מעלה…' : url ? 'החלף' : 'העלה'}
          </Button>
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept={kind === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void onPick(file);
        }}
      />
    </div>
  );
};

interface PromptStudioProps {
  article: Article;
  frame: Frame;
  onChange: (next: Article) => void;
}

/**
 * One prompt with its two frames. The prompt is there to be taken elsewhere and
 * rendered, so it carries a copy button; what comes back is uploaded into the
 * frames and kept for good, rather than living on a link that expires.
 */
const PromptStudio: React.FC<PromptStudioProps> = ({ article, frame, onChange }) => {
  const [busy, setBusy] = useState<MediaKind | null>(null);
  const { toast } = useToast();

  const prompt = article.dimensions.imagePrompts[frame];

  const pick = async (kind: MediaKind, file: File) => {
    setBusy(kind);
    try {
      const url = await uploadMedia(file, article.id, frame, kind);
      const key = kind === 'video' ? 'videos' : 'images';
      onChange({ ...article, [key]: { ...article[key], [frame]: url } });
      toast({ title: kind === 'video' ? 'הסרטון נשמר' : 'התמונה נשמרה' });
    } catch (error) {
      toast({
        title: 'ההעלאה נכשלה',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading font-bold text-accent">{frameLabels[frame]}</h3>
        <CopyPrompt text={prompt} />
      </div>

      <p dir="ltr" className="mb-4 select-all rounded bg-muted p-2 font-mono text-xs leading-relaxed">
        {prompt}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Slot
          url={article.images[frame]}
          kind="image"
          busy={busy === 'image'}
          onPick={file => pick('image', file)}
        />
        <Slot
          url={article.videos[frame]}
          kind="video"
          busy={busy === 'video'}
          onPick={file => pick('video', file)}
        />
      </div>
    </section>
  );
};

export default PromptStudio;
