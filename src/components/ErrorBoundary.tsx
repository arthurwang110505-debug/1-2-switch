/**
 * Error Boundary component
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      const fallback = (this as any).props.fallback;
      return fallback || (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-black mb-2">遊戲當機了！</h2>
          <p className="text-slate-400 mb-4 text-center">請重新整理頁面再試一次</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition cursor-pointer"
          >
            重新整理
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
