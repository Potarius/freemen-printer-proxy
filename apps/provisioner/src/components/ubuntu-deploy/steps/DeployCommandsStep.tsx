/**
 * Ubuntu Deploy - Commands Review Step
 */

import { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Download,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { DeploymentPackage, DeploymentStep, DeploymentCommand } from '../../../types';

interface DeployCommandsStepProps {
  deploymentPackage: DeploymentPackage | null;
  copiedCommands: Set<string>;
  onCopyCommand: (commandId: string, command: string) => void;
  onCopyAllCommands: () => string;
  onCopyStepCommands: (stepId: string) => string;
  onDownloadScript: (scriptName: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DeployCommandsStep({
  deploymentPackage,
  copiedCommands,
  onCopyCommand,
  onCopyAllCommands,
  onCopyStepCommands,
  onDownloadScript,
  onNext,
  onBack,
}: DeployCommandsStepProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(deploymentPackage?.steps.map(s => s.id) || [])
  );
  const [copiedAll, setCopiedAll] = useState(false);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleCopyAll = async () => {
    const commands = onCopyAllCommands();
    try {
      await navigator.clipboard.writeText(commands);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleCopyStep = async (stepId: string) => {
    const commands = onCopyStepCommands(stepId);
    try {
      await navigator.clipboard.writeText(commands);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleCopyCommand = async (cmd: DeploymentCommand) => {
    try {
      await navigator.clipboard.writeText(cmd.command);
      onCopyCommand(cmd.id, cmd.command);
    } catch {
      console.error('Failed to copy');
    }
  };

  if (!deploymentPackage) {
    return (
      <div className="text-center py-12">
        <Terminal className="w-16 h-16 text-surface-600 mx-auto mb-4" />
        <p className="text-surface-400">No deployment package generated</p>
      </div>
    );
  }

  const totalCommands = deploymentPackage.steps.reduce(
    (acc, s) => acc + s.commands.length, 0
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Deployment Commands
        </h2>
        <p className="text-surface-400">
          Review and copy the commands to deploy Freemen Printer Proxy
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/50 border border-surface-800 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4 text-surface-500" />
            <span className="text-surface-400">{totalCommands} commands</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-surface-500" />
            <span className="text-surface-400">
              ~{deploymentPackage.steps.reduce((acc, s) => {
                const time = s.estimatedTime?.match(/(\d+)/)?.[1];
                return acc + (parseInt(time || '1'));
              }, 0)} minutes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDownloadScript('deploy.sh')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Script
          </Button>
          <Button
            size="sm"
            onClick={handleCopyAll}
            leftIcon={copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copiedAll ? 'Copied!' : 'Copy All'}
          </Button>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {deploymentPackage.steps.map((step, stepIndex) => (
          <StepCard
            key={step.id}
            step={step}
            stepNumber={stepIndex + 1}
            totalSteps={deploymentPackage.steps.length}
            isExpanded={expandedSteps.has(step.id)}
            copiedCommands={copiedCommands}
            onToggle={() => toggleStep(step.id)}
            onCopyStep={() => handleCopyStep(step.id)}
            onCopyCommand={handleCopyCommand}
          />
        ))}
      </div>

      {/* Tip */}
      <div className="p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20 mb-8">
        <h4 className="font-medium text-freemen-400 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-surface-300">
          You can download the complete deployment script and run it with a single command:{' '}
          <code className="px-2 py-0.5 rounded bg-surface-900 text-freemen-400">
            chmod +x deploy.sh && ./deploy.sh
          </code>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue to Deploy
        </Button>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: DeploymentStep;
  stepNumber: number;
  totalSteps: number;
  isExpanded: boolean;
  copiedCommands: Set<string>;
  onToggle: () => void;
  onCopyStep: () => void;
  onCopyCommand: (cmd: DeploymentCommand) => void;
}

function StepCard({
  step,
  stepNumber,
  isExpanded,
  copiedCommands,
  onToggle,
  onCopyStep,
  onCopyCommand,
}: StepCardProps) {
  const [stepCopied, setStepCopied] = useState(false);

  const handleCopyStep = () => {
    onCopyStep();
    setStepCopied(true);
    setTimeout(() => setStepCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-surface-800 overflow-hidden">
      {/* Step header */}
      <div
        className="flex items-center justify-between p-4 bg-surface-900/50 cursor-pointer hover:bg-surface-900/70 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-surface-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-surface-500" />
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-freemen-500/20 text-freemen-400 font-semibold flex items-center justify-center text-sm">
            {stepNumber}
          </div>
          <div>
            <h3 className="font-semibold text-white">{step.title}</h3>
            <p className="text-sm text-surface-500">{step.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {step.estimatedTime && (
            <span className="text-xs text-surface-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {step.estimatedTime}
            </span>
          )}
          <span className="text-xs text-surface-500">
            {step.commands.length} commands
          </span>
          <button
            onClick={handleCopyStep}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
            title="Copy all commands in this step"
          >
            {stepCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Commands */}
      {isExpanded && (
        <div className="border-t border-surface-800 bg-surface-950 p-4 space-y-3">
          {step.commands.map((cmd) => (
            <CommandRow
              key={cmd.id}
              command={cmd}
              isCopied={copiedCommands.has(cmd.id)}
              onCopy={() => onCopyCommand(cmd)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommandRowProps {
  command: DeploymentCommand;
  isCopied: boolean;
  onCopy: () => void;
}

function CommandRow({ command, isCopied, onCopy }: CommandRowProps) {
  return (
    <div className={`rounded-lg border ${
      command.dangerous 
        ? 'bg-red-500/5 border-red-500/20' 
        : command.optional
        ? 'bg-surface-900/30 border-surface-800'
        : 'bg-surface-900/50 border-surface-800'
    }`}>
      <div className="flex items-start justify-between p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-surface-300">{command.label}</span>
            {command.optional && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-surface-700 text-surface-400">
                Optional
              </span>
            )}
            {command.dangerous && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Careful
              </span>
            )}
          </div>
          <code className="block text-sm text-freemen-400 font-mono break-all">
            {command.command}
          </code>
          {command.description && (
            <p className="text-xs text-surface-500 mt-1">{command.description}</p>
          )}
        </div>
        <button
          onClick={onCopy}
          className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0 ml-2"
          title="Copy command"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
