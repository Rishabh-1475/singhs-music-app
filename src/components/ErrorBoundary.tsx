'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Singh\'s Music Company - Caught render error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 my-4 rounded-2xl bg-[#16191E] border border-red-900/30 text-center flex flex-col items-center justify-center space-y-3 shadow-lg select-none">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {this.props.fallbackTitle || 'Failed to load section'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {this.props.fallbackDescription ||
                'A temporary glitch occurred while rendering this music component. Click retry to recover.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1DB954] text-black text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-md shadow-[#1DB954]/20"
          >
            <RefreshCw size={13} />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
