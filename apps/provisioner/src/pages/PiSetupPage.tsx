/**
 * Raspberry Pi Setup Page
 * Guided wizard for headless Pi configuration
 */

import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { usePiSetupStore, PI_SETUP_STEPS } from '../stores/pi-setup-store';
import {
  PiIntroStep,
  PiFlashStep,
  PiConfigStep,
  PiNetworkStep,
  PiFilesStep,
  PiVerifyStep,
  PiCompleteStep,
} from '../components/pi-setup/steps';

export function PiSetupPage() {
  const navigate = useNavigate();
  
  const {
    config,
    setupPackage,
    currentStep,
    validationErrors,
    setHostname,
    setUsername,
    setPassword,
    setWifi,
    clearWifi,
    generatePackage,
    downloadFile,
    downloadAllFiles,
    nextStep,
    prevStep,
    goToStep,
    reset,
  } = usePiSetupStore();

  const handleBack = () => {
    if (currentStep === 0) {
      navigate('/');
    } else {
      prevStep();
    }
  };

  const handleStartProvisioning = () => {
    // Navigate to main provisioning wizard with Pi selected
    navigate('/wizard');
  };

  const handleNewSetup = () => {
    reset();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PiIntroStep onNext={nextStep} />;
      
      case 1:
        return <PiFlashStep onNext={nextStep} onBack={handleBack} />;
      
      case 2:
        return (
          <PiConfigStep
            hostname={config.hostname}
            username={config.username}
            password={config.password}
            onHostnameChange={setHostname}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            validationErrors={validationErrors}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 3:
        return (
          <PiNetworkStep
            wifiSsid={config.wifiSsid || ''}
            wifiPassword={config.wifiPassword || ''}
            wifiCountry={config.wifiCountry}
            onWifiChange={setWifi}
            onClearWifi={clearWifi}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 4:
        return (
          <PiFilesStep
            setupPackage={setupPackage}
            config={config}
            onGenerate={generatePackage}
            onDownloadFile={downloadFile}
            onDownloadAll={downloadAllFiles}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      
      case 5:
        return (
          <PiVerifyStep
            config={config}
            onNext={nextStep}
            onBack={prevStep}
            onEdit={goToStep}
          />
        );
      
      case 6:
        return (
          <PiCompleteStep
            config={config}
            onStartProvisioning={handleStartProvisioning}
            onNewSetup={handleNewSetup}
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
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h1 className="font-semibold text-white">Raspberry Pi Setup</h1>
                <p className="text-xs text-surface-500">Headless Configuration</p>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {PI_SETUP_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < currentStep
                    ? 'bg-green-500'
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
                Step {currentStep + 1} of {PI_SETUP_STEPS.length}
              </p>
              <p className="font-medium text-white">
                {PI_SETUP_STEPS[currentStep]?.title}
              </p>
            </div>
            <p className="text-sm text-surface-400">
              {PI_SETUP_STEPS[currentStep]?.description}
            </p>
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
