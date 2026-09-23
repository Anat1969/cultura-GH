import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MagazinePage from '@/components/MagazinePage';
import ArticleCard from '@/components/ArticleCard';
import { getArticles } from '@/lib/storage';
import { Article } from '@/types/article';

type View = 'cards' | 'magazine';

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles] = useState<Article[]>(getArticles);
  const [view, setView] = useState<View>('cards');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const s = search.toLowerCase();
    return articles.filter(a => {
      const d = a.dimensions;
      return [
        a.concept,
        d.spaceName,
        d.lede,
        d.humanNeed,
        d.origin.culture,
        d.origin.transliteration,
        d.origin.region_en,
        ...a.tags,
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(s));
    });
  }, [articles, search]);

  const totalPages = filtered.length;

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) setCurrentPage(totalPages - 1);
  }, [totalPages, currentPage]);

  const goTo = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) setCurrentPage(page);
    },
    [totalPages]
  );

  // Arrow keys page the magazine; they mean nothing in a grid.
  useEffect(() => {
    if (view !== 'magazine') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') goTo(currentPage + 1);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') goTo(currentPage - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentPage, goTo]);

  if (articles.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-fluid-lg font-heading font-bold text-primary mb-4">המגזין ריק</h1>
          <p className="text-muted-foreground mb-8">צרי את מרחב התרבות הראשון כדי למלא אותו</p>
          <Button size="lg" onClick={() => navigate('/')}>
            צור מרחב חדש
          </Button>
        </motion.div>
      </div>
    );
  }

  if (view === 'magazine') {
    const current = filtered[currentPage];
    return (
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <MagazinePage article={current} layoutVariant={currentPage} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
          <div className="container mx-auto max-w-4xl px-4 pb-6">
            <div className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/70 px-5 py-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goTo(currentPage - 1)}
                  disabled={currentPage <= 0}
                  className="px-3 text-lg"
                >
                  →
                </Button>
                <span className="min-w-[60px] text-center font-mono text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goTo(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 text-lg"
                >
                  ←
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setView('cards')}>
                  כרטיסיות
                </Button>
                {current && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/article/${current.id}`)}>
                    פתח
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl px-4 py-10">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-fluid-lg font-heading font-bold text-primary">הספרייה</h1>
        <p className="mt-1 text-muted-foreground">
          {articles.length} מרחבי תרבות{search.trim() && ` · ${filtered.length} תואמים לחיפוש`}
        </p>
      </motion.header>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפשי מושג, תרבות, צורך או שם מרחב…"
          className="max-w-sm text-right"
          dir="rtl"
        />
        <div className="flex gap-2">
          <Button variant="default" size="sm">
            כרטיסיות
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView('magazine')}>
            מגזין
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            חדש
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">לא נמצאו תוצאות</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
