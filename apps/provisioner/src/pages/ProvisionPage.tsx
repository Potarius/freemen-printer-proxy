/**
 * Provision Page
 * Multi-step wizard for device provisioning
 */

import { useProvisionStore } from '../stores/provision-store';
import { WizardStepper } from '../components/wizard/WizardStepper';
import { KeyRound, Building, Globe, Server, Cloud, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export function ProvisionPage() {
  const { 
    currentStep, 
    steps, 
    isLoading,
    error,
    nextStep,
    prevStep,
  } = useProvisionStore();

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2">Provision Device</h1>
      <p className="text-surface-400 mb-8">Configure a new Freemen Printer Proxy with Cloudflare Tunnel</p>

      {/* Stepper */}
      <WizardStepper steps={steps} currentStep={currentStep} />

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="card min-h-[400px]">
        <StepContent step={currentStep} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          disabled={currentStep === 0 || isLoading}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1 || isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 0:
      return <AuthStep />;
    case 1:
      return <AccountStep />;
    case 2:
      return <ZoneStep />;
    case 3:
      return <DeviceStep />;
    case 4:
      return <TunnelStep />;
    case 5:
      return <CompleteStep />;
    default:
      return null;
  }
}

function AuthStep() {
  const { apiToken, setApiToken } = useProvisionStore();

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-freemen-600/20 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-freemen-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Cloudflare Authentication</h2>
          <p className="text-surface-400">Enter your Cloudflare API token</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">API Token</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your Cloudflare API token"
            className="input"
          />
        </div>

        <div className="p-4 bg-surface-800/50 rounded-lg">
          <p className="text-sm text-surface-400 mb-2">Required permissions:</p>
          <ul className="text-sm text-surface-500 space-y-1">
            <li>• Zone : Zone : Read</li>
            <li>• Zone : DNS : Edit</li>
            <li>• Account : Cloudflare Tunnel : Edit</li>
            <li>• Account : Account Settings : Read</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AccountStep() {
  const { selectedAccount, setSelectedAccount } = useProvisionStore();

  // Mock accounts for demo
  const accounts = [
    { id: 'acc_1', name: 'Personal Account' },
    { id: 'acc_2', name: 'Work Account' },
  ];

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-freemen-600/20 flex items-center justify-center">
          <Building className="w-6 h-6 text-freemen-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Select Account</h2>
          <p className="text-surface-400">Choose your Cloudflare account</p>
        </div>
      </div>

      <div className="space-y-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => setSelectedAccount(account)}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selectedAccount?.id === account.id
                ? 'bg-freemen-600/20 border-freemen-600/50 text-white'
                : 'bg-surface-800/50 border-surface-700 text-surface-300 hover:border-surface-600'
            }`}
          >
            <span className="font-medium">{account.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ZoneStep() {
  const { selectedZone, setSelectedZone } = useProvisionStore();

  // Mock zones for demo
  const zones = [
    { id: 'zone_1', name: 'example.com', status: 'active' },
    { id: 'zone_2', name: 'mycompany.io', status: 'active' },
  ];

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-freemen-600/20 flex items-center justify-center">
          <Globe className="w-6 h-6 text-freemen-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Select Domain</h2>
          <p className="text-surface-400">Choose the domain for your tunnel</p>
        </div>
      </div>

      <div className="space-y-2">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone)}
            className={`w-full p-4 rounded-lg border text-left transition-all ${
              selectedZone?.id === zone.id
                ? 'bg-freemen-600/20 border-freemen-600/50 text-white'
                : 'bg-surface-800/50 border-surface-700 text-surface-300 hover:border-surface-600'
            }`}
          >
            <span className="font-medium">{zone.name}</span>
            <span className="ml-2 badge-success">{zone.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DeviceStep() {
  const { deviceName, setDeviceName, hostname, setHostname, targetPlatform, setTargetPlatform, selectedZone } = useProvisionStore();

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-freemen-600/20 flex items-center justify-center">
          <Server className="w-6 h-6 text-freemen-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Configure Device</h2>
          <p className="text-surface-400">Set up your device details</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Device Name</label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="My Printer Proxy"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Hostname</label>
          <input
            type="text"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder={`printer.${selectedZone?.name || 'example.com'}`}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">Target Platform</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTargetPlatform('raspberry-pi')}
              className={`p-4 rounded-lg border text-center transition-all ${
                targetPlatform === 'raspberry-pi'
                  ? 'bg-freemen-600/20 border-freemen-600/50 text-white'
                  : 'bg-surface-800/50 border-surface-700 text-surface-300 hover:border-surface-600'
              }`}
            >
              Raspberry Pi
            </button>
            <button
              onClick={() => setTargetPlatform('linux')}
              className={`p-4 rounded-lg border text-center transition-all ${
                targetPlatform === 'linux'
                  ? 'bg-freemen-600/20 border-freemen-600/50 text-white'
                  : 'bg-surface-800/50 border-surface-700 text-surface-300 hover:border-surface-600'
              }`}
            >
              Ubuntu / Linux
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TunnelStep() {
  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-freemen-600/20 flex items-center justify-center">
          <Cloud className="w-6 h-6 text-freemen-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Create Tunnel</h2>
          <p className="text-surface-400">Setting up your Cloudflare Tunnel</p>
        </div>
      </div>

      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 text-freemen-400 animate-spin mx-auto mb-4" />
        <p className="text-surface-400">Creating tunnel and configuring DNS...</p>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="animate-slide-up text-center py-8">
      <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">Provisioning Complete!</h2>
      <p className="text-surface-400 mb-8">Your device configuration is ready to download.</p>

      <button className="btn-primary">
        Download Configuration Package
      </button>
    </div>
  );
}
