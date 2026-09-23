import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import Breadcrumbs from '@/components/Breadcrumbs';
import SkeletonLoader from '@/components/SkeletonLoader';
import { generateDimensions, generateImages } from '@/lib/ai';
import { saveArticle } from '@/lib/storage';
import { Article, buildTags } from '@/types/article';

/**
 * The creating screen, and nothing else.
 *
 * A generation costs money and takes a minute, so the article is written to the
 * library the moment the text exists - before any image work, and without
 * waiting for anyone to press save. Then this hands over to the article page,
 * which is the single place an article is read and worked on.
 */
const OutputPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { concept?: string; hint?: string } | null;
  const concept = state?.concept;
  const hint = state?.hint;

  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'text' | 'images'>('text');
  // React 18 mounts twice in development; one generation per visit is plenty.
  const started = useRef(false);

  const generate = useCallback(async () => {
    if (!concept) return;
    setError(null);
    setStage('text');

    try {
      const dimensions = await generateDimensions(concept, hint);

      const now = new Date().toISOString();
      const article: Article = {
        id: uuid(),
        concept,
        createdAt: now,
        updatedAt: now,
        tags: buildTags(dimensions),
        dimensions,
        images: { exterior: null, interior: null },
        videos: { exterior: null, interior: null },
      };

      // Saved before anything else can fail.
      saveArticle(article);

      setStage('images');
      try {
        const images = await generateImages(
          dimensions.imagePrompts.exterior,
          dimensions.imagePrompts.interior
        );
        saveArticle({ ...article, images });
      } catch {
        // No image provider configured, or it failed. The frames stay empty for
        // the user to fill by hand, which is a supported path, not an error.
      }

      navigate(`/article/${article.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    }
  }, [concept, hint, navigate]);

  useEffect(() => {
    if (!concept) {
      navigate('/', { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;
    void generate();
  }, [concept, generate, navigate]);

  if (!concept) return null;

  return (
    <div className="container max-w-2xl px-4 py-12">
      <Breadcrumbs items={[{ label: 'בית', to: '/' }, { label: concept }]} />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-fluid-lg font-heading font-bold text-primary mb-8"
      >
        {concept}
      </motion.h1>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
          <p className="mb-6 leading-relaxed text-foreground">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                started.current = true;
                void generate();
              }}
            >
              נסי שוב
            </Button>
            <Button variant="outline" asChild>
              <Link to="/settings">הגדרות</Link>
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              חזרה
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            {stage === 'text' ? 'כותב את הכתבה…' : 'מחפש תמונות…'} המאמר נשמר אוטומטית בספרייה.
          </p>
          <SkeletonLoader />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkeletonLoader type="image" />
            <SkeletonLoader type="image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputPage;
