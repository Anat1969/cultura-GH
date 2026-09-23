import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getArticleById, saveArticle } from '@/lib/storage';
import { Article, HUMAN_NEEDS, Origin, Practice, practiceLabels } from '@/types/article';
import { useToast } from '@/hooks/use-toast';

const textFields = [
  { key: 'spaceName' as const, label: 'שם המרחב', single: true },
  { key: 'insight' as const, label: 'מקור, הקשר וצורך', single: false },
  { key: 'proverb' as const, label: 'ברוח המושג', single: false },
  { key: 'interpretation' as const, label: 'גשר לתרבות המקומית', single: false },
];

const originFields: { key: keyof Origin; label: string; ltr?: boolean }[] = [
  { key: 'script', label: 'כתב מקורי' },
  { key: 'transliteration', label: 'תעתיק', ltr: true },
  { key: 'literal', label: 'משמעות מילולית' },
  { key: 'culture', label: 'תרבות' },
  { key: 'region_en', label: 'אזור (באנגלית)', ltr: true },
];

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [tagInput, setTagInput] = useState('');
  const articleRef = useRef<Article | null>(null);
  articleRef.current = article;

  useEffect(() => {
    if (!id) return;
    const a = getArticleById(id);
    if (!a) {
      navigate('/');
      return;
    }
    setArticle(a);
  }, [id, navigate]);

  // Auto-save every 30s (single interval, reads latest state via ref)
  useEffect(() => {
    const t = setInterval(() => {
      if (articleRef.current) saveArticle(articleRef.current);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const updateDimension = useCallback((key: string, value: string) => {
    setArticle(prev => (prev ? { ...prev, dimensions: { ...prev.dimensions, [key]: value } } : prev));
  }, []);

  const updateOrigin = useCallback((key: keyof Origin, value: string) => {
    setArticle(prev =>
      prev ? { ...prev, dimensions: { ...prev.dimensions, origin: { ...prev.dimensions.origin, [key]: value } } } : prev
    );
  }, []);

  const updatePractice = useCallback((key: keyof Practice, value: string) => {
    setArticle(prev =>
      prev
        ? { ...prev, dimensions: { ...prev.dimensions, practice: { ...prev.dimensions.practice, [key]: value } } }
        : prev
    );
  }, []);

  const updatePrompt = useCallback((key: 'exterior' | 'interior', value: string) => {
    setArticle(prev =>
      prev
        ? {
            ...prev,
            dimensions: { ...prev.dimensions, imagePrompts: { ...prev.dimensions.imagePrompts, [key]: value } },
          }
        : prev
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!article) return;
    saveArticle(article);
    toast({ title: 'נשמר בהצלחה' });
  }, [article, toast]);

  const addTag = useCallback(() => {
    if (!tagInput.trim() || !article) return;
    if (!article.tags.includes(tagInput.trim())) {
      setArticle({ ...article, tags: [...article.tags, tagInput.trim()] });
    }
    setTagInput('');
  }, [tagInput, article]);

  const removeTag = useCallback(
    (tag: string) => {
      if (!article) return;
      setArticle({ ...article, tags: article.tags.filter(t => t !== tag) });
    },
    [article]
  );

  if (!article) return null;
  const d = article.dimensions;

  return (
    <div className="container max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'בית', to: '/' }, { label: 'ספרייה', to: '/library' }, { label: 'עריכה' }]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-fluid-lg font-heading font-bold text-primary">עריכת מאמר</h1>
        <Button onClick={handleSave}>שמור</Button>
      </div>

      {/* Origin — linguistic layer */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-accent mb-3">מקור המושג</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {originFields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <Input
                value={d.origin[f.key]}
                onChange={e => updateOrigin(f.key, e.target.value)}
                dir={f.ltr ? 'ltr' : 'auto'}
                className={f.key === 'script' ? 'text-lg' : ''}
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">צורך אנושי (לקיבוץ והשוואה)</label>
            <select
              value={d.humanNeed}
              onChange={e => updateDimension('humanNeed', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">בחר צורך</option>
              {HUMAN_NEEDS.map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Tags */}
      <div className="mb-8">
        <label className="text-sm font-bold text-muted-foreground mb-2 block">תגיות</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {article.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="הוסף תגית..."
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={addTag}>
            הוסף
          </Button>
        </div>
      </div>

      {/* Text dimensions */}
      <div className="space-y-6">
        {textFields.map(({ key, label, single }) => (
          <div key={key}>
            <label className="text-sm font-bold text-accent mb-2 block">{label}</label>
            {single ? (
              <Input value={d[key]} onChange={e => updateDimension(key, e.target.value)} className="text-lg font-heading" />
            ) : (
              <Textarea
                value={d[key]}
                onChange={e => updateDimension(key, e.target.value)}
                rows={4}
                className="leading-relaxed"
              />
            )}
          </div>
        ))}

        {/* Practice */}
        <div>
          <label className="text-sm font-bold text-accent mb-2 block">ליישום</label>
          <div className="space-y-3">
            {(Object.keys(practiceLabels) as (keyof Practice)[]).map(k => (
              <div key={k} className="grid grid-cols-[3.5rem_1fr] items-start gap-3">
                <span className="text-sm text-muted-foreground pt-2">{practiceLabels[k]}</span>
                <Textarea value={d.practice[k]} onChange={e => updatePractice(k, e.target.value)} rows={2} />
              </div>
            ))}
          </div>
        </div>

        {/* Image prompts */}
        <div>
          <label className="text-sm font-bold text-accent mb-2 block">פרומפט: המושג בארץ המקור</label>
          <Textarea
            value={d.imagePrompts.exterior}
            onChange={e => updatePrompt('exterior', e.target.value)}
            rows={3}
            dir="ltr"
            className="font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-accent mb-2 block">פרומפט: מרחב מחייה מרפא בישראל</label>
          <Textarea
            value={d.imagePrompts.interior}
            onChange={e => updatePrompt('interior', e.target.value)}
            rows={3}
            dir="ltr"
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8 justify-center">
        <Button onClick={handleSave} size="lg">
          שמור
        </Button>
        <Button variant="outline" onClick={() => navigate(`/article/${article.id}`)}>
          צפה במאמר
        </Button>
        <Button variant="ghost" onClick={() => navigate('/library')}>
          חזרה לספרייה
        </Button>
      </div>
    </div>
  );
};

export default EditorPage;
