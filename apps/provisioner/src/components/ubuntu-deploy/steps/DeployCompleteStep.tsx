/**
 * Ubuntu Deploy - Complete Step
 */

import { useState } from 'react';
import { 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal,
  RefreshCw,
  Stethoscope,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { DeploymentPackage, UbuntuDeployConfig } from '../../../types';

interface DeployCompleteStepProps {
  deploymentPackage: DeploymentPackage | null;
  config: UbuntuDeployConfig;
  onNewDeployment: () => void;
}

export function DeployCompleteStep({
  deploymentPackage,
  config,
  onNewDeployment,
}: DeployCompleteStepProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const isLocal = config.targetHost === 'localhost' || config.targetHost === '127.0.0.1';
  const dashboardUrl = isLocal 
    ? 'http://localhost:6500' 
    : `http://${config.targetHost}:6500`;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping opacity-25" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          Deployment Complete! 🎉
        </h1>
        <p className="text-lg text-surface-400">
          Freemen Printer Proxy is now running on your machine
        </p>
      </div>

      {/* Quick access */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-freemen-500/10 to-freemen-600/10 border border-freemen-500/30 mb-8">
        <h3 className="font-semibold text-white mb-4">Access Your Dashboard</h3>
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/50">
          <div>
            <p className="text-sm text-surface-500 mb-1">Dashboard URL</p>
            <a 
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-freemen-400 hover:text-freemen-300 flex items-center gap-2"
            >
              {dashboardUrl}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <Button
            size="sm"
            onClick={() => copyToClipboard(dashboardUrl, 'url')}
            leftIcon={copiedItem === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copiedItem === 'url' ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Quick commands */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-surface-400" />
          Quick Commands
        </h3>
        <div className="space-y-3">
          <CommandCard
            label="View logs"
            command={`cd ${config.installPath} && docker compose logs -f`}
            onCopy={(cmd) => copyToClipboard(cmd, 'logs')}
            copied={copiedItem === 'logs'}
          />
          <CommandCard
            label="Check status"
            command={`cd ${config.installPath} && docker compose ps`}
            onCopy={(cmd) => copyToClipboard(cmd, 'status')}
            copied={copiedItem === 'status'}
          />
          <CommandCard
            label="Restart service"
            command={`cd ${config.installPath} && docker compose restart`}
            onCopy={(cmd) => copyToClipboard(cmd, 'restart')}
            copied={copiedItem === 'restart'}
          />
          <CommandCard
            label="Run diagnostics"
            command={`cd ${config.installPath} && ./scripts/doctor.sh`}
            onCopy={(cmd) => copyToClipboard(cmd, 'doctor')}
            copied={copiedItem === 'doctor'}
          />
        </div>
      </div>

      {/* Maintenance tools */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-surface-900/30 border border-surface-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Update Script</h4>
              <p className="text-xs text-surface-500">Keep your installation current</p>
            </div>
          </div>
          <code className="block text-sm text-surface-400 bg-surface-900/50 p-2 rounded font-mono">
            ./scripts/update.sh
          </code>
        </div>
        
        <div className="p-5 rounded-xl bg-surface-900/30 border border-surface-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Admin Menu</h4>
              <p className="text-xs text-surface-500">Interactive management tool</p>
            </div>
          </div>
          <code className="block text-sm text-surface-400 bg-surface-900/50 p-2 rounded font-mono">
            ./deploy-menu.sh
          </code>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-2xl bg-surface-900/30 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yellow-400" />
          Next Steps
        </h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 font-semibold flex items-center justify-center text-sm">
              1
            </span>
            <div>
              <p className="text-surface-300">
                Open the dashboard and enter your API key
              </p>
              <p className="text-xs text-surface-500">
                Check the .env file for your generated API key
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 font-semibold flex items-center justify-center text-sm">
              2
            </span>
            <div>
              <p className="text-surface-300">
                Go to Configuration and scan for your printer
              </p>
              <p className="text-xs text-surface-500">
                Make sure your Brother printer is connected to the network
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 font-semibold flex items-center justify-center text-sm">
              3
            </span>
            <div>
              <p className="text-surface-300">
                Test printing from the dashboard
              </p>
              <p className="text-xs text-surface-500">
                Send a test label to verify everything works
              </p>
            </div>
          </li>
          {config.tunnelToken && (
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-semibold flex items-center justify-center text-sm">
                4
              </span>
              <div>
                <p className="text-surface-300">
                  Verify Cloudflare tunnel is active
                </p>
                <p className="text-xs text-surface-500">
                  Check the Cloudflare dashboard for tunnel status
                </p>
              </div>
            </li>
          )}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="secondary" onClick={onNewDeployment}>
          New Deployment
        </Button>
        <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
          <Button rightIcon={<ExternalLink className="w-4 h-4" />}>
            Open Dashboard
          </Button>
        </a>
      </div>
    </div>
  );
}

interface CommandCardProps {
  label: string;
  command: string;
  onCopy: (command: string) => void;
  copied: boolean;
}

function CommandCard({ label, command, onCopy, copied }: CommandCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50 border border-surface-800">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-400 mb-1">{label}</p>
        <code className="text-sm text-freemen-400 font-mono break-all">{command}</code>
      </div>
      <button
        onClick={() => onCopy(command)}
        className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0 ml-2"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
