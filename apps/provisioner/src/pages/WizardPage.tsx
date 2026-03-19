/**
 * Premium Wizard Page
 * Orchestrates the entire provisioning flow with real Cloudflare integration
 */

import { useState, useCallback, useEffect } from 'react';
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
import type { TargetPlatform, DevicePackage, DevicePackageFile } from '../types';
import { useCloudflareStore } from '../stores/cloudflare-store';
import { usePackageStore, createPackageConfig } from '../stores/package-store';
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

export function WizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Cloudflare store
  const {
    apiToken,
    setApiToken,
    validateToken,
    isTokenValidated,
    isValidatingToken,
    zones,
    selectedZone,
    selectZone,
    loadZones,
    isLoadingZones,
    selectedAccount,
    accounts,
    selectAccount,
    tunnel,
    tunnelToken,
    createTunnel,
    createDNSRecord,
    configureTunnelIngress,
    getTunnelToken,
    error: cloudflareError,
    clearError,
    reset: resetCloudflare,
  } = useCloudflareStore();

  // Package store
  const {
    package: devicePackage,
    writeResult,
    generatePackage,
    writePackage,
    downloadFile,
    downloadPackage,
    openOutputFolder,
    copyDeploymentSteps,
    clearPackage,
  } = usePackageStore();
  
  // Local form state
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('raspberry-pi');
  const [hostname, setHostname] = useState('printer');
  const [tunnelName, setTunnelName] = useState('freemen-printer-proxy');
  const [deviceName, setDeviceName] = useState('Office Printer Proxy');
  const [printerIp, setPrinterIp] = useState('');
  const [printerPort, setPrinterPort] = useState('9100');
  
  // Provisioning state
  const [provisionTasks, setProvisionTasks] = useState(defaultProvisionTasks);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [deviceId, setDeviceId] = useState('');

  // Auto-select first account if only one
  useEffect(() => {
    if (accounts.length === 1 && !selectedAccount) {
      selectAccount(accounts[0]);
    }
  }, [accounts, selectedAccount, selectAccount]);

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
    resetCloudflare();
    navigate('/');
  }, [navigate, resetCloudflare]);

  // Real token validation using Cloudflare store
  const handleValidateToken = async (): Promise<boolean> => {
    return await validateToken();
  };

  // Refresh zones from Cloudflare
  const handleRefreshZones = async () => {
    await loadZones(selectedAccount?.id);
  };

  // Real provisioning with Cloudflare API
  const runProvisioning = async () => {
    setCurrentStep(7); // Move to provision step
    const tasks = [...defaultProvisionTasks];
    setProvisionTasks(tasks);
    setProvisionError(undefined);

    const fullHostname = `${hostname}.${selectedZone?.name}`;
    const serviceUrl = 'http://localhost:6500'; // Default printer proxy port

    try {
      // Task 1: Create Tunnel
      setCurrentTaskId('tunnel-create');
      tasks[0].status = 'running';
      setProvisionTasks([...tasks]);

      const createdTunnel = await createTunnel(tunnelName);
      if (!createdTunnel) {
        throw new Error(cloudflareError?.message || 'Failed to create tunnel');
      }

      tasks[0].status = 'success';
      tasks[0].message = `Tunnel "${tunnelName}" created`;
      setProvisionTasks([...tasks]);

      // Task 2: Configure Ingress
      setCurrentTaskId('tunnel-config');
      tasks[1].status = 'running';
      setProvisionTasks([...tasks]);

      const ingressConfigured = await configureTunnelIngress(fullHostname, serviceUrl);
      if (!ingressConfigured) {
        throw new Error(cloudflareError?.message || 'Failed to configure tunnel ingress');
      }

      tasks[1].status = 'success';
      tasks[1].message = 'Ingress rules configured';
      setProvisionTasks([...tasks]);

      // Task 3: Create DNS Record
      setCurrentTaskId('dns-record');
      tasks[2].status = 'running';
      setProvisionTasks([...tasks]);

      const dnsRecord = await createDNSRecord(hostname);
      if (!dnsRecord) {
        throw new Error(cloudflareError?.message || 'Failed to create DNS record');
      }

      tasks[2].status = 'success';
      tasks[2].message = `DNS record for ${fullHostname} created`;
      setProvisionTasks([...tasks]);

      // Task 4: Get Tunnel Token
      setCurrentTaskId('config-generate');
      tasks[3].status = 'running';
      setProvisionTasks([...tasks]);

      const token = await getTunnelToken();
      if (!token) {
        throw new Error(cloudflareError?.message || 'Failed to get tunnel token');
      }

      tasks[3].status = 'success';
      tasks[3].message = 'Configuration files generated';
      setProvisionTasks([...tasks]);

      // Task 5: Create Package (local operation)
      setCurrentTaskId('package-create');
      tasks[4].status = 'running';
      setProvisionTasks([...tasks]);

      // Generate device package with all config files
      const generatedDeviceId = `fpp-${Date.now().toString(36)}`;
      const packageConfig = createPackageConfig(
        generatedDeviceId,
        deviceName,
        targetPlatform,
        fullHostname,
        tunnelName,
        token,
        createdTunnel.id,
        selectedAccount!.id,
        selectedZone!.id,
        selectedZone!.name,
        printerIp || undefined,
        printerPort ? parseInt(printerPort, 10) : undefined
      );

      const pkg = generatePackage(packageConfig);
      
      // Write package to disk
      const writeResult = await writePackage();
      
      if (!writeResult?.success) {
        console.warn('Package write had issues:', writeResult?.errors);
      }

      tasks[4].status = 'success';
      tasks[4].message = `Package created: ${pkg.files.length} files`;
      setProvisionTasks([...tasks]);

      // Success
      setCurrentTaskId(null);
      setDeviceId(generatedDeviceId);
      setCurrentStep(8);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Provisioning failed';
      setProvisionError(errorMessage);
      
      // Mark current task as failed
      const currentIndex = tasks.findIndex(t => t.id === currentTaskId);
      if (currentIndex >= 0) {
        tasks[currentIndex].status = 'error';
        tasks[currentIndex].message = errorMessage;
        setProvisionTasks([...tasks]);
      }
      setCurrentTaskId(null);
    }
  };

  // Actions for success step
  const handleDownload = async () => {
    await downloadPackage();
  };

  const handleDownloadFile = (file: DevicePackageFile) => {
    downloadFile(file);
  };

  const handleOpenFolder = async () => {
    await openOutputFolder();
  };

  const handleCopySteps = async () => {
    await copyDeploymentSteps();
  };

  const handleNewDevice = () => {
    resetCloudflare();
    clearPackage();
    setCurrentStep(0);
    setHostname('printer');
    setTunnelName('freemen-printer-proxy');
    setDeviceName('Office Printer Proxy');
    setProvisionTasks(defaultProvisionTasks);
    setDeviceId('');
    setProvisionError(undefined);
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
            zones={zones}
            selectedZone={selectedZone}
            onSelect={selectZone}
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
            devicePackage={devicePackage}
            outputPath={writeResult?.outputPath}
            onDownload={handleDownload}
            onDownloadFile={handleDownloadFile}
            onOpenFolder={handleOpenFolder}
            onCopySteps={handleCopySteps}
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
