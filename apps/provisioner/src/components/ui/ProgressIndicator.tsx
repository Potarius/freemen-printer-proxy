/**
 * Premium Progress Indicator Component
 * Step-based progress with elegant transitions
 */

import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressIndicator({
  steps,
  currentStep,
  className,
  variant = 'horizontal',
  size = 'md',
}: ProgressIndicatorProps) {
  const sizes = {
    sm: { dot: 'w-8 h-8', text: 'text-xs', icon: 'w-3.5 h-3.5' },
    md: { dot: 'w-10 h-10', text: 'text-sm', icon: 'w-4 h-4' },
    lg: { dot: 'w-12 h-12', text: 'text-base', icon: 'w-5 h-5' },
  };

  if (variant === 'vertical') {
    return (
      <div className={clsx('space-y-0', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex">
              {/* Step indicator */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={clsx(
                    'flex items-center justify-center rounded-full transition-all duration-500',
                    sizes[size].dot,
                    isCompleted
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                      : isCurrent
                      ? 'bg-gradient-to-br from-freemen-500 to-freemen-600 text-white shadow-lg shadow-freemen-500/25 ring-4 ring-freemen-500/20'
                      : 'bg-surface-800 text-surface-500 border-2 border-surface-700'
                  )}
                >
                  {isCompleted ? (
                    <Check className={sizes[size].icon} />
                  ) : (
                    <span className={clsx('font-semibold', sizes[size].text)}>
                      {index + 1}
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={clsx(
                      'w-0.5 flex-1 min-h-[40px] my-2 rounded-full transition-colors duration-500',
                      isCompleted ? 'bg-emerald-500' : 'bg-surface-700'
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={clsx('pb-8', !isLast && 'min-h-[80px]')}>
                <h4
                  className={clsx(
                    'font-semibold transition-colors',
                    sizes[size].text,
                    isCompleted || isCurrent ? 'text-white' : 'text-surface-500'
                  )}
                >
                  {step.title}
                </h4>
                {step.description && (
                  <p
                    className={clsx(
                      'mt-1 transition-colors',
                      size === 'sm' ? 'text-xs' : 'text-sm',
                      isCurrent ? 'text-surface-400' : 'text-surface-600'
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={clsx('flex items-center', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {/* Step dot */}
              <div
                className={clsx(
                  'flex items-center justify-center rounded-full transition-all duration-500',
                  sizes[size].dot,
                  isCompleted
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : isCurrent
                    ? 'bg-gradient-to-br from-freemen-500 to-freemen-600 text-white shadow-lg shadow-freemen-500/25 ring-4 ring-freemen-500/20'
                    : 'bg-surface-800 text-surface-500 border-2 border-surface-700'
                )}
              >
                {isCompleted ? (
                  <Check className={sizes[size].icon} />
                ) : (
                  <span className={clsx('font-semibold', sizes[size].text)}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Step label */}
              <div className="mt-3 text-center">
                <p
                  className={clsx(
                    'font-medium transition-colors',
                    sizes[size].text,
                    isCompleted || isCurrent ? 'text-white' : 'text-surface-500'
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-4">
                <div className="h-0.5 rounded-full bg-surface-800 relative overflow-hidden">
                  <div
                    className={clsx(
                      'absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 rounded-full',
                      isCompleted ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variants = {
    default: 'from-freemen-500 to-freemen-400',
    success: 'from-emerald-500 to-emerald-400',
    warning: 'from-amber-500 to-amber-400',
    error: 'from-red-500 to-red-400',
  };

  const glowColors = {
    default: 'rgba(14, 165, 233, 0.4)',
    success: 'rgba(16, 185, 129, 0.4)',
    warning: 'rgba(245, 158, 11, 0.4)',
    error: 'rgba(239, 68, 68, 0.4)',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-surface-400">Progress</span>
          <span className="text-white font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full bg-surface-800/80 overflow-hidden',
          sizes[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
            variants[variant]
          )}
          style={{
            width: `${percentage}%`,
            boxShadow: `0 0 12px ${glowColors[variant]}`,
          }}
        />
      </div>
    </div>
  );
}
