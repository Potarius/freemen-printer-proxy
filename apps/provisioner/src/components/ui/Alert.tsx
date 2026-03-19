/**
 * Premium Alert Component
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

export function Alert({ children, variant = 'info', title, onClose }: AlertProps) {
  const variants = {
    info: {
      bg: 'bg-freemen-500/10 border-freemen-500/30',
      icon: <Info className="w-5 h-5 text-freemen-400" />,
      title: 'text-freemen-300',
    },
    success: {
      bg: 'bg-green-500/10 border-green-500/30',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      title: 'text-green-300',
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      title: 'text-yellow-300',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      title: 'text-red-300',
    },
  };

  const config = variants[variant];

  return (
    <div className={clsx('rounded-xl border p-4', config.bg)}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={clsx('font-semibold mb-1', config.title)}>{title}</h4>
          )}
          <div className="text-sm text-surface-300">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-surface-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
