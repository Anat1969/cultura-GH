import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/hooks/use-toast';
import { verifyKey } from '@/lib/ai';
import {
  getAnthropicKey,
  setAnthropicKey,
  getImageKey,
  setImageKey,
  getGithubToken,
  setGithubToken,
  looksLikeAnthropicKey,
  normalizeKey,
  maskKey,
} from '@/lib/settings';
import { REPO } from '@/lib/publish';

const CONSOLE_KEYS_URL = 'https://console.anthropic.com/settings/keys';

type Status = { kind: 'ok' | 'warn' | 'error'; text: string } | null;

/** Stays on screen until something changes it, unlike a toast. */
const StatusNote: React.FC<{ status: Status }> = ({ status }) => {
  if (!status) return null;
  const tone =
    status.kind === 'ok'
      ? 'border-accent/40 bg-accent/10 text-foreground'
      : status.kind === 'warn'
        ? 'border-accent/40 bg-accent/5 text-muted-foreground'
        : 'border-destructive/40 bg-destructive/10 text-foreground';
  return (
    <p className={`mt-3 rounded-md border px-3 py-2 text-sm leading-relaxed ${tone}`}>{status.text}</p>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [savedClaude, setSavedClaude] = useState(getAnthropicKey());
  const [savedImage, setSavedImage] = useState(getImageKey());
  const [savedGithub, setSavedGithub] = useState(getGithubToken());

  const [claudeInput, setClaudeInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [githubInput, setGithubInput] = useState('');

  const [claudeStatus, setClaudeStatus] = useState<Status>(null);
  const [checking, setChecking] = useState(false);

  /** Asks the API whether the key works, and says so plainly either way. */
  const check = async (key: string) => {
    setChecking(true);
    setClaudeStatus({ kind: 'warn', text: 'בודק מול Claude…' });
    try {
      const model = await verifyKey(key);
      setClaudeStatus({ kind: 'ok', text: `המפתח עובד. מוכן ליצירה עם ${model}.` });
    } catch (error) {
      setClaudeStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : 'הבדיקה נכשלה.',
      });
    } finally {
      setChecking(false);
    }
  };

  const saveClaude = async () => {
    const value = normalizeKey(claudeInput);
    if (!value) return;

    // Always save. Only the API can judge a key, and refusing to store one over
    // its shape is what traps someone in a loop back to this screen.
    if (!setAnthropicKey(value)) {
      setClaudeStatus({
        kind: 'error',
        text: 'הדפדפן לא אפשר לשמור. אם את בחלון פרטי או שחסומים נתוני אתר, המפתח לא יישמר. נסי בחלון רגיל.',
      });
      return;
    }

    setSavedClaude(value);
    setClaudeInput('');
    if (!looksLikeAnthropicKey(value)) {
      setClaudeStatus({
        kind: 'warn',
        text: 'המפתח נשמר, אך הוא לא נראה כמו מפתח של Anthropic. בודקת אותו עכשיו.',
      });
    }
    await check(value);
  };

  const clearClaude = () => {
    setAnthropicKey('');
    setSavedClaude('');
    setClaudeStatus(null);
    toast({ title: 'המפתח נמחק' });
  };

  const saveSimple = (
    value: string,
    save: (v: string) => boolean,
    setSaved: (v: string) => void,
    reset: () => void,
    label: string
  ) => {
    const v = normalizeKey(value);
    if (!v) return;
    if (!save(v)) {
      toast({
        title: 'השמירה נכשלה',
        description: 'הדפדפן חוסם שמירה מקומית. נסי בחלון רגיל, לא פרטי.',
        variant: 'destructive',
      });
      return;
    }
    setSaved(v);
    reset();
    toast({ title: `${label} נשמר` });
  };

  return (
    <div className="container max-w-2xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'בית', to: '/' }, { label: 'הגדרות' }]} />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-fluid-lg font-heading font-bold text-primary mb-3"
      >
        הגדרות
      </motion.h1>
      <p className="text-muted-foreground mb-6">
        המפתחות נשמרים בדפדפן הזה בלבד, ונשלחים רק לשירות שהם שייכים לו. הם לא נשמרים באתר ולא
        נשלחים לשום מקום אחר.
      </p>

      {/* One honest line about whether the app can actually generate right now */}
      <div
        className={`mb-10 rounded-lg border px-4 py-3 text-sm ${
          savedClaude ? 'border-accent/40 bg-accent/10' : 'border-destructive/40 bg-destructive/10'
        }`}
      >
        {savedClaude
          ? 'מפתח Claude שמור — אפשר ליצור מושגים.'
          : 'אין מפתח Claude שמור — יצירה מושבתת.'}
      </div>

      {/* Claude — required for generating concepts */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">מפתח Claude</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          נדרש כדי ליצור מושגי תרבות. פותחים את{' '}
          <a
            href={CONSOLE_KEYS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-accent"
          >
            דף המפתחות במסוף של Anthropic
          </a>
          , יוצרים מפתח חדש, מעתיקים ומדביקים כאן. רווחים ושברי שורה שנדבקים בטעות מוסרים לבד.
        </p>

        {savedClaude ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm mb-3">
              מפתח שמור:{' '}
              <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                {maskKey(savedClaude)}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => check(savedClaude)} disabled={checking}>
                {checking ? 'בודק…' : 'בדוק מפתח'}
              </Button>
              <Button variant="outline" size="sm" onClick={clearClaude}>
                החלף מפתח
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                צור מושג
              </Button>
            </div>
            <StatusNote status={claudeStatus} />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button onClick={saveClaude} disabled={!claudeInput.trim() || checking}>
                {checking ? 'בודק…' : 'שמור'}
              </Button>
              <Input
                value={claudeInput}
                onChange={e => setClaudeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveClaude()}
                type="password"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                placeholder="sk-ant-..."
                className="font-mono text-sm"
              />
            </div>
            <StatusNote status={claudeStatus} />
          </>
        )}
      </section>

      {/* fal.ai — optional, only for the two images */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">מפתח תמונות (רשות)</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Claude כותב את הפרומפטים לתמונות אבל לא מייצר תמונות. בלי מפתח כאן המאמרים ייווצרו בלי
          תמונות, והפרומפטים יישמרו להעתקה. מפתח מ-{' '}
          <a
            href="https://fal.ai/dashboard/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-accent"
          >
            fal.ai
          </a>{' '}
          מפעיל אותן.
        </p>

        {savedImage ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm mb-3">
              מפתח שמור:{' '}
              <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                {maskKey(savedImage)}
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImageKey('');
                setSavedImage('');
              }}
            >
              מחק מפתח
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!imageInput.trim()}
              onClick={() =>
                saveSimple(
                  imageInput,
                  setImageKey,
                  setSavedImage,
                  () => setImageInput(''),
                  'מפתח התמונות'
                )
              }
            >
              שמור
            </Button>
            <Input
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              type="password"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              placeholder="fal key"
              className="font-mono text-sm"
            />
          </div>
        )}
      </section>

      {/* GitHub — permanent storage for finished articles and their images */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">שמירה קבועה בגיטהב</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          בלי זה המאמרים נשמרים רק בדפדפן הזה, והתמונות שנוצרות מתארחות בקישור זמני שפג אחרי זמן
          מה. עם אסימון, כפתור "שמור בגיטהב" שבמסך המאמר שולח את המאמר לריפו{' '}
          <span dir="ltr" className="font-mono text-xs">
            {REPO}
          </span>
          , התמונות יורדות ונשמרות שם, והספרייה נטענת מהריפו בכל מכשיר.
        </p>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          יוצרים{' '}
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-accent"
          >
            Fine-grained token
          </a>{' '}
          עם גישה לריפו הזה בלבד, והרשאה אחת:{' '}
          <span dir="ltr" className="font-mono text-xs">
            Contents: Read and write
          </span>
          .
        </p>

        {savedGithub ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm mb-3">
              אסימון שמור:{' '}
              <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                {maskKey(savedGithub)}
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGithubToken('');
                setSavedGithub('');
              }}
            >
              מחק אסימון
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!githubInput.trim()}
              onClick={() =>
                saveSimple(
                  githubInput,
                  setGithubToken,
                  setSavedGithub,
                  () => setGithubInput(''),
                  'האסימון'
                )
              }
            >
              שמור
            </Button>
            <Input
              value={githubInput}
              onChange={e => setGithubInput(e.target.value)}
              type="password"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_..."
              className="font-mono text-sm"
            />
          </div>
        )}
      </section>

      <section className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed">
        <h2 className="font-bold mb-2">כדאי לדעת</h2>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>המפתחות נשמרים בדפדפן הזה. בדפדפן או במכשיר אחר צריך להדביק שוב.</li>
          <li>אם הדפדפן מוגדר לנקות נתוני אתר בסגירה, המפתח יימחק בכל פעם.</li>
          <li>כל מי שמשתמש בדפדפן הזה יכול להגיע אליהם. אל תשמרי אותם במחשב משותף.</li>
          <li>השימוש מחויב בחשבון שלך. כדאי להגדיר תקרת הוצאה במסוף של Anthropic.</li>
          <li>מה שנשמר בגיטהב שורד ניקוי כזה, ונטען מחדש בכל מכשיר.</li>
          <li>הריפו ציבורי — מה ששומרים בו גלוי לכולם.</li>
        </ul>
      </section>
    </div>
  );
};

export default SettingsPage;
