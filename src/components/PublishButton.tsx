import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Article } from '@/types/article';
import { publishArticle } from '@/lib/publish';
import { hasGithubToken } from '@/lib/settings';

/**
 * Sends the article to the repository, where the workflow downloads its images
 * and commits both. Until that lands, the article lives only in this browser.
 */
const PublishButton: React.FC<{ article: Article; size?: 'default' | 'lg' }> = ({
  article,
  size = 'default',
}) => {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!hasGithubToken()) {
    return (
      <Button variant="outline" size={size} onClick={() => navigate('/settings')}>
        חבר את GitHub לשמירה קבועה
      </Button>
    );
  }

  const publish = async () => {
    setState('sending');
    try {
      await publishArticle(article);
      setState('sent');
      toast({
        title: 'נשלח לשמירה בגיטהב',
        description: 'התמונות יורדות והמאמר נשמר בריפו. זה לוקח כדקה עד שהוא מופיע באתר.',
      });
    } catch (error) {
      setState('idle');
      toast({
        title: 'הפרסום נכשל',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button variant="outline" size={size} onClick={publish} disabled={state !== 'idle'}>
      {state === 'sending' ? 'שולח...' : state === 'sent' ? 'נשמר בגיטהב' : 'שמור בגיטהב'}
    </Button>
  );
};

export default PublishButton;
