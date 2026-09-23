import React from 'react';

interface State {
  error: Error | null;
}

/**
 * A render error anywhere below here would otherwise unmount the whole tree and
 * leave an empty page - indistinguishable from a black screen. Show what broke.
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('CultureArch crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-fluid-lg font-heading font-bold text-primary">משהו נשבר</h1>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          האפליקציה נתקלה בשגיאה ולא הצליחה להציג את המסך. הספרייה השמורה לא נפגעה.
        </p>
        <p dir="ltr" className="font-mono text-xs text-muted-foreground/70 max-w-lg break-words">
          {error.message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="h-10 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            רענן
          </button>
          <button
            onClick={() => {
              window.location.hash = '#/';
              window.location.reload();
            }}
            className="h-10 rounded-md border border-input px-6 text-sm"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
