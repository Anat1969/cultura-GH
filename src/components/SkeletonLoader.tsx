import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const messages = [
  'מפענח את השכבה הלשונית...',
  'מאתר את ההקשר התרבותי...',
  'מזקק את הצורך האנושי...',
  'בונה גשר לתרבות המקומית...',
  'מתרגם לחומר, אור ומרקם...',
  'מעצב מרחב מחייה מרפא...',
];

const SkeletonLoader: React.FC<{ type?: 'text' | 'image' }> = ({ type = 'text' }) => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (type === 'image') {
    return (
      <div className="aspect-video rounded-lg bg-muted animate-pulse flex items-center justify-center">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-muted-foreground text-sm"
        >
          {messages[msgIdx]}
        </motion.p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-6 w-1/3 rounded bg-muted animate-pulse" />
      <div className="h-4 w-full rounded bg-muted animate-pulse" />
      <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
      <motion.p key={msgIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-xs mt-2">
        {messages[msgIdx]}
      </motion.p>
    </div>
  );
};

export default SkeletonLoader;
