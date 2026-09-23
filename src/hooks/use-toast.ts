import { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export type ToastInput = Omit<Toast, 'id'>;

const TIMEOUT = 4000;

let toasts: Toast[] = [];
const listeners = new Set<(t: Toast[]) => void>();

function emit() {
  const snapshot = [...toasts];
  listeners.forEach(l => l(snapshot));
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

/** Usable outside React too, so lib code can report failures. */
export function toast(input: ToastInput): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  toasts = [{ id, ...input }, ...toasts].slice(0, 4);
  emit();
  setTimeout(() => dismissToast(id), TIMEOUT);
  return id;
}

export function useToast() {
  const [current, setCurrent] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  return { toast, toasts: current, dismiss: dismissToast };
}
