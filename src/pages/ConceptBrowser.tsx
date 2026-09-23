import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Breadcrumbs from '@/components/Breadcrumbs';
import { OriginLine, PracticeBlock } from '@/components/CultureBlocks';
import { getArticles, getGroups, getArticlesByGroup, GroupMode } from '@/lib/storage';

const modeLabels: Record<GroupMode, string> = { need: 'לפי צורך', culture: 'לפי תרבות' };

const ConceptBrowser: React.FC = () => {
  const { concept: groupParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode: GroupMode = searchParams.get('mode') === 'culture' ? 'culture' : 'need';
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'compare' | 'list'>('compare');
  const [selected, setSelected] = useState<string | null>(groupParam ? decodeURIComponent(groupParam) : null);

  const articles = useMemo(() => getArticles(), []);
  const groups = useMemo(() => getGroups(mode), [mode]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(g => g.key.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const selectedArticles = useMemo(
    () => (selected ? getArticlesByGroup(mode, selected) : []),
    [selected, mode]
  );

  useEffect(() => {
    if (groupParam) setSelected(decodeURIComponent(groupParam));
  }, [groupParam]);

  const switchMode = (m: GroupMode) => {
    setSelected(null);
    setSearchParams({ mode: m });
    if (groupParam) navigate(`/concepts?mode=${m}`);
  };

  if (articles.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-fluid-lg font-heading font-bold text-primary mb-4">אין עדיין קונספטים</h1>
          <p className="text-muted-foreground mb-8">צור את מרחב התרבות הראשון שלך כדי להתחיל להשוות</p>
          <Button size="lg" onClick={() => navigate('/')}>
            צור מרחב חדש
          </Button>
        </motion.div>
      </div>
    );
  }

  const isComparison = mode === 'need' && selectedArticles.length > 1;

  return (
    <div className="container max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'בית', to: '/' },
          { label: 'קונספטים', to: `/concepts?mode=${mode}` },
          ...(selected ? [{ label: selected }] : []),
        ]}
      />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-fluid-lg font-heading font-bold text-primary mb-2"
      >
        מושגי תרבות
      </motion.h1>
      <p className="text-muted-foreground mb-6">
        {articles.length} מרחבים ב-{groups.length} {mode === 'need' ? 'צרכים' : 'תרבויות'}
      </p>

      {/* The one addition to the skeleton: grouping toggle */}
      <div className="flex gap-2 mb-8">
        {(Object.keys(modeLabels) as GroupMode[]).map(m => (
          <Button key={m} variant={mode === m ? 'default' : 'outline'} size="sm" onClick={() => switchMode(m)}>
            {modeLabels[m]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Groups list */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground mb-2 block">
                {mode === 'need' ? 'חפש צורך' : 'חפש תרבות'}
              </label>
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="חיפוש..."
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {filteredGroups.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground text-center py-4">
                    לא נמצאו תוצאות
                  </motion.p>
                ) : (
                  filteredGroups.map(({ key, count }, i) => (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelected(key)}
                      className={`w-full text-right px-4 py-3 rounded-lg border-2 transition-all ${
                        selected === key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{key}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    </motion.button>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Group content */}
        <div className="lg:col-span-3">
          {!selected ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-muted-foreground mb-2">
                {mode === 'need'
                  ? 'בחר צורך כדי לראות איך תרבויות שונות עונות עליו, זו לצד זו'
                  : 'בחר תרבות כדי לראות את המושגים שלה'}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold">{selected}</h2>
                  {isComparison && (
                    <p className="text-sm text-muted-foreground">
                      {selectedArticles.length} תרבויות עונות על אותו צורך. ההבדל בדרך החשיבה נחשף בהצבה זו לצד זו.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant={viewMode === 'compare' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('compare')}>
                    זה לצד זה
                  </Button>
                  <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                    רשימה
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedArticles.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-center py-8">
                    אין יצירות בקבוצה זו עדיין
                  </motion.p>
                ) : (
                  <motion.div
                    key={`${selected}-${viewMode}-${mode}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={viewMode === 'compare' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}
                  >
                    {selectedArticles.map((article, i) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {viewMode === 'compare' ? (
                          <Card
                            className="cursor-pointer hover:border-primary/50 transition-colors group overflow-hidden h-full"
                            onClick={() => navigate(`/article/${article.id}`)}
                          >
                            {(article.images.interior || article.images.exterior) && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={article.images.interior || article.images.exterior!}
                                  alt={article.dimensions.spaceName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <CardContent className="p-4 space-y-3">
                              <OriginLine origin={article.dimensions.origin} size="sm" />
                              <h3 className="font-heading font-bold">{article.concept}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-4">{article.dimensions.insight}</p>
                              <PracticeBlock practice={article.dimensions.practice} compact />
                            </CardContent>
                          </Card>
                        ) : (
                          <Card
                            className="cursor-pointer hover:border-primary/50 transition-colors p-4 group"
                            onClick={() => navigate(`/article/${article.id}`)}
                          >
                            <div className="flex items-start gap-4">
                              {article.images.exterior && (
                                <img
                                  src={article.images.exterior}
                                  alt={article.dimensions.spaceName}
                                  className="w-20 h-20 object-cover rounded group-hover:scale-105 transition-transform"
                                />
                              )}
                              <div className="flex-1 text-right">
                                <h3 className="font-heading font-bold mb-1">
                                  {article.concept} · {article.dimensions.spaceName}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{article.dimensions.insight}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {article.dimensions.origin.culture} ·{' '}
                                  {new Date(article.createdAt).toLocaleDateString('he-IL')}
                                </p>
                              </div>
                            </div>
                          </Card>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConceptBrowser;
