import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/hooks/use-toast';
import {
  getAnthropicKey,
  setAnthropicKey,
  getImageKey,
  setImageKey,
  looksLikeAnthropicKey,
  maskKey,
} from '@/lib/settings';

const CONSOLE_KEYS_URL = 'https://console.anthropic.com/settings/keys';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [savedClaude, setSavedClaude] = useState(getAnthropicKey());
  const [savedImage, setSavedImage] = useState(getImageKey());
  const [claudeInput, setClaudeInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  const saveClaude = () => {
    const value = claudeInput.trim();
    if (!value) return;
    if (!looksLikeAnthropicKey(value)) {
      toast({
        title: 'המפתח לא נראה תקין',
        description: 'מפתח של Anthropic מתחיל ב-sk-ant- . בדוק שהעתקת אותו במלואו.',
        variant: 'destructive',
      });
      return;
    }
    setAnthropicKey(value);
    setSavedClaude(value);
    setClaudeInput('');
    toast({ title: 'המפתח נשמר בדפדפן הזה' });
  };

  const clearClaude = () => {
    setAnthropicKey('');
    setSavedClaude('');
    toast({ title: 'המפתח נמחק' });
  };

  const saveImage = () => {
    const value = imageInput.trim();
    if (!value) return;
    setImageKey(value);
    setSavedImage(value);
    setImageInput('');
    toast({ title: 'מפתח התמונות נשמר' });
  };

  const clearImage = () => {
    setImageKey('');
    setSavedImage('');
    toast({ title: 'מפתח התמונות נמחק' });
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
        המפתחות נשמרים בדפדפן הזה בלבד, ונשלחים רק לשירות שהם שייכים לו. הם לא נשמרים באתר ולא
        נשלחים לשום מקום אחר.
      </p>

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
          </a>{' '}
          , יוצרים מפתח חדש, מעתיקים ומדביקים כאן. מפתח נראה כך:{' '}
          <span dir="ltr" className="font-mono text-xs">
            sk-ant-...
          </span>
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
              <Button variant="outline" size="sm" onClick={clearClaude}>
                מחק מפתח
              </Button>
              <Button size="sm" onClick={() => navigate('/')}>
                צור מושג
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={saveClaude} disabled={!claudeInput.trim()}>
              שמור
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
        )}
      </section>

      {/* fal.ai — optional, only for the two images */}
      <section className="mb-12">
        <h2 className="text-lg font-heading font-bold text-accent mb-2">מפתח תמונות (רשות)</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Claude כותב את הפרומפטים לתמונות אבל לא מייצר תמונות. בלי מפתח כאן המאמרים ייווצרו
          בלי תמונות, והפרומפטים יישמרו להעתקה. מפתח מ-{' '}
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
            <Button variant="outline" size="sm" onClick={clearImage}>
              מחק מפתח
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={saveImage} disabled={!imageInput.trim()} variant="outline">
              שמור
            </Button>
            <Input
              value={imageInput}
              onChange={e => setImageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveImage()}
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

      <section className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed">
        <h2 className="font-bold mb-2">כדאי לדעת</h2>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>המפתח נשמר בדפדפן הזה. בדפדפן או במכשיר אחר צריך להדביק אותו שוב.</li>
          <li>כל מי שמשתמש בדפדפן הזה יכול להגיע אליו. אל תשמור אותו במחשב משותף.</li>
          <li>השימוש מחויב בחשבון שלך. כדאי להגדיר תקרת הוצאה במסוף של Anthropic.</li>
          <li>ניקוי נתוני האתר בדפדפן ימחק את המפתח, ואיתו גם את הספרייה המקומית.</li>
        </ul>
      </section>
    </div>
  );
};

export default SettingsPage;
