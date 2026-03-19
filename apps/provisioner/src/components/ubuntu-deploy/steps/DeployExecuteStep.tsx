/**
 * Ubuntu Deploy - Execute Deployment Step
 */

import { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { DeploymentPackage, DeploymentStep } from '../../../types';

interface DeployExecuteStepProps {
  deploymentPackage: DeploymentPackage | null;
  onNext: () => void;
  onBack: () => void;
}

export function DeployExecuteStep({
  deploymentPackage,
  onNext,
  onBack,
}: DeployExecuteStepProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!deploymentPackage) {
    return (
      <div className="text-center py-12">
        <Terminal className="w-16 h-16 text-surface-600 mx-auto mb-4" />
        <p className="text-surface-400">No deployment package generated</p>
      </div>
    );
  }

  const toggleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const allStepsComplete = deploymentPackage.steps.every(s => completedSteps.has(s.id));

  const handleCopyScript = async () => {
    const script = deploymentPackage.scripts.find(s => s.name === 'deploy.sh');
    if (script) {
      try {
        await navigator.clipboard.writeText(script.content);
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      } catch {
        console.error('Failed to copy');
      }
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Execute Deployment
        </h2>
        <p className="text-surface-400">
          Run the commands on your target machine and track progress
        </p>
      </div>

      {/* Quick deploy option */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-freemen-500/10 to-freemen-600/10 border border-freemen-500/30 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-freemen-400" />
              Quick Deploy (Recommended)
            </h3>
            <p className="text-sm text-surface-300 mb-4">
              Copy the all-in-one script and run it on your target machine
            </p>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleCopyScript}
                leftIcon={copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copiedScript ? 'Copied!' : 'Copy Script'}
              </Button>
              <code className="text-xs text-surface-400 bg-surface-900/50 px-2 py-1 rounded">
                chmod +x deploy.sh && ./deploy.sh
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Manual step tracking */}
      <div className="mb-8">
        <h3 className="font-semibold text-white mb-4">
          Or track progress manually
        </h3>
        <p className="text-sm text-surface-400 mb-4">
          Mark each step as complete as you execute the commands
        </p>

        <div className="space-y-3">
          {deploymentPackage.steps.map((step, index) => (
            <StepTracker
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isComplete={completedSteps.has(step.id)}
              isCurrent={currentStep === step.id}
              onToggle={() => toggleStepComplete(step.id)}
              onSetCurrent={() => setCurrentStep(step.id)}
            />
          ))}
        </div>
      </div>

      {/* Progress summary */}
      <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              allStepsComplete 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-surface-800 text-surface-400'
            }`}>
              {allStepsComplete ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="font-semibold">
                  {completedSteps.size}/{deploymentPackage.steps.length}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-white">
                {allStepsComplete ? 'All steps complete!' : 'Deployment in progress'}
              </p>
              <p className="text-sm text-surface-500">
                {completedSteps.size} of {deploymentPackage.steps.length} steps completed
              </p>
            </div>
          </div>
          {allStepsComplete && (
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
              Ready to verify
            </span>
          )}
        </div>
      </div>

      {/* Help resources */}
      <div className="p-4 rounded-xl bg-surface-900/30 border border-surface-800 mb-8">
        <h4 className="font-medium text-surface-300 mb-3">Need help?</h4>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/Potarius/freemen-printer-proxy#installation"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-freemen-400 hover:text-freemen-300"
          >
            Installation Guide <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://github.com/Potarius/freemen-printer-proxy/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-freemen-400 hover:text-freemen-300"
          >
            Report an Issue <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!allStepsComplete}>
          {allStepsComplete ? 'Continue to Verify' : 'Complete all steps to continue'}
        </Button>
      </div>
    </div>
  );
}

interface StepTrackerProps {
  step: DeploymentStep;
  stepNumber: number;
  isComplete: boolean;
  isCurrent: boolean;
  onToggle: () => void;
  onSetCurrent: () => void;
}

function StepTracker({
  step,
  stepNumber,
  isComplete,
  isCurrent,
  onToggle,
  onSetCurrent,
}: StepTrackerProps) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isComplete
          ? 'bg-green-500/10 border-green-500/30'
          : isCurrent
          ? 'bg-freemen-500/10 border-freemen-500/30'
          : 'bg-surface-900/30 border-surface-800 hover:bg-surface-900/50'
      }`}
      onClick={onSetCurrent}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              isComplete
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-surface-600 hover:border-surface-400'
            }`}
          >
            {isComplete ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="text-sm text-surface-400">{stepNumber}</span>
            )}
          </button>
          <div>
            <h4 className={`font-medium ${isComplete ? 'text-green-400' : 'text-white'}`}>
              {step.title}
            </h4>
            <p className="text-sm text-surface-500">
              {step.commands.length} commands • {step.estimatedTime || '~1 min'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : isCurrent ? (
            <AlertCircle className="w-5 h-5 text-freemen-400" />
          ) : (
            <Circle className="w-5 h-5 text-surface-600" />
          )}
        </div>
      </div>
    </div>
  );
}
