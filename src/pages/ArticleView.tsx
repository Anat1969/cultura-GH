import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import PublishButton from '@/components/PublishButton';
import { OriginLine, PracticeBlock } from '@/components/CultureBlocks';
import { getArticleById } from '@/lib/storage';
import { Article } from '@/types/article';
import { useToast } from '@/hooks/use-toast';

const dimensionConfig = [
  { key: 'insight' as const, label: 'מקור, הקשר וצורך' },
  { key: 'proverb' as const, label: 'ברוח המושג' },
  { key: 'interpretation' as const, label: 'גשר לתרבות המקומית' },
];

const ArticleViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const a = getArticleById(id);
    if (!a) {
      navigate('/library');
      return;
    }
    setArticle(a);
  }, [id, navigate]);

  const copyPrompt = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(label);
    setTimeout(() => setCopiedPrompt(null), 2000);
    toast({ title: 'הפרומפט הועתק' });
  };

  if (!article) return null;
  const d = article.dimensions;

  return (
    <div className="min-h-screen">
      {article.images.exterior && (
        <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
          <img src={article.images.exterior} alt={d.spaceName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}

      <div className="container max-w-3xl px-4 -mt-16 relative z-10 pb-16">
        <Breadcrumbs items={[{ label: 'בית', to: '/' }, { label: 'ספרייה', to: '/library' }, { label: d.spaceName }]} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-fluid-xl font-heading font-bold text-primary mb-4">{d.spaceName}</h1>
          <OriginLine origin={d.origin} className="mb-4" />

          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Badge variant="outline" className="text-sm">
              {article.concept}
            </Badge>
            {article.tags
              .filter(t => t !== article.concept)
              .map(t => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="text-sm cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/concept/${encodeURIComponent(t)}?mode=${t === d.humanNeed ? 'need' : 'culture'}`
                    )
                  }
                >
                  {t}
                </Badge>
              ))}
            <span className="text-xs text-muted-foreground mr-auto">
              {new Date(article.createdAt).toLocaleDateString('he-IL')}
            </span>
          </div>
        </motion.div>

        <div className="space-y-8 mb-12">
          {dimensionConfig.map(({ key, label }, i) => (
            <motion.section key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <h2 className="text-lg font-heading font-bold text-accent mb-3">{label}</h2>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-lg">{d[key]}</p>
            </motion.section>
          ))}

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-lg font-heading font-bold text-accent mb-3">ליישום</h2>
            <PracticeBlock practice={d.practice} />
          </motion.section>
        </div>

        {(article.images.exterior || article.images.interior) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {article.images.exterior && (
              <div className="rounded-lg overflow-hidden">
                <img src={article.images.exterior} alt="המושג בארץ המקור" className="w-full aspect-video object-cover" />
                <p className="text-xs text-center text-muted-foreground mt-1">בארץ המקור</p>
              </div>
            )}
            {article.images.interior && (
              <div className="rounded-lg overflow-hidden">
                <img src={article.images.interior} alt="מרחב מחייה מרפא בישראל" className="w-full aspect-video object-cover" />
                <p className="text-xs text-center text-muted-foreground mt-1">מרחב מרפא בישראל</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mb-12">
          <h2 className="text-lg font-heading font-bold text-accent">פרומפטים</h2>
          {[
            { label: 'המושג בארץ המקור', text: d.imagePrompts.exterior },
            { label: 'מרחב מחייה מרפא בישראל', text: d.imagePrompts.interior },
          ].map(({ label, text }) => (
            <div key={label} className="bg-muted rounded-lg p-4 relative group">
              <span className="text-xs text-muted-foreground">{label}:</span>
              <p className="font-mono text-sm mt-1" dir="ltr">
                {text}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyPrompt(text, label)}
              >
                {copiedPrompt === label ? 'הועתק' : 'העתק'}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate(`/edit/${article.id}`)}>עריכה</Button>
          <PublishButton article={article} />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: 'הקישור הועתק' });
            }}
          >
            שתף
          </Button>
          {d.humanNeed && (
            <Button variant="outline" onClick={() => navigate(`/concept/${encodeURIComponent(d.humanNeed)}?mode=need`)}>
              השווה לתרבויות אחרות
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/library')}>
            חזרה לספרייה
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArticleViewPage;
