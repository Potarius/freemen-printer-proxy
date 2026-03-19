/**
 * Wizard Stepper Component
 * Shows progress through wizard steps
 */

import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { WizardStep } from '../../types';

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'step-indicator',
                step.status === 'completed' && 'step-indicator-completed',
                step.status === 'active' && 'step-indicator-active',
                step.status === 'pending' && 'step-indicator-pending',
                step.status === 'error' && 'bg-red-600 text-white'
              )}
            >
              {step.status === 'completed' ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <div className="mt-2 text-center">
              <p
                className={clsx(
                  'text-sm font-medium',
                  step.status === 'active' ? 'text-white' : 'text-surface-400'
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-surface-500 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={clsx(
                'h-0.5 w-16 mx-4 mt-[-24px]',
                index < currentStep ? 'bg-green-600' : 'bg-surface-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
