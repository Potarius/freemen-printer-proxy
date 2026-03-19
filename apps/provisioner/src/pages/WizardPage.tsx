/**
 * Premium Wizard Page
 * Orchestrates the entire provisioning flow
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { WizardSidebar, WizardStepConfig } from '../components/wizard/WizardSidebar';
import { Button } from '../components/ui/Button';
import {
  WelcomeStep,
  TargetStep,
  AuthStep,
  ZoneStep,
  HostnameStep,
  DeviceStep,
  SummaryStep,
  ProvisionStep,
  SuccessStep,
  defaultProvisionTasks,
} from '../components/wizard/steps';
import { TargetPlatform, CloudflareZone } from '../types';
import { Rocket, Cpu, KeyRound, Globe, Link, Settings, ClipboardList, Cloud, CheckCircle } from 'lucide-react';

// Wizard step configuration
const wizardSteps: WizardStepConfig[] = [
  { id: 'welcome', title: 'Welcome', description: 'Get started', icon: <Rocket className="w-4 h-4" /> },
  { id: 'target', title: 'Platform', description: 'Select target', icon: <Cpu className="w-4 h-4" /> },
  { id: 'auth', title: 'Authentication', description: 'Cloudflare API', icon: <KeyRound className="w-4 h-4" /> },
  { id: 'zone', title: 'Domain', description: 'Select zone', icon: <Globe className="w-4 h-4" /> },
  { id: 'hostname', title: 'Access', description: 'Configure URL', icon: <Link className="w-4 h-4" /> },
  { id: 'device', title: 'Device', description: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'summary', title: 'Review', description: 'Confirm setup', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'provision', title: 'Provision', description: 'Create resources', icon: <Cloud className="w-4 h-4" /> },
  { id: 'success', title: 'Complete', description: 'All done', icon: <CheckCircle className="w-4 h-4" /> },
];

// Mock zones for demo
const mockZones: CloudflareZone[] = [
  { id: 'zone_abc123', name: 'example.com', status: 'active' },
  { id: 'zone_def456', name: 'mycompany.io', status: 'active' },
  { id: 'zone_ghi789', name: 'dev.internal', status: 'pending' },
];

export function WizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('raspberry-pi');
  const [apiToken, setApiToken] = useState('');
  const [isTokenValidated, setIsTokenValidated] = useState(false);
  const [selectedZone, setSelectedZone] = useState<CloudflareZone | null>(null);
  const [hostname, setHostname] = useState('printer');
  const [tunnelName, setTunnelName] = useState('freemen-printer-proxy');
  const [deviceName, setDeviceName] = useState('Office Printer Proxy');
  const [printerIp, setPrinterIp] = useState('');
  const [printerPort, setPrinterPort] = useState('9100');
  
  // Loading states
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [provisionTasks, setProvisionTasks] = useState(defaultProvisionTasks);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [deviceId, setDeviceId] = useState('');

  // Validation
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Target
        return !!targetPlatform;
      case 2: // Auth
        return isTokenValidated;
      case 3: // Zone
        return !!selectedZone;
      case 4: // Hostname
        return hostname.length >= 2 && tunnelName.length >= 3;
      case 5: // Device
        return deviceName.length >= 2;
      default:
        return true;
    }
  }, [targetPlatform, isTokenValidated, selectedZone, hostname, tunnelName, deviceName]);

  const canProceed = validateStep(currentStep);

  // Navigation
  const handleNext = useCallback(async () => {
    if (currentStep === 6) {
      // Start provisioning
      await runProvisioning();
    } else if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Mock token validation
  const handleValidateToken = async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (apiToken.length > 10) {
      setIsTokenValidated(true);
      return true;
    }
    return false;
  };

  // Mock zone refresh
  const handleRefreshZones = async () => {
    setIsLoadingZones(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoadingZones(false);
  };

  // Mock provisioning
  const runProvisioning = async () => {
    setCurrentStep(7); // Move to provision step
    const tasks = [...defaultProvisionTasks];
    setProvisionTasks(tasks);
    
    for (let i = 0; i < tasks.length; i++) {
      setCurrentTaskId(tasks[i].id);
      tasks[i].status = 'running';
      setProvisionTasks([...tasks]);
      
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
      
      tasks[i].status = 'success';
      tasks[i].message = 'Completed successfully';
      setProvisionTasks([...tasks]);
    }
    
    setCurrentTaskId(null);
    setDeviceId(`fpp-${Date.now().toString(36)}`);
    setCurrentStep(8); // Move to success step
  };

  // Actions for success step
  const handleDownload = () => {
    console.log('Downloading configuration package...');
  };

  const handleOpenFolder = () => {
    console.log('Opening output folder...');
  };

  const handleNewDevice = () => {
    setCurrentStep(0);
    setApiToken('');
    setIsTokenValidated(false);
    setSelectedZone(null);
    setHostname('printer');
    setTunnelName('freemen-printer-proxy');
    setDeviceName('Office Printer Proxy');
    setProvisionTasks(defaultProvisionTasks);
    setDeviceId('');
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <TargetStep
            value={targetPlatform}
            onChange={setTargetPlatform}
          />
        );
      case 2:
        return (
          <AuthStep
            value={apiToken}
            onChange={setApiToken}
            onValidate={handleValidateToken}
            isValidated={isTokenValidated}
          />
        );
      case 3:
        return (
          <ZoneStep
            zones={mockZones}
            selectedZone={selectedZone}
            onSelect={setSelectedZone}
            onRefresh={handleRefreshZones}
            isLoading={isLoadingZones}
          />
        );
      case 4:
        return (
          <HostnameStep
            hostname={hostname}
            tunnelName={tunnelName}
            zoneName={selectedZone?.name || 'example.com'}
            onHostnameChange={setHostname}
            onTunnelNameChange={setTunnelName}
          />
        );
      case 5:
        return (
          <DeviceStep
            deviceName={deviceName}
            printerIp={printerIp}
            printerPort={printerPort}
            onDeviceNameChange={setDeviceName}
            onPrinterIpChange={setPrinterIp}
            onPrinterPortChange={setPrinterPort}
          />
        );
      case 6:
        return (
          <SummaryStep
            platform={targetPlatform}
            zone={selectedZone}
            hostname={hostname}
            tunnelName={tunnelName}
            deviceName={deviceName}
          />
        );
      case 7:
        return (
          <ProvisionStep
            tasks={provisionTasks}
            currentTask={currentTaskId}
            error={provisionError}
          />
        );
      case 8:
        return (
          <SuccessStep
            hostname={`${hostname}.${selectedZone?.name || 'example.com'}`}
            tunnelName={tunnelName}
            deviceId={deviceId}
            onDownload={handleDownload}
            onOpenFolder={handleOpenFolder}
            onNewDevice={handleNewDevice}
          />
        );
      default:
        return null;
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === wizardSteps.length - 1;
  const isProvisioningOrComplete = currentStep >= 7;

  return (
    <div className="flex h-screen bg-surface-950">
      {/* Sidebar */}
      <WizardSidebar
        steps={wizardSteps}
        currentStep={currentStep}
        onStepClick={isProvisioningOrComplete ? undefined : setCurrentStep}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-14 border-b border-surface-800 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-white">
            {wizardSteps[currentStep]?.title}
          </h1>
          {!isProvisioningOrComplete && (
            <button
              onClick={handleCancel}
              className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        {/* Bottom navigation */}
        {!isProvisioningOrComplete && currentStep > 0 && (
          <div className="h-20 border-t border-surface-800 flex items-center justify-between px-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirstStep}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {currentStep === 6 ? 'Start Provisioning' : 'Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
