import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/hooks/use-toast';
import { checkServer, verifyKey } from '@/lib/ai';
import {
  getAnthropicKey,
  setAnthropicKey,
  getImageKey,
  setImageKey,
  getGithubToken,
  setGithubToken,
  getPasscode,
  setPasscode,
  normalizeKey,
  maskKey,
} from '@/lib/settings';
import { REPO } from '@/lib/publish';

const SECRETS_URL = 'https://supabase.com/dashboard/project/ktqmwpbzcnzkhjskqisy/settings/functions';

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
  const [savedPasscode, setSavedPasscode] = useState(getPasscode());

  const [claudeInput, setClaudeInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');

  const [serverStatus, setServerStatus] = useState<Status>(null);
  const [claudeStatus, setClaudeStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const testServer = async () => {
    setBusy(true);
    setServerStatus({ kind: 'warn', text: 'בודק את השרת…' });
    try {
      setServerStatus({ kind: 'ok', text: await checkServer() });
    } catch (error) {
      setServerStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : 'הבדיקה נכשלה.',
      });
    } finally {
      setBusy(false);
    }
  };

  const saveClaude = async () => {
    const value = normalizeKey(claudeInput);
    if (!value) return;
    if (!setAnthropicKey(value)) {
      setClaudeStatus({
        kind: 'error',
        text: 'הדפדפן לא אפשר לשמור. בחלון פרטי או כשחסומים נתוני אתר המפתח לא יישמר.',
      });
      return;
    }
    setSavedClaude(value);
    setClaudeInput('');
    setBusy(true);
    setClaudeStatus({ kind: 'warn', text: 'בודק מול Claude…' });
    try {
      const model = await verifyKey(value);
      setClaudeStatus({ kind: 'ok', text: `המפתח עובד (${model}).` });
    } catch (error) {
      setClaudeStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : 'הבדיקה נכשלה.',
      });
    } finally {
      setBusy(false);
    }
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
      <p className="text-muted-foreground mb-10">
        מפתח Claude שמור בשרת של Supabase, לא בדפדפן. הוא לא מגיע לכאן ולא נמצא בקוד האתר, ולכן
        האפליקציה עובדת בכל מכשיר בלי להגדיר דבר.
      </p>

      {/* The server holds the key: this is the main path */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">השרת</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          היצירה רצה דרך Edge Function בפרויקט Supabase שלך. המפתח נשמר שם כסוד בשם{' '}
          <span dir="ltr" className="font-mono text-xs">
            ANTHROPIC_API_KEY
          </span>
          . להוספה או להחלפה:{' '}
          <a
            href={SECRETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-accent"
          >
            עמוד הסודות של Edge Functions
          </a>
          . לתמונות אפשר להוסיף שם גם{' '}
          <span dir="ltr" className="font-mono text-xs">
            FAL_API_KEY
          </span>
          .
        </p>
        <Button onClick={testServer} disabled={busy}>
          {busy ? 'בודק…' : 'בדוק חיבור לשרת'}
        </Button>
        <StatusNote status={serverStatus} />
      </section>

      {/* Passcode — the only real brake on a public endpoint */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">קוד גישה</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          האתר ציבורי, ולכן כל מי שמוצא אותו יכול ליצור מושגים על חשבון המפתח שבשרת. אם תגדירי סוד
          בשם{' '}
          <span dir="ltr" className="font-mono text-xs">
            APP_PASSCODE
          </span>{' '}
          באותו עמוד סודות, היצירה תדרוש את הקוד — והוא נשמר כאן בדפדפן שלך.
        </p>

        {savedPasscode ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm mb-3">קוד שמור בדפדפן הזה.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPasscode('');
                setSavedPasscode('');
              }}
            >
              מחק קוד
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!passcodeInput.trim()}
              onClick={() =>
                saveSimple(
                  passcodeInput,
                  setPasscode,
                  setSavedPasscode,
                  () => setPasscodeInput(''),
                  'הקוד'
                )
              }
            >
              שמור
            </Button>
            <Input
              value={passcodeInput}
              onChange={e => setPasscodeInput(e.target.value)}
              type="password"
              autoComplete="off"
              placeholder="קוד הגישה"
            />
          </div>
        )}
      </section>

      {/* GitHub — permanent storage for finished articles and their images */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">שמירה קבועה בגיטהב</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          מאמרים נשמרים אוטומטית בטבלה ב-Supabase. כפתור "שמור בגיטהב" שבמסך המאמר מוסיף עליו שכבה
          שנייה: המאמר והתמונות נכנסים לריפו{' '}
          <span dir="ltr" className="font-mono text-xs">
            {REPO}
          </span>
          , והתמונות מפסיקות להיות תלויות בקישור זמני. צריך{' '}
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-accent"
          >
            Fine-grained token
          </a>{' '}
          עם{' '}
          <span dir="ltr" className="font-mono text-xs">
            Contents: Read and write
          </span>{' '}
          לריפו הזה בלבד.
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

      {/* Personal keys in this browser — only for someone who wants their own */}
      <section className="mb-12">
        <button
          onClick={() => setShowOverride(v => !v)}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-accent"
        >
          {showOverride ? 'הסתר' : 'מפתחות אישיים בדפדפן הזה (לא נדרש)'}
        </button>

        {showOverride && (
          <div className="mt-4 space-y-6 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              רק אם תרצי לחייב את החשבון שלך במקום את המפתח שבשרת. משמש כגיבוי אם המפתח בשרת לא
              מוגדר.
            </p>

            <div>
              <h3 className="text-sm font-bold text-accent mb-2">מפתח Claude</h3>
              {savedClaude ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                    {maskKey(savedClaude)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAnthropicKey('');
                      setSavedClaude('');
                      setClaudeStatus(null);
                    }}
                  >
                    מחק
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={saveClaude} disabled={!claudeInput.trim() || busy}>
                    שמור
                  </Button>
                  <Input
                    value={claudeInput}
                    onChange={e => setClaudeInput(e.target.value)}
                    type="password"
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="sk-ant-..."
                    className="font-mono text-sm"
                  />
                </div>
              )}
              <StatusNote status={claudeStatus} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-accent mb-2">מפתח תמונות</h3>
              {savedImage ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                    {maskKey(savedImage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageKey('');
                      setSavedImage('');
                    }}
                  >
                    מחק
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
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed">
        <h2 className="font-bold mb-2">כדאי לדעת</h2>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>מפתח Claude יושב רק בסודות של Supabase. הוא לא בדפדפן ולא בקוד האתר.</li>
          <li>בלי קוד גישה, כל מי שמגיע לאתר יכול ליצור על חשבונך. כדאי גם תקרת הוצאה במסוף.</li>
          <li>הספרייה משותפת: מה שנוצר במכשיר אחד מופיע בשני.</li>
          <li>הריפו והטבלה ציבוריים — מה שנשמר בהם גלוי לכולם.</li>
          <li>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              חזרה ליצירה
            </Button>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default SettingsPage;
