/**
 * Error Boundary Component
 * Catches JavaScript errors and displays a fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Here you could also send to an error reporting service
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const errorReport = [
      '=== FREEMEN PROVISIONER ERROR REPORT ===',
      `Date: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      '',
      '--- Error ---',
      `Name: ${error?.name || 'Unknown'}`,
      `Message: ${error?.message || 'No message'}`,
      '',
      '--- Stack Trace ---',
      error?.stack || 'No stack trace available',
      '',
      '--- Component Stack ---',
      errorInfo?.componentStack || 'No component stack available',
      '',
      '=== END REPORT ===',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(errorReport);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      console.error('Failed to copy error report');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, copied } = this.state;

      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            {/* Error icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </div>

            {/* Error message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-3">
                Something went wrong
              </h1>
              <p className="text-surface-400 mb-4">
                The application encountered an unexpected error. This has been logged for investigation.
              </p>
              
              {/* Error details */}
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                  <p className="text-sm font-mono text-red-400 break-all">
                    {error.message || 'Unknown error'}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-freemen-600 to-freemen-500 text-white font-medium hover:from-freemen-500 hover:to-freemen-400 transition-all shadow-lg shadow-freemen-500/25"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Application
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 text-surface-200 border border-surface-700 hover:bg-surface-700 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
                <button
                  onClick={this.handleCopyError}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-800 text-surface-200 border border-surface-700 hover:bg-surface-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Error
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Help text */}
            <p className="text-center text-xs text-surface-600 mt-6">
              If this problem persists, please{' '}
              <a
                href="https://github.com/Potarius/freemen-printer-proxy/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-freemen-400 hover:underline"
              >
                report an issue
              </a>
              {' '}with the copied error details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Error</h3>
          <p className="text-sm text-red-400 font-mono mb-4">{error.message}</p>
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
