/**
 * Premium Wizard Page
 * Orchestrates the entire provisioning flow with real Cloudflare integration.
 *
 * Raspberry Pi flow (end-to-end):
 *   Platform → Cloudflare → Device → Pi Setup → Network →
 *   Summary → Provision → Download OS → Flash + Write Config → Complete
 *
 * Other platforms:
 *   Platform → Cloudflare → Device → Summary → Provision → Complete
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Download, HardDrive, User, Wifi, Key } from 'lucide-react';
import { WizardSidebar, WizardStepConfig } from '../components/wizard/WizardSidebar';
import { Button } from '../components/ui/Button';
import {
  WelcomeStep,
  TargetStep,
  CloudflareFlowStep,
  DeviceStep,
  SummaryStep,
  ProvisionStep,
  SuccessStep,
  ApiKeyStep,
  defaultProvisionTasks,
} from '../components/wizard/steps';
import {
  PiDownloadStep,
  PiFlashStep,
  PiConfigStep,
  PiNetworkStep,
} from '../components/pi-setup/steps';
import type { TargetPlatform, DevicePackageFile } from '../types';
import { useCloudflareStore } from '../stores/cloudflare-store';
import { usePackageStore, createPackageConfig } from '../stores/package-store';
import { Rocket, Cpu, Settings, ClipboardList, Cloud, CheckCircle } from 'lucide-react';

// Steps that render their own Back/Continue — wizard footer hidden for these.
const SELF_MANAGED_STEP_IDS = new Set([
  'welcome',
  'download',
  'flash',
  'pi-config',
  'pi-network',
  'provision',
  'api-key',
  'success',
]);

export function WizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // ── Cloudflare store ──────────────────────────────────────────────────────
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
    isLoadingAccounts,
    createTunnel,
    createDNSRecord,
    configureTunnelIngress,
    getTunnelToken,
    tunnel,
    error: cloudflareError,
    clearError,
    reset: resetCloudflare,
    tunnelNameValidation,
    hostnameValidation,
    isValidatingTunnelName,
    isValidatingHostname,
    validateTunnelName,
    validateHostname,
    useExistingTunnel,
    setUseExistingTunnel,
  } = useCloudflareStore();

  // ── Package store ─────────────────────────────────────────────────────────
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

  // ── Cloudflare / device form state ────────────────────────────────────────
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('raspberry-pi');
  const [hostname, setHostname] = useState('');
  const [tunnelName, setTunnelName] = useState('');
  const [hostnameConfirmed, setHostnameConfirmed] = useState(false);
  const [deviceName, setDeviceName] = useState('Office Printer Proxy');
  const [printerIp, setPrinterIp] = useState('');
  const [printerPort, setPrinterPort] = useState('9100');

  // ── Pi-specific state ─────────────────────────────────────────────────────
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [piHostname, setPiHostname] = useState('freemen-pi');
  const [piUsername, setPiUsername] = useState('freemen');
  const [piPassword, setPiPassword] = useState('');
  const [piWifiSsid, setPiWifiSsid] = useState('');
  const [piWifiPassword, setPiWifiPassword] = useState('');
  const [piWifiCountry, setPiWifiCountry] = useState('US');

  // ── Provisioning state ────────────────────────────────────────────────────
  const [provisionTasks, setProvisionTasks] = useState(defaultProvisionTasks);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | undefined>();
  const [deviceId, setDeviceId] = useState('');
  const [tunnelToken, setTunnelToken] = useState('');
  const [proxyApiKey, setProxyApiKey] = useState('');

  // ── Dynamic step list ─────────────────────────────────────────────────────
  // For Raspberry Pi:
  //   welcome → target → cloudflare → device → pi-config → pi-network →
  //   summary → provision → download → flash → success
  //
  // For other platforms:
  //   welcome → target → cloudflare → device → summary → provision → success
  const steps = useMemo((): WizardStepConfig[] => {
    const base: WizardStepConfig[] = [
      { id: 'welcome',    title: 'Welcome',    description: 'Get started',             icon: <Rocket className="w-4 h-4" /> },
      { id: 'target',     title: 'Platform',   description: 'Select target',            icon: <Cpu className="w-4 h-4" /> },
      { id: 'cloudflare', title: 'Cloudflare', description: 'Connect & configure',      icon: <Cloud className="w-4 h-4" /> },
      { id: 'device',     title: 'Device',     description: 'Settings',                 icon: <Settings className="w-4 h-4" /> },
    ];

    if (targetPlatform === 'raspberry-pi') {
      base.push(
        { id: 'pi-config',  title: 'Pi Setup',      description: 'Hostname & credentials',   icon: <User className="w-4 h-4" /> },
        { id: 'pi-network', title: 'Network',        description: 'WiFi or Ethernet',         icon: <Wifi className="w-4 h-4" /> },
      );
    }

    base.push(
      { id: 'summary',   title: 'Review',     description: 'Confirm setup',               icon: <ClipboardList className="w-4 h-4" /> },
      { id: 'provision', title: 'Provision',  description: 'Create Cloudflare resources',  icon: <Cloud className="w-4 h-4" /> },
      { id: 'api-key',   title: 'API Key',    description: 'Save your proxy API key',      icon: <Key className="w-4 h-4" /> },
    );

    if (targetPlatform === 'raspberry-pi') {
      base.push(
        { id: 'download', title: 'Download OS',   description: 'Download Raspberry Pi OS', icon: <Download className="w-4 h-4" /> },
        { id: 'flash',    title: 'Flash SD Card', description: 'Write OS + config to card', icon: <HardDrive className="w-4 h-4" /> },
      );
    }

    base.push(
      { id: 'success', title: 'Complete', description: 'All done', icon: <CheckCircle className="w-4 h-4" /> },
    );

    return base;
  }, [targetPlatform]);

  const currentStepId = steps[currentStep]?.id ?? '';
  const hideBottomNav = SELF_MANAGED_STEP_IDS.has(currentStepId);
  const isProvisioningOrComplete = currentStepId === 'provision' || currentStepId === 'success';

  // Auto-select first account if only one
  useEffect(() => {
    if (accounts.length === 1 && !selectedAccount) {
      selectAccount(accounts[0]);
    }
  }, [accounts, selectedAccount, selectAccount]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep = useCallback((stepIndex: number): boolean => {
    const stepId = steps[stepIndex]?.id;
    switch (stepId) {
      case 'target':
        return !!targetPlatform;
      case 'cloudflare':
        return (
          isTokenValidated &&
          !!selectedAccount &&
          !!selectedZone &&
          hostname.length >= 2 &&
          tunnelName.length >= 3 &&
          hostnameConfirmed
        );
      case 'device':
        return deviceName.length >= 2;
      default:
        return true;
    }
  }, [steps, targetPlatform, isTokenValidated, selectedAccount, selectedZone, hostname, tunnelName, hostnameConfirmed, deviceName]);

  const canProceed = validateStep(currentStep);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1)), [steps.length]);
  const goBack = useCallback(() => setCurrentStep((s) => Math.max(s - 1, 0)), []);

  const handleNext = useCallback(async () => {
    if (currentStepId === 'summary') {
      await runProvisioning();
    } else {
      goNext();
    }
  }, [currentStepId, goNext]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = useCallback(() => {
    if (currentStep > 0) goBack();
  }, [currentStep, goBack]);

  const handleCancel = useCallback(() => {
    resetCloudflare();
    navigate('/');
  }, [navigate, resetCloudflare]);

  // ── Cloudflare helpers ────────────────────────────────────────────────────
  const handleValidateToken = async (): Promise<boolean> => validateToken();

  const handleRefreshZones = async () => {
    await loadZones(selectedAccount?.id);
  };

  const handleHostnameChange = (v: string) => { setHostname(v); setHostnameConfirmed(false); };
  const handleTunnelNameChange = (v: string) => { setTunnelName(v); setHostnameConfirmed(false); };
  const handleConfirmHostname = () => setHostnameConfirmed(true);

  // ── Provisioning ──────────────────────────────────────────────────────────
  const runProvisioning = async () => {
    const provisionIdx = steps.findIndex((s) => s.id === 'provision');
    const nextAfterProvision = provisionIdx + 1; // download (Pi) or success (others)

    setCurrentStep(provisionIdx);
    const tasks = [...defaultProvisionTasks];
    setProvisionTasks(tasks);
    setProvisionError(undefined);

    const fullHostname = `${hostname}.${selectedZone?.name}`;
    const serviceUrl = 'http://localhost:6500';

    try {
      // Task 1: Create/reuse tunnel
      setCurrentTaskId('tunnel-create');
      tasks[0].status = 'running';
      setProvisionTasks([...tasks]);

      let createdTunnel = tunnel;

      if (useExistingTunnel && tunnel) {
        tasks[0].status = 'success';
        tasks[0].message = `Using existing tunnel "${tunnel.name}"`;
        setProvisionTasks([...tasks]);
      } else {
        createdTunnel = await createTunnel(tunnelName);
        if (!createdTunnel) throw new Error(cloudflareError?.message || 'Failed to create tunnel');
        tasks[0].status = 'success';
        tasks[0].message = `Tunnel "${tunnelName}" created`;
        setProvisionTasks([...tasks]);
      }

      if (!createdTunnel) throw new Error('No tunnel available');

      // Task 2: Configure ingress
      setCurrentTaskId('tunnel-config');
      tasks[1].status = 'running';
      setProvisionTasks([...tasks]);
      if (!await configureTunnelIngress(fullHostname, serviceUrl)) {
        throw new Error(cloudflareError?.message || 'Failed to configure tunnel ingress');
      }
      tasks[1].status = 'success';
      tasks[1].message = 'Ingress rules configured';
      setProvisionTasks([...tasks]);

      // Task 3: Create DNS record
      setCurrentTaskId('dns-record');
      tasks[2].status = 'running';
      setProvisionTasks([...tasks]);
      if (!await createDNSRecord(hostname)) {
        throw new Error(cloudflareError?.message || 'Failed to create DNS record');
      }
      tasks[2].status = 'success';
      tasks[2].message = `DNS record for ${fullHostname} created`;
      setProvisionTasks([...tasks]);

      // Task 4: Get tunnel token
      setCurrentTaskId('config-generate');
      tasks[3].status = 'running';
      setProvisionTasks([...tasks]);
      const token = await getTunnelToken();
      if (!token) throw new Error(cloudflareError?.message || 'Failed to get tunnel token');
      setTunnelToken(token);
      tasks[3].status = 'success';
      tasks[3].message = 'Tunnel token obtained';
      setProvisionTasks([...tasks]);

      // Task 5: Generate device package
      setCurrentTaskId('package-create');
      tasks[4].status = 'running';
      setProvisionTasks([...tasks]);

      // Generate a unique API key for this device
      const keyBytes = new Uint8Array(24);
      crypto.getRandomValues(keyBytes);
      const generatedApiKey = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      setProxyApiKey(generatedApiKey);

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
        generatedApiKey,
        printerIp || undefined,
        printerPort ? parseInt(printerPort, 10) : undefined,
      );

      const pkg = generatePackage(packageConfig);
      const wr = await writePackage();
      if (!wr?.success) console.warn('Package write issues:', wr?.errors);

      tasks[4].status = 'success';
      tasks[4].message = `Package created: ${pkg.files.length} files`;
      setProvisionTasks([...tasks]);

      setCurrentTaskId(null);
      setDeviceId(generatedDeviceId);

      // Move to next step (download for Pi, success for others)
      setTimeout(() => setCurrentStep(nextAfterProvision), 1200);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Provisioning failed';
      setProvisionError(msg);
      const idx = tasks.findIndex((t) => t.id === currentTaskId);
      if (idx >= 0) { tasks[idx].status = 'error'; tasks[idx].message = msg; setProvisionTasks([...tasks]); }
      setCurrentTaskId(null);
    }
  };

  // ── API key regeneration ──────────────────────────────────────────────────
  const handleRegenerateApiKey = () => {
    const keyBytes = new Uint8Array(24);
    crypto.getRandomValues(keyBytes);
    const newKey = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setProxyApiKey(newKey);
  };

  // ── Success step actions ───────────────────────────────────────────────────
  const handleDownload = async () => downloadPackage();
  const handleDownloadFile = (file: DevicePackageFile) => downloadFile(file);
  const handleOpenFolder = async () => openOutputFolder();
  const handleCopySteps = async () => copyDeploymentSteps();

  const handleNewDevice = () => {
    resetCloudflare();
    clearPackage();
    setCurrentStep(0);
    setHostname('');
    setTunnelName('');
    setHostnameConfirmed(false);
    setDeviceName('Office Printer Proxy');
    setProvisionTasks(defaultProvisionTasks);
    setDeviceId('');
    setTunnelToken('');
    setProxyApiKey('');
    setProvisionError(undefined);
    setImagePath(null);
    setPiHostname('freemen-pi');
    setPiUsername('freemen');
    setPiPassword('');
    setPiWifiSsid('');
    setPiWifiPassword('');
    setPiWifiCountry('US');
  };

  // ── Step content ──────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStepId) {
      case 'welcome':
        return <WelcomeStep onNext={goNext} />;

      case 'target':
        return (
          <TargetStep
            value={targetPlatform}
            onChange={(p) => { setTargetPlatform(p); setCurrentStep((s) => Math.min(s, 1)); }}
          />
        );

      case 'cloudflare':
        return (
          <CloudflareFlowStep
            apiToken={apiToken}
            onApiTokenChange={setApiToken}
            onValidateToken={handleValidateToken}
            isTokenValidated={isTokenValidated}
            isValidatingToken={isValidatingToken}
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelectAccount={selectAccount}
            isLoadingAccounts={isLoadingAccounts}
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={selectZone}
            onRefreshZones={handleRefreshZones}
            isLoadingZones={isLoadingZones}
            hostname={hostname}
            onHostnameChange={handleHostnameChange}
            tunnelName={tunnelName}
            onTunnelNameChange={handleTunnelNameChange}
            hostnameConfirmed={hostnameConfirmed}
            onConfirmHostname={handleConfirmHostname}
            tunnelNameValidation={tunnelNameValidation}
            hostnameValidation={hostnameValidation}
            isValidatingTunnelName={isValidatingTunnelName}
            isValidatingHostname={isValidatingHostname}
            onValidateTunnelName={validateTunnelName}
            onValidateHostname={validateHostname}
            useExistingTunnel={useExistingTunnel}
            onSetUseExistingTunnel={setUseExistingTunnel}
            error={cloudflareError}
            onClearError={clearError}
          />
        );

      case 'device':
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

      case 'pi-config':
        return (
          <PiConfigStep
            hostname={piHostname}
            username={piUsername}
            password={piPassword}
            onHostnameChange={setPiHostname}
            onUsernameChange={setPiUsername}
            onPasswordChange={setPiPassword}
            validationErrors={[]}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'pi-network':
        return (
          <PiNetworkStep
            wifiSsid={piWifiSsid}
            wifiPassword={piWifiPassword}
            wifiCountry={piWifiCountry}
            onWifiChange={(ssid, pwd, country) => { setPiWifiSsid(ssid); setPiWifiPassword(pwd); setPiWifiCountry(country); }}
            onClearWifi={() => { setPiWifiSsid(''); setPiWifiPassword(''); }}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'summary':
        return (
          <SummaryStep
            platform={targetPlatform}
            zone={selectedZone}
            hostname={hostname}
            tunnelName={tunnelName}
            deviceName={deviceName}
          />
        );

      case 'provision':
        return (
          <ProvisionStep
            tasks={provisionTasks}
            currentTask={currentTaskId}
            error={provisionError}
          />
        );

      case 'api-key':
        return (
          <ApiKeyStep
            apiKey={proxyApiKey}
            onRegenerate={handleRegenerateApiKey}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'download':
        return (
          <PiDownloadStep
            onComplete={(path) => { setImagePath(path); goNext(); }}
            onBack={goBack}
          />
        );

      case 'flash':
        return (
          <PiFlashStep
            imagePath={imagePath}
            piConfig={{
              hostname: piHostname,
              username: piUsername,
              password: piPassword,
              wifiSsid: piWifiSsid,
              wifiPassword: piWifiPassword,
              wifiCountry: piWifiCountry,
              tunnelToken,
              printerPort: printerPort ? parseInt(printerPort, 10) : 6500,
              apiKey: proxyApiKey,
            }}
            onNext={goNext}
            onBack={goBack}
          />
        );

      case 'success':
        return (
          <SuccessStep
            targetPlatform={targetPlatform}
            hostname={`${hostname}.${selectedZone?.name || 'example.com'}`}
            tunnelName={tunnelName}
            tunnelToken={tunnelToken}
            proxyApiKey={proxyApiKey}
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-surface-950">
      <WizardSidebar
        steps={steps}
        currentStep={currentStep}
        onStepClick={isProvisioningOrComplete ? undefined : setCurrentStep}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-14 border-b border-surface-800 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-white">
            {steps[currentStep]?.title}
          </h1>
          {currentStepId === 'success' ? (
            <button
              onClick={async () => { const { appWindow } = await import('@tauri-apps/api/window'); appWindow.close(); }}
              className="p-2 text-surface-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : !isProvisioningOrComplete && (
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

        {/* Bottom navigation — hidden for self-managed steps */}
        {!hideBottomNav && currentStep > 0 && (
          <div className="h-20 border-t border-surface-800 flex items-center justify-between px-8">
            <Button
              variant="ghost"
              onClick={handleBack}
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
                {currentStepId === 'summary' ? 'Start Provisioning' : 'Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
