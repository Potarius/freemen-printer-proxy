/**
 * Premium Input Component
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = !!error;
    const hasSuccess = !!success;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-200 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full bg-surface-900/80 border rounded-xl px-4 py-3 text-white placeholder:text-surface-500 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface-950',
              leftIcon && 'pl-12',
              (rightIcon || hasError || hasSuccess) && 'pr-12',
              hasError
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                : hasSuccess
                ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/30'
                : 'border-surface-700 focus:border-freemen-500 focus:ring-freemen-500/30',
              className
            )}
            {...props}
          />
          {(rightIcon || hasError || hasSuccess) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : hasSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <span className="text-surface-400">{rightIcon}</span>
              )}
            </div>
          )}
        </div>
        {(error || success || hint) && (
          <p
            className={clsx(
              'mt-2 text-sm',
              hasError
                ? 'text-red-400'
                : hasSuccess
                ? 'text-green-400'
                : 'text-surface-500'
            )}
          >
            {error || success || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
