/**
 * Ubuntu Deploy - Configuration Step
 */

import { Server, User, FolderOpen, Key, Cloud, Printer } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { DeploymentMode, UbuntuDeployConfig } from '../../../types';
import { DEPLOYMENT_MODE_INFO } from '../../../services/ubuntu-deployment-service';

interface DeployConfigStepProps {
  mode: DeploymentMode;
  config: UbuntuDeployConfig;
  onConfigChange: (config: Partial<UbuntuDeployConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DeployConfigStep({
  mode,
  config,
  onConfigChange,
  onNext,
  onBack,
}: DeployConfigStepProps) {
  const modeInfo = DEPLOYMENT_MODE_INFO[mode];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-900/50 border border-surface-800 text-sm text-surface-400 mb-4">
          <span>{modeInfo.icon}</span>
          <span>{modeInfo.title}</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Configure Deployment
        </h2>
        <p className="text-surface-400">
          Set up the target machine and deployment options
        </p>
      </div>

      {/* Configuration form */}
      <div className="space-y-6">
        {/* Target section */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-surface-400" />
            Target Machine
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-2">
                Host / IP Address
              </label>
              <Input
                value={config.targetHost}
                onChange={(e) => onConfigChange({ targetHost: e.target.value })}
                placeholder="localhost or 192.168.1.100"
              />
              <p className="text-xs text-surface-500 mt-1">
                Use "localhost" for local deployment or an IP/hostname for remote
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Username
                </label>
                <Input
                  value={config.targetUser}
                  onChange={(e) => onConfigChange({ targetUser: e.target.value })}
                  placeholder="freemen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-400 mb-2">
                  <FolderOpen className="w-4 h-4 inline mr-1" />
                  Install Path
                </label>
                <Input
                  value={config.installPath}
                  onChange={(e) => onConfigChange({ installPath: e.target.value })}
                  placeholder="/opt/freemen-printer-proxy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Credentials section */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-surface-400" />
            Credentials
            <span className="text-xs font-normal text-surface-500">(Optional)</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-2">
                API Key
              </label>
              <Input
                value={config.apiKey || ''}
                onChange={(e) => onConfigChange({ apiKey: e.target.value })}
                placeholder="Leave empty to auto-generate"
                type="password"
              />
              <p className="text-xs text-surface-500 mt-1">
                A secure API key will be generated if left empty
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-2">
                Device ID
              </label>
              <Input
                value={config.deviceId || ''}
                onChange={(e) => onConfigChange({ deviceId: e.target.value })}
                placeholder="e.g., fpp-office-printer"
              />
            </div>
          </div>
        </div>

        {/* Cloudflare section */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-orange-400" />
            Cloudflare Tunnel
            <span className="text-xs font-normal text-surface-500">(Optional)</span>
          </h3>
          <div>
            <label className="block text-sm font-medium text-surface-400 mb-2">
              Tunnel Token
            </label>
            <Input
              value={config.tunnelToken || ''}
              onChange={(e) => onConfigChange({ tunnelToken: e.target.value })}
              placeholder="eyJhIjoiY..."
              type="password"
            />
            <p className="text-xs text-surface-500 mt-1">
              From the Freemen Provisioner wizard or Cloudflare dashboard
            </p>
          </div>
        </div>

        {/* Printer section */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            Printer Configuration
            <span className="text-xs font-normal text-surface-500">(Optional)</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-2">
                Printer IP
              </label>
              <Input
                value={config.printerIp || ''}
                onChange={(e) => onConfigChange({ printerIp: e.target.value })}
                placeholder="192.168.1.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-400 mb-2">
                Printer Port
              </label>
              <Input
                type="number"
                value={config.printerPort || 9100}
                onChange={(e) => onConfigChange({ printerPort: parseInt(e.target.value) || 9100 })}
                placeholder="9100"
              />
            </div>
          </div>
          <p className="text-xs text-surface-500 mt-2">
            Can be configured later via the dashboard
          </p>
        </div>
      </div>

      {/* Remote deployment notice */}
      {config.targetHost !== 'localhost' && config.targetHost !== '127.0.0.1' && (
        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <h4 className="font-medium text-yellow-400 mb-2">📡 Remote Deployment</h4>
          <p className="text-sm text-surface-300">
            Commands will be prefixed with SSH. Make sure you have SSH access to{' '}
            <code className="text-yellow-400">{config.targetUser}@{config.targetHost}</code>
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Generate Commands
        </Button>
      </div>
    </div>
  );
}
