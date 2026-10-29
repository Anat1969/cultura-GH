import React, { useEffect, useState } from 'react';
import { SAVE_STATE, SaveState } from '@/lib/storage';

const LABELS: Record<SaveState, string> = {
  saving: 'שומר…',
  saved: 'נשמר בספרייה המשותפת',
  offline: 'אין חיבור. נשמר במכשיר ויישלח כשהחיבור יחזור',
};

/** Says where the article stands: saving, saved for good, or waiting to be sent. */
const SaveStatus: React.FC<{ id: string; className?: string }> = ({ id, className = '' }) => {
  const [state, setState] = useState<SaveState | null>(null);

  useEffect(() => {
    const on = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; state: SaveState }>).detail;
      if (detail?.id === id) setState(detail.state);
    };
    window.addEventListener(SAVE_STATE, on);
    return () => window.removeEventListener(SAVE_STATE, on);
  }, [id]);

  if (!state) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={`font-mono text-xs ${state === 'offline' ? 'text-destructive' : 'text-muted-foreground'} ${className}`}
    >
      {LABELS[state]}
    </span>
  );
};

export default SaveStatus;
