/**
 * Ubuntu Deployment Page
 * Guided wizard for Ubuntu/Linux deployment
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUbuntuDeployStore, UBUNTU_DEPLOY_STEPS } from '../stores/ubuntu-deploy-store';
import {
  DeployModeStep,
  DeployConfigStep,
  DeployCommandsStep,
  DeployExecuteStep,
  DeployCompleteStep,
} from '../components/ubuntu-deploy/steps';

export function UbuntuDeployPage() {
  const navigate = useNavigate();
  
  const {
    mode,
    config,
    deploymentPackage,
    currentStep,
    copiedCommands,
    setMode,
    setConfig,
    generatePackage,
    markCommandCopied,
    copyAllCommands,
    copyStepCommands,
    downloadScript,
    nextStep,
    prevStep,
    goToStep,
    reset,
  } = useUbuntuDeployStore();

  // Generate package when moving to commands step
  useEffect(() => {
    if (currentStep === 2 && !deploymentPackage && mode) {
      generatePackage();
    }
  }, [currentStep, deploymentPackage, mode, generatePackage]);

  const handleBack = () => {
    if (currentStep === 0) {
      navigate('/');
    } else {
      prevStep();
    }
  };

  const handleModeSelect = (selectedMode: typeof mode) => {
    if (selectedMode) {
      setMode(selectedMode);
    }
  };

  const handleConfigNext = () => {
    generatePackage();
    nextStep();
  };

  const handleCopyCommand = (commandId: string, _command: string) => {
    markCommandCopied(commandId);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <DeployModeStep
            selectedMode={mode}
            onSelectMode={handleModeSelect}
            onNext={nextStep}
          />
        );
      
      case 1:
        return mode ? (
          <DeployConfigStep
            mode={mode}
            config={config}
            onConfigChange={setConfig}
            onNext={handleConfigNext}
            onBack={handleBack}
          />
        ) : null;
      
      case 2:
        return (
          <DeployCommandsStep
            deploymentPackage={deploymentPackage}
            copiedCommands={copiedCommands}
            onCopyCommand={handleCopyCommand}
            onCopyAllCommands={copyAllCommands}
            onCopyStepCommands={copyStepCommands}
            onDownloadScript={downloadScript}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 3:
        return (
          <DeployExecuteStep
            deploymentPackage={deploymentPackage}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 4:
        return (
          <DeployCompleteStep
            deploymentPackage={deploymentPackage}
            config={config}
            onNewDeployment={reset}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-surface-800 bg-surface-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <div className="h-6 w-px bg-surface-700" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h1 className="font-semibold text-white">Ubuntu/Linux Deploy</h1>
                <p className="text-xs text-surface-500">
                  {mode ? UBUNTU_DEPLOY_STEPS[currentStep]?.description : 'Deployment Wizard'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {UBUNTU_DEPLOY_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index < currentStep && goToStep(index)}
                disabled={index > currentStep}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < currentStep
                    ? 'bg-green-500 cursor-pointer hover:bg-green-400'
                    : index === currentStep
                    ? 'bg-freemen-500'
                    : 'bg-surface-700'
                }`}
                title={step.title}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Step info bar */}
      <div className="flex-shrink-0 border-b border-surface-800 bg-surface-900/30">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-surface-500">
                Step {currentStep + 1} of {UBUNTU_DEPLOY_STEPS.length}
              </p>
              <p className="font-medium text-white">
                {UBUNTU_DEPLOY_STEPS[currentStep]?.title}
              </p>
            </div>
            {mode && (
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <span className="px-2 py-1 rounded-full bg-surface-800 text-surface-300">
                  {mode === 'fresh' && '🚀 Fresh Install'}
                  {mode === 'update' && '🔄 Update'}
                  {mode === 'reprovision' && '⚙️ Reprovision'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
