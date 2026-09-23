import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MagazinePage from '@/components/MagazinePage';
import { getArticles } from '@/lib/storage';
import { Article } from '@/types/article';

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles] = useState<Article[]>(getArticles);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return articles;
    const s = search.toLowerCase();
    return articles.filter(a => {
      const d = a.dimensions;
      return [a.concept, d.spaceName, d.humanNeed, d.origin.culture, d.origin.transliteration, d.origin.region_en, ...a.tags]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(s));
    });
  }, [articles, search]);

  const totalPages = filtered.length;

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  const goTo = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) setCurrentPage(page);
    },
    [totalPages]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (!typing && (e.key === 'ArrowLeft' || e.key === 'ArrowDown')) goTo(currentPage + 1);
      if (!typing && (e.key === 'ArrowRight' || e.key === 'ArrowUp')) goTo(currentPage - 1);
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearch('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, goTo, showSearch]);

  if (articles.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-fluid-lg font-heading font-bold text-primary mb-4">המגזין ריק</h1>
          <p className="text-muted-foreground mb-8">צור את מרחב התרבות הראשון שלך כדי למלא את המגזין</p>
          <Button size="lg" onClick={() => navigate('/')}>
            צור מרחב חדש
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentArticle = filtered[currentPage];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AnimatePresence mode="wait">
        {currentArticle && (
          <motion.div
            key={currentArticle.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <MagazinePage article={currentArticle} layoutVariant={currentPage} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="container max-w-4xl mx-auto px-4 pb-6">
          <div className="pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between gap-4 bg-background/70 backdrop-blur-xl border border-border/50 rounded-2xl px-5 py-3 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 0} className="text-lg px-3">
                  →
                </Button>
                <span className="text-sm text-muted-foreground font-mono min-w-[60px] text-center">
                  {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '—'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goTo(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="text-lg px-3"
                >
                  ←
                </Button>
              </div>

              {totalPages <= 12 && totalPages > 1 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {filtered.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`עמוד ${i + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentPage ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setShowSearch(!showSearch)} className="text-sm">
                  חיפוש
                </Button>
                {currentArticle && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/article/${currentArticle.id}`)} className="text-sm">
                    פתח
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-sm">
                  חדש
                </Button>
              </div>
            </motion.div>

            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  <Input
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setCurrentPage(0);
                    }}
                    placeholder="חפש מושג, תרבות, צורך, שם מרחב..."
                    className="bg-background/80 backdrop-blur-xl border-border/50"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;
