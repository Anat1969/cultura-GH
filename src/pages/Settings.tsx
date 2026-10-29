import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/hooks/use-toast';
import { checkServer } from '@/lib/ai';
import {
  getPasscode,
  setPasscode,
  normalizeKey,
  maskKey,
} from '@/lib/settings';

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

  const [savedPasscode, setSavedPasscode] = useState(getPasscode());

  const [passcodeInput, setPasscodeInput] = useState('');

  const [serverStatus, setServerStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

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
        הכתיבה רצה על Gemini החינמי, עם מפתח ששמור בשרת של Supabase ולא בדפדפן. אין צורך במפתח
        בתשלום, והאפליקציה עובדת בכל מכשיר בלי להגדיר דבר.
      </p>

      {/* The server holds the key: this is the main path */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">השרת</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          היצירה רצה דרך Edge Function בפרויקט Supabase שלך. המפתח נשמר שם כסוד בשם{' '}
          <span dir="ltr" className="font-mono text-xs">
            GEMINI_API_KEY
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

      <section className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed">
        <h2 className="font-bold mb-2">כדאי לדעת</h2>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>מפתח Gemini יושב רק בסודות של Supabase. הוא לא בדפדפן ולא בקוד האתר.</li>
          <li>בלי קוד גישה, כל מי שמגיע לאתר יכול ליצור ולנצל את המכסה החינמית המשותפת.</li>
          <li>כל שינוי נשמר מעצמו בספרייה המשותפת, בלי חיבור ובלי מפתח. אם אין רשת, הוא נשלח כשהיא חוזרת.</li>
          <li>התמונות נוצרות בשרת בחינם (Cloudflare flux), ריבועיות, ונשמרות לצמיתות.</li>
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
