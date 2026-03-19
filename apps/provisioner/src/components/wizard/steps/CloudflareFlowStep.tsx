/**
 * Premium Cloudflare Assisted Flow Step
 * Guides users through Cloudflare setup with minimal manual input
 */

import { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  CheckCircle,
  Building2,
  Globe,
  Link,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Search,
  Loader2,
  Shield,
  Sparkles,
  Info,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { clsx } from 'clsx';
import type { CloudflareAccount, CloudflareZone } from '../../../types';

// ============================================
// TYPES
// ============================================

type FlowSubStep = 'connect' | 'account' | 'zone' | 'hostname' | 'ready';

interface CloudflareFlowStepProps {
  // Auth
  apiToken: string;
  onApiTokenChange: (token: string) => void;
  onValidateToken: () => Promise<boolean>;
  isTokenValidated: boolean;
  isValidatingToken: boolean;
  
  // Accounts
  accounts: CloudflareAccount[];
  selectedAccount: CloudflareAccount | null;
  onSelectAccount: (account: CloudflareAccount) => void;
  isLoadingAccounts: boolean;
  
  // Zones
  zones: CloudflareZone[];
  selectedZone: CloudflareZone | null;
  onSelectZone: (zone: CloudflareZone) => void;
  onRefreshZones: () => void;
  isLoadingZones: boolean;
  
  // Hostname
  hostname: string;
  onHostnameChange: (hostname: string) => void;
  tunnelName: string;
  onTunnelNameChange: (name: string) => void;
  
  // Error
  error: { message: string; code?: number } | null;
  onClearError: () => void;
}

// ============================================
// SUB-STEP COMPONENTS
// ============================================

interface SubStepIndicatorProps {
  steps: { id: FlowSubStep; label: string; icon: React.ReactNode }[];
  currentStep: FlowSubStep;
  completedSteps: FlowSubStep[];
}

function SubStepIndicator({ steps, currentStep, completedSteps }: SubStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isPast = steps.findIndex(s => s.id === currentStep) > index;
        
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                isCompleted && 'bg-green-500/20 text-green-400',
                isCurrent && !isCompleted && 'bg-freemen-500/20 text-freemen-400',
                !isCurrent && !isCompleted && 'bg-surface-800 text-surface-500'
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center">
                  {step.icon}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className={clsx(
                'w-4 h-4 mx-1',
                isPast || isCompleted ? 'text-green-500' : 'text-surface-700'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Connect Sub-Step
interface ConnectSubStepProps {
  apiToken: string;
  onApiTokenChange: (token: string) => void;
  onValidate: () => Promise<void>;
  isValidating: boolean;
  error: string | null;
}

function ConnectSubStep({ apiToken, onApiTokenChange, onValidate, isValidating, error }: ConnectSubStepProps) {
  const [showToken, setShowToken] = useState(false);
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-4 relative">
          <KeyRound className="w-10 h-10 text-orange-400" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center border border-surface-700">
            <Shield className="w-4 h-4 text-freemen-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Connect to Cloudflare
        </h2>
        <p className="text-surface-400 max-w-md mx-auto">
          Enter your API token to securely connect. We'll automatically discover your accounts and domains.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Token Input */}
        <div className="relative">
          <Input
            label="API Token"
            type={showToken ? 'text' : 'password'}
            value={apiToken}
            onChange={(e) => onApiTokenChange(e.target.value)}
            placeholder="Your Cloudflare API token"
            error={error || undefined}
            leftIcon={<KeyRound className="w-5 h-5" />}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-9 text-surface-400 hover:text-white transition-colors"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Connect Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={onValidate}
          isLoading={isValidating}
          disabled={!apiToken.trim() || apiToken.length < 32}
        >
          {isValidating ? 'Connecting...' : 'Connect to Cloudflare'}
        </Button>

        {/* Required Permissions */}
        <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
          <h4 className="text-sm font-medium text-surface-300 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-freemen-400" />
            Required Token Permissions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { perm: 'Zone : Read', desc: 'List domains' },
              { perm: 'DNS : Edit', desc: 'Create records' },
              { perm: 'Tunnel : Edit', desc: 'Create tunnels' },
              { perm: 'Account : Read', desc: 'List accounts' },
            ].map((item) => (
              <div key={item.perm} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-freemen-500" />
                <span className="text-surface-400">{item.perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Create Token Link */}
        <a
          href="https://dash.cloudflare.com/profile/api-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-freemen-400 hover:text-freemen-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Create API Token in Cloudflare Dashboard
        </a>
      </div>
    </div>
  );
}

// Account Selection Sub-Step
interface AccountSubStepProps {
  accounts: CloudflareAccount[];
  selectedAccount: CloudflareAccount | null;
  onSelect: (account: CloudflareAccount) => void;
  isLoading: boolean;
}

function AccountSubStep({ accounts, selectedAccount, onSelect, isLoading }: AccountSubStepProps) {
  if (isLoading) {
    return (
      <div className="animate-fade-in text-center py-12">
        <Loader2 className="w-12 h-12 text-freemen-400 animate-spin mx-auto mb-4" />
        <p className="text-surface-400">Loading your Cloudflare accounts...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Select Account
        </h2>
        <p className="text-surface-400 max-w-md mx-auto">
          {accounts.length === 1 
            ? 'We found your Cloudflare account. Click to continue.'
            : `Choose which Cloudflare account to use (${accounts.length} available).`
          }
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-3">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onSelect(account)}
            className={clsx(
              'w-full p-4 rounded-xl border-2 transition-all text-left group',
              selectedAccount?.id === account.id
                ? 'bg-freemen-500/10 border-freemen-500'
                : 'bg-surface-900/50 border-surface-800 hover:border-surface-700 hover:bg-surface-900'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  selectedAccount?.id === account.id
                    ? 'bg-freemen-500/20 text-freemen-400'
                    : 'bg-surface-800 text-surface-400 group-hover:text-white'
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{account.name}</h3>
                  <p className="text-sm text-surface-500 font-mono">{account.id.slice(0, 16)}...</p>
                </div>
              </div>
              {selectedAccount?.id === account.id ? (
                <CheckCircle className="w-6 h-6 text-freemen-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-surface-600 group-hover:text-surface-400" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Zone Selection Sub-Step
interface ZoneSubStepProps {
  zones: CloudflareZone[];
  selectedZone: CloudflareZone | null;
  onSelect: (zone: CloudflareZone) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

function ZoneSubStep({ zones, selectedZone, onSelect, onRefresh, isLoading }: ZoneSubStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredZones = useMemo(() => {
    if (!searchQuery) return zones;
    return zones.filter(z => 
      z.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zones, searchQuery]);

  if (isLoading) {
    return (
      <div className="animate-fade-in text-center py-12">
        <Loader2 className="w-12 h-12 text-freemen-400 animate-spin mx-auto mb-4" />
        <p className="text-surface-400">Loading your domains...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Domain
        </h2>
        <p className="text-surface-400 max-w-md mx-auto">
          Select the domain where your printer proxy will be accessible.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Search & Refresh */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-900 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-freemen-500 focus:border-transparent"
            />
          </div>
          <Button variant="secondary" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Zone List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredZones.length === 0 ? (
            <div className="text-center py-8 text-surface-500">
              {searchQuery ? 'No domains match your search' : 'No domains found'}
            </div>
          ) : (
            filteredZones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => onSelect(zone)}
                className={clsx(
                  'w-full p-4 rounded-xl border-2 transition-all text-left group',
                  selectedZone?.id === zone.id
                    ? 'bg-freemen-500/10 border-freemen-500'
                    : 'bg-surface-900/50 border-surface-800 hover:border-surface-700 hover:bg-surface-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      selectedZone?.id === zone.id
                        ? 'bg-freemen-500/20 text-freemen-400'
                        : 'bg-surface-800 text-surface-400 group-hover:text-white'
                    )}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{zone.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'text-xs px-2 py-0.5 rounded-full',
                          zone.status === 'active' 
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        )}>
                          {zone.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedZone?.id === zone.id ? (
                    <CheckCircle className="w-6 h-6 text-freemen-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-surface-600 group-hover:text-surface-400" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Hostname Configuration Sub-Step
interface HostnameSubStepProps {
  hostname: string;
  onHostnameChange: (hostname: string) => void;
  tunnelName: string;
  onTunnelNameChange: (name: string) => void;
  zoneName: string;
}

function HostnameSubStep({ 
  hostname, 
  onHostnameChange, 
  tunnelName, 
  onTunnelNameChange, 
  zoneName 
}: HostnameSubStepProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fullUrl = `https://${hostname}.${zoneName}`;
  
  // Suggest tunnel name based on hostname
  useEffect(() => {
    if (hostname && !tunnelName) {
      onTunnelNameChange(`${hostname}-tunnel`);
    }
  }, [hostname]);

  const isValidHostname = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(hostname.toLowerCase());

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
          <Link className="w-10 h-10 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Configure Access URL
        </h2>
        <p className="text-surface-400 max-w-md mx-auto">
          Choose a subdomain for your printer proxy. This will be the public URL.
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Hostname Input */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Subdomain
          </label>
          <div className="flex items-center gap-2">
            <Input
              value={hostname}
              onChange={(e) => onHostnameChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="printer"
              className="flex-1"
              error={hostname && !isValidHostname ? 'Invalid subdomain format' : undefined}
            />
            <span className="text-surface-500 text-lg">.{zoneName}</span>
          </div>
        </div>

        {/* Live URL Preview */}
        {hostname && isValidHostname && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-freemen-500/10 to-green-500/10 border border-freemen-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-freemen-400" />
              <span className="text-sm font-medium text-freemen-400">Your Public URL</span>
            </div>
            <code className="text-lg font-mono text-white break-all">{fullUrl}</code>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="border-t border-surface-800 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors"
          >
            <ChevronDown className={clsx(
              'w-4 h-4 transition-transform',
              showAdvanced && 'rotate-180'
            )} />
            Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Tunnel Name
                </label>
                <Input
                  value={tunnelName}
                  onChange={(e) => onTunnelNameChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="freemen-printer-tunnel"
                />
                <p className="text-xs text-surface-500 mt-1">
                  Internal name for the Cloudflare tunnel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ready Sub-Step (Summary before main wizard continues)
interface ReadySubStepProps {
  account: CloudflareAccount;
  zone: CloudflareZone;
  hostname: string;
  tunnelName: string;
}

function ReadySubStep({ account, zone, hostname, tunnelName }: ReadySubStepProps) {
  const fullUrl = `https://${hostname}.${zone.name}`;

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4 relative">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <div className="absolute inset-0 rounded-2xl border-2 border-green-500/30 animate-ping opacity-25" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Cloudflare Ready!
        </h2>
        <p className="text-surface-400 max-w-md mx-auto">
          Your Cloudflare configuration is complete. Continue to configure your device.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Summary Card */}
        <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-surface-800">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Configuration Summary</h3>
              <p className="text-sm text-surface-500">Ready to provision</p>
            </div>
          </div>

          <div className="space-y-3">
            <SummaryRow label="Account" value={account.name} icon={<Building2 className="w-4 h-4" />} />
            <SummaryRow label="Domain" value={zone.name} icon={<Globe className="w-4 h-4" />} />
            <SummaryRow label="Public URL" value={fullUrl} icon={<Link className="w-4 h-4" />} highlight />
            <SummaryRow label="Tunnel" value={tunnelName} icon={<Shield className="w-4 h-4" />} />
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-6 p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20">
          <h4 className="font-medium text-freemen-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            What happens next?
          </h4>
          <ul className="text-sm text-surface-300 space-y-1">
            <li>• Configure device settings</li>
            <li>• Review final configuration</li>
            <li>• Create tunnel & DNS automatically</li>
            <li>• Generate deployment package</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ 
  label, 
  value, 
  icon, 
  highlight 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-surface-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={clsx(
        'text-sm font-medium',
        highlight ? 'text-freemen-400' : 'text-white'
      )}>
        {value}
      </span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CloudflareFlowStep({
  apiToken,
  onApiTokenChange,
  onValidateToken,
  isTokenValidated,
  isValidatingToken,
  accounts,
  selectedAccount,
  onSelectAccount,
  isLoadingAccounts,
  zones,
  selectedZone,
  onSelectZone,
  onRefreshZones,
  isLoadingZones,
  hostname,
  onHostnameChange,
  tunnelName,
  onTunnelNameChange,
  error,
  onClearError,
}: CloudflareFlowStepProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  // Determine current sub-step based on state
  const currentSubStep: FlowSubStep = useMemo(() => {
    if (!isTokenValidated) return 'connect';
    if (!selectedAccount) return 'account';
    if (!selectedZone) return 'zone';
    if (!hostname || hostname.length < 2) return 'hostname';
    return 'ready';
  }, [isTokenValidated, selectedAccount, selectedZone, hostname]);

  // Track completed steps
  const completedSteps: FlowSubStep[] = useMemo(() => {
    const completed: FlowSubStep[] = [];
    if (isTokenValidated) completed.push('connect');
    if (selectedAccount) completed.push('account');
    if (selectedZone) completed.push('zone');
    if (hostname && hostname.length >= 2) completed.push('hostname');
    if (completed.length === 4) completed.push('ready');
    return completed;
  }, [isTokenValidated, selectedAccount, selectedZone, hostname]);

  const subSteps = [
    { id: 'connect' as FlowSubStep, label: 'Connect', icon: <KeyRound className="w-3 h-3" /> },
    { id: 'account' as FlowSubStep, label: 'Account', icon: <Building2 className="w-3 h-3" /> },
    { id: 'zone' as FlowSubStep, label: 'Domain', icon: <Globe className="w-3 h-3" /> },
    { id: 'hostname' as FlowSubStep, label: 'URL', icon: <Link className="w-3 h-3" /> },
    { id: 'ready' as FlowSubStep, label: 'Ready', icon: <CheckCircle className="w-3 h-3" /> },
  ];

  // Handle token validation
  const handleValidate = async () => {
    setLocalError(null);
    onClearError();
    const success = await onValidateToken();
    if (!success && error) {
      setLocalError(error.message);
    }
  };

  // Auto-advance when single account
  useEffect(() => {
    if (accounts.length === 1 && !selectedAccount && isTokenValidated) {
      onSelectAccount(accounts[0]);
    }
  }, [accounts, selectedAccount, isTokenValidated, onSelectAccount]);

  // Clear local error when global error changes
  useEffect(() => {
    if (error) {
      setLocalError(error.message);
    }
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sub-step indicator */}
      <SubStepIndicator 
        steps={subSteps} 
        currentStep={currentSubStep} 
        completedSteps={completedSteps}
      />

      {/* Error Alert */}
      {localError && currentSubStep === 'connect' && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300">{localError}</p>
            <button 
              onClick={() => setLocalError(null)}
              className="text-sm text-red-400 hover:text-red-300 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Render current sub-step */}
      {currentSubStep === 'connect' && (
        <ConnectSubStep
          apiToken={apiToken}
          onApiTokenChange={onApiTokenChange}
          onValidate={handleValidate}
          isValidating={isValidatingToken}
          error={localError}
        />
      )}

      {currentSubStep === 'account' && (
        <AccountSubStep
          accounts={accounts}
          selectedAccount={selectedAccount}
          onSelect={onSelectAccount}
          isLoading={isLoadingAccounts}
        />
      )}

      {currentSubStep === 'zone' && (
        <ZoneSubStep
          zones={zones}
          selectedZone={selectedZone}
          onSelect={onSelectZone}
          onRefresh={onRefreshZones}
          isLoading={isLoadingZones}
        />
      )}

      {currentSubStep === 'hostname' && selectedZone && (
        <HostnameSubStep
          hostname={hostname}
          onHostnameChange={onHostnameChange}
          tunnelName={tunnelName}
          onTunnelNameChange={onTunnelNameChange}
          zoneName={selectedZone.name}
        />
      )}

      {currentSubStep === 'ready' && selectedAccount && selectedZone && (
        <ReadySubStep
          account={selectedAccount}
          zone={selectedZone}
          hostname={hostname}
          tunnelName={tunnelName}
        />
      )}
    </div>
  );
}
