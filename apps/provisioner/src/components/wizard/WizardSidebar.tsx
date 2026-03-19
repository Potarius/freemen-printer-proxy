/**
 * Premium Wizard Sidebar with Step Navigation
 */

import { clsx } from 'clsx';
import { Check, Circle } from 'lucide-react';

export interface WizardStepConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface WizardSidebarProps {
  steps: WizardStepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardSidebar({ steps, currentStep, onStepClick }: WizardSidebarProps) {
  return (
    <div className="w-80 bg-surface-900/30 border-r border-surface-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-freemen-500 to-freemen-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-white">Provisioner</h2>
            <p className="text-xs text-surface-400">Device Setup Wizard</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;
            const canClick = onStepClick && isCompleted;

            return (
              <button
                key={step.id}
                onClick={() => canClick && onStepClick(index)}
                disabled={!canClick}
                className={clsx(
                  'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200',
                  isActive && 'bg-freemen-500/15 border border-freemen-500/30',
                  isCompleted && !isActive && 'hover:bg-surface-800/50 cursor-pointer',
                  isPending && 'opacity-50 cursor-default',
                  !isActive && 'border border-transparent'
                )}
              >
                {/* Step indicator */}
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                    isCompleted && 'bg-green-500/20 text-green-400',
                    isActive && 'bg-freemen-500/20 text-freemen-400 ring-2 ring-freemen-500/30',
                    isPending && 'bg-surface-800 text-surface-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isActive ? (
                    <Circle className="w-4 h-4 fill-current" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      'text-sm font-medium truncate',
                      isActive ? 'text-white' : isCompleted ? 'text-surface-200' : 'text-surface-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-surface-500 truncate mt-0.5">{step.description}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Progress */}
      <div className="p-4 border-t border-surface-800">
        <div className="flex items-center justify-between text-xs text-surface-400 mb-2">
          <span>Progress</span>
          <span>{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-freemen-600 to-freemen-400 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
