import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { v4 as uuid } from 'uuid';
import Breadcrumbs from '@/components/Breadcrumbs';
import SkeletonLoader from '@/components/SkeletonLoader';
import { OriginLine, PracticeBlock } from '@/components/CultureBlocks';
import { generateDimensions, generateImages } from '@/lib/ai';
import { saveArticle } from '@/lib/storage';
import { Article, GeneratedDimensions, buildTags } from '@/types/article';
import { useToast } from '@/hooks/use-toast';

const dimensionLabels = {
  spaceName: 'שם המרחב',
  insight: 'מקור, הקשר וצורך',
  proverb: 'ברוח המושג',
  interpretation: 'גשר לתרבות המקומית',
} as const;

type TextKey = keyof typeof dimensionLabels;
const textKeys: TextKey[] = ['spaceName', 'insight', 'proverb', 'interpretation'];

const OutputPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const state = location.state as { concept?: string; hint?: string } | null;
  const concept = state?.concept as string;
  const hint = state?.hint;

  const [dimensions, setDimensions] = useState<GeneratedDimensions | null>(null);
  const [images, setImages] = useState<{ exterior: string | null; interior: string | null }>({ exterior: null, interior: null });
  const [loadingText, setLoadingText] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoadingText(true);
    setError(null);
    try {
      const dims = await generateDimensions(concept, hint);
      setDimensions(dims);
      setLoadingText(false);

      setLoadingImages(true);
      try {
        const imgs = await generateImages(dims.imagePrompts.exterior, dims.imagePrompts.interior);
        setImages({ exterior: imgs.exterior, interior: imgs.interior });
      } catch (imgErr: unknown) {
        const errorMsg = imgErr instanceof Error ? imgErr.message : 'שגיאה לא ידועה';
        toast({ title: 'שגיאה ביצירת תמונות', description: errorMsg, variant: 'destructive' });
      } finally {
        setLoadingImages(false);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMsg);
      setLoadingText(false);
    }
  }, [concept, hint, toast]);

  useEffect(() => {
    if (!concept) {
      navigate('/');
      return;
    }
    generate();
  }, [concept, generate, navigate]);

  const buildArticle = useCallback((): Article | null => {
    if (!dimensions) return null;
    const now = new Date().toISOString();
    return {
      id: uuid(),
      concept,
      createdAt: now,
      updatedAt: now,
      tags: buildTags(dimensions),
      dimensions,
      images: { exterior: images.exterior, interior: images.interior },
    };
  }, [dimensions, images, concept]);

  const handleSave = useCallback(() => {
    const article = buildArticle();
    if (!article) return;
    saveArticle(article);
    toast({ title: 'המאמר נשמר בספרייה' });
    navigate(`/article/${article.id}`);
  }, [buildArticle, navigate, toast]);

  const handleEdit = useCallback(() => {
    const article = buildArticle();
    if (!article) return;
    saveArticle(article);
    navigate(`/edit/${article.id}`);
  }, [buildArticle, navigate]);

  const handleRegenerateImages = useCallback(async () => {
    if (!dimensions) return;
    setLoadingImages(true);
    try {
      const imgs = await generateImages(dimensions.imagePrompts.exterior, dimensions.imagePrompts.interior);
      setImages({ exterior: imgs.exterior, interior: imgs.interior });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      toast({ title: 'שגיאה', description: errorMsg, variant: 'destructive' });
    } finally {
      setLoadingImages(false);
    }
  }, [dimensions, toast]);

  if (!concept) return null;

  return (
    <div className="container max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'בית', to: '/' }, { label: concept }]} />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-fluid-lg font-heading font-bold text-primary mb-4"
      >
        {concept}
      </motion.h1>

      {dimensions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <OriginLine origin={dimensions.origin} />
          {dimensions.humanNeed && (
            <p className="text-sm text-muted-foreground mt-3">
              צורך: <span className="font-bold text-foreground">{dimensions.humanNeed}</span>
            </p>
          )}
        </motion.div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center mb-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={generate} variant="outline">
            נסה שוב
          </Button>
        </div>
      )}

      <div className="space-y-6 mb-10">
        {loadingText ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} />)
        ) : (
          dimensions && (
            <>
              {textKeys.map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <h3 className="text-sm font-bold text-accent mb-2">{dimensionLabels[key]}</h3>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{dimensions[key]}</p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="text-sm font-bold text-accent mb-2">ליישום</h3>
                <PracticeBlock practice={dimensions.practice} className="border-t-0 pt-0" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="text-sm font-bold text-accent mb-2">פרומפטים לתמונות</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">המושג בארץ המקור:</span>
                    <p className="text-sm font-mono bg-muted rounded p-2 mt-1 select-all" dir="ltr">
                      {dimensions.imagePrompts.exterior}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">מרחב מחייה מרפא בישראל:</span>
                    <p className="text-sm font-mono bg-muted rounded p-2 mt-1 select-all" dir="ltr">
                      {dimensions.imagePrompts.interior}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {loadingImages || loadingText ? (
          <>
            <SkeletonLoader type="image" />
            <SkeletonLoader type="image" />
          </>
        ) : (
          <>
            {images.exterior && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden">
                <img src={images.exterior} alt="המושג בארץ המקור" className="w-full aspect-video object-cover" />
                <p className="text-xs text-muted-foreground mt-1 text-center">בארץ המקור</p>
              </motion.div>
            )}
            {images.interior && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden">
                <img src={images.interior} alt="מרחב מחייה מרפא בישראל" className="w-full aspect-video object-cover" />
                <p className="text-xs text-muted-foreground mt-1 text-center">מרחב מרפא בישראל</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {!loadingText && dimensions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-3 justify-center">
          <Button onClick={handleSave} size="lg">
            שמור בספרייה
          </Button>
          <Button onClick={handleRegenerateImages} variant="outline" disabled={loadingImages}>
            {loadingImages ? 'יוצר תמונות...' : 'צור תמונות מחדש'}
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            ערוך לפני שמירה
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            חזרה
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default OutputPage;
