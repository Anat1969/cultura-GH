import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getArticles, findArticleByConcept } from '@/lib/storage';
import ArticleCard from '@/components/ArticleCard';
import { cultureGroups, comparisonQuestions, ConceptSuggestion } from '@/data/cultures';

const examples: ConceptSuggestion[] = [
  { label: 'היגה', hint: 'Hygge, Denmark' },
  { label: 'מא', hint: 'Ma (間), Japan' },
  { label: 'אובונטו', hint: 'Ubuntu, Nguni languages, Southern Africa' },
];

const HomePage: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [openPanel, setOpenPanel] = useState<'compare' | 'cultures' | null>(null);
  const navigate = useNavigate();
  const articles = getArticles();
  const recentArticles = articles.slice(0, 3);

  const go = useCallback(
    (c: string, hint?: string) => {
      const concept = c.trim();
      if (!concept) return;
      // Already written: open it. Writing it again would cost money, take a
      // minute, and leave two versions of the same concept in the library.
      const existing = findArticleByConcept(concept);
      if (existing) {
        navigate(`/article/${existing.id}`);
        return;
      }
      navigate('/generate', { state: { concept, hint } });
    },
    [navigate]
  );

  const chip = (s: ConceptSuggestion) => (
    <Button key={s.label} variant="outline" size="sm" onClick={() => go(s.label, s.hint)}>
      {s.label}
    </Button>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto w-full"
        >
          <h1 className="text-fluid-xl font-heading font-bold text-primary mb-4 leading-tight">
            תרבות הופכת
            <br />
            <span className="text-accent">למרחב</span>
          </h1>
          <p className="text-fluid-md text-muted-foreground mb-10">
            הזן מושג תרבותי וצפה בו מתגלגל למרחב מחייה
          </p>

          <div className="flex gap-3 max-w-lg mx-auto mb-6">
            <Button
              onClick={() => go(concept)}
              disabled={!concept.trim()}
              size="lg"
              className="font-bold text-lg px-8"
            >
              צור מרחב
            </Button>
            <Input
              value={concept}
              onChange={e => setConcept(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && go(concept)}
              placeholder="הזן מושג תרבותי..."
              className="text-lg h-12 text-right"
              dir="rtl"
            />
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <span className="text-sm text-muted-foreground ml-2">לדוגמה:</span>
            {examples.map(chip)}
          </div>

          {/* What to ask: comparison questions and culture groups */}
          <div className="flex gap-2 justify-center mt-8">
            <Button
              variant={openPanel === 'compare' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOpenPanel(openPanel === 'compare' ? null : 'compare')}
            >
              שאלות להשוואה
            </Button>
            <Button
              variant={openPanel === 'cultures' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOpenPanel(openPanel === 'cultures' ? null : 'cultures')}
            >
              קבוצות תרבות
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {openPanel === 'compare' && (
              <motion.div
                key="compare"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-right mt-6 space-y-5"
              >
                <p className="text-sm text-muted-foreground">
                  צור את שלושת המושגים, ואז פתח את "קונספטים" במצב "לפי צורך" כדי לראות אותם זה לצד זה.
                </p>
                {comparisonQuestions.map(q => (
                  <div key={q.question}>
                    <h3 className="font-heading font-bold mb-2">{q.question}</h3>
                    <div className="flex gap-2 flex-wrap">
                      {q.concepts.map(chip)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/concept/${encodeURIComponent(q.need)}?mode=need`)}
                      >
                        להשוואה ←
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {openPanel === 'cultures' && (
              <motion.div
                key="cultures"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-right mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {cultureGroups.map(g => (
                  <div key={g.name}>
                    <h3 className="font-heading font-bold">{g.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2" dir="ltr" style={{ textAlign: 'right' }}>
                      {g.region_en}
                    </p>
                    <div className="flex gap-2 flex-wrap">{g.concepts.map(chip)}</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground text-sm">
              נוצרו עד כה{' '}
              <motion.span
                key={articles.length}
                initial={{ scale: 1.5, color: 'hsl(var(--accent))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                className="font-bold text-lg inline-block"
              >
                {articles.length}
              </motion.span>{' '}
              מרחבי תרבות
            </p>
          </motion.div>
        )}
      </section>

      {/* Recent articles */}
      {recentArticles.length > 0 && (
        <section className="px-4 pb-16">
          <div className="container max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">יצירות אחרונות</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
                לכל הספרייה ←
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {recentArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {articles.length === 0 && (
        <section className="px-4 pb-16 text-center">
          <p className="text-muted-foreground">
            עדיין לא נוצרו מרחבים. בחר מושג למעלה כדי להתחיל.
          </p>
        </section>
      )}
    </div>
  );
};

export default HomePage;
