/**
 * Pi Setup - Complete Step
 * Success page with next steps
 */

import { 
  CheckCircle, 
  Rocket, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Power,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/Button';
import type { PiSetupConfig } from '../../../types';

interface PiCompleteStepProps {
  config: PiSetupConfig;
  onStartProvisioning: () => void;
  onNewSetup: () => void;
}

export function PiCompleteStep({ 
  config, 
  onStartProvisioning, 
  onNewSetup,
}: PiCompleteStepProps) {
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

  const sshCommand = `ssh ${config.username}@${config.hostname}.local`;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping opacity-25" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          SD Card Ready! 🎉
        </h1>
        <p className="text-lg text-surface-400">
          Your Raspberry Pi is configured for headless boot
        </p>
      </div>

      {/* Quick reference */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4">Quick Reference</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900">
            <div>
              <p className="text-xs text-surface-500 mb-1">Hostname</p>
              <p className="font-medium text-white">{config.hostname}.local</p>
            </div>
            <button
              onClick={() => copyToClipboard(`${config.hostname}.local`, 'hostname')}
              className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg"
            >
              {copiedItem === 'hostname' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900">
            <div>
              <p className="text-xs text-surface-500 mb-1">SSH Command</p>
              <code className="font-mono text-freemen-400">{sshCommand}</code>
            </div>
            <button
              onClick={() => copyToClipboard(sshCommand, 'ssh')}
              className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg"
            >
              {copiedItem === 'ssh' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-surface-900">
            <p className="text-xs text-surface-500 mb-1">Network</p>
            <p className="font-medium text-white">
              {config.wifiSsid ? `WiFi: ${config.wifiSsid}` : 'Ethernet (cable)'}
            </p>
          </div>
        </div>
      </div>

      {/* Boot instructions */}
      <div className="p-6 rounded-2xl bg-freemen-500/5 border border-freemen-500/20 mb-8">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Power className="w-5 h-5 text-freemen-400" />
          First Boot Instructions
        </h3>
        <ol className="space-y-4">
          <BootStep number={1} title="Insert the SD card">
            Put the configured microSD card into your Raspberry Pi
          </BootStep>
          <BootStep number={2} title="Connect network">
            {config.wifiSsid 
              ? 'WiFi will connect automatically on boot'
              : 'Connect an Ethernet cable to your Pi and router'}
          </BootStep>
          <BootStep number={3} title="Power on">
            Connect the power supply and wait 2-3 minutes
          </BootStep>
          <BootStep number={4} title="Find your Pi">
            <div className="mt-2">
              <code className="text-sm bg-surface-900 px-2 py-1 rounded text-freemen-400">
                ping {config.hostname}.local
              </code>
            </div>
          </BootStep>
          <BootStep number={5} title="Connect via SSH">
            <div className="mt-2">
              <code className="text-sm bg-surface-900 px-2 py-1 rounded text-freemen-400">
                {sshCommand}
              </code>
            </div>
          </BootStep>
        </ol>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-2xl bg-surface-900/30 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-yellow-400" />
          What's Next?
        </h3>
        <p className="text-surface-300 mb-4">
          Once your Pi is running and you can SSH into it, you can proceed to 
          provision the Freemen Printer Proxy service.
        </p>
        <Button 
          onClick={onStartProvisioning}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Provisioning
        </Button>
      </div>

      {/* Troubleshooting */}
      <div className="p-4 rounded-xl bg-surface-900/30 border border-surface-800 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-surface-500" />
            <span className="text-surface-300">Having trouble connecting?</span>
          </div>
          <a
            href="https://www.raspberrypi.com/documentation/computers/remote-access.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-freemen-400 hover:text-freemen-300 text-sm"
          >
            Troubleshooting Guide <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Setup another */}
      <div className="text-center">
        <Button variant="ghost" onClick={onNewSetup}>
          Setup Another Pi
        </Button>
      </div>
    </div>
  );
}

interface BootStepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function BootStep({ number, title, children }: BootStepProps) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-freemen-500/20 text-freemen-400 font-semibold flex items-center justify-center text-sm">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-medium text-white mb-1">{title}</h4>
        <div className="text-sm text-surface-400">{children}</div>
      </div>
    </li>
  );
}
