import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declared for environments where React class types are synthesized
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('[Aryan Agency App ErrorBoundary caught an error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-200 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                {this.props.fallbackTitle || 'Kuch Galat Hua (Temporary UI Glitch)'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aapka data surakshit hai. Is panel ko dobara load karne ke liye niche diye gaye button par click karein.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left max-h-28 overflow-y-auto font-mono text-[11px] text-slate-700">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Dobara Koshish Karein</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>App Reload Karein</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
