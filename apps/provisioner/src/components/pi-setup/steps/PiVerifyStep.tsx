/**
 * Pi Setup - Verify Step
 * Review configuration before completing
 */

import { CheckCircle, Server, User, Wifi, WifiOff, Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/Button';
import type { PiSetupConfig } from '../../../types';

interface PiVerifyStepProps {
  config: PiSetupConfig;
  onNext: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
}

export function PiVerifyStep({ config, onNext, onBack, onEdit }: PiVerifyStepProps) {
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

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Review Configuration
        </h2>
        <p className="text-surface-400">
          Verify your settings before completing the setup
        </p>
      </div>

      {/* Configuration summary */}
      <div className="space-y-4 mb-8">
        {/* System */}
        <ConfigSection
          icon={<Server className="w-5 h-5" />}
          title="System"
          onEdit={() => onEdit(2)}
        >
          <ConfigRow 
            label="Hostname" 
            value={config.hostname}
            copyable
            onCopy={() => copyToClipboard(config.hostname, 'hostname')}
            copied={copiedItem === 'hostname'}
          />
          <ConfigRow 
            label="Access URL" 
            value={`${config.hostname}.local`}
            copyable
            onCopy={() => copyToClipboard(`${config.hostname}.local`, 'url')}
            copied={copiedItem === 'url'}
          />
        </ConfigSection>

        {/* User */}
        <ConfigSection
          icon={<User className="w-5 h-5" />}
          title="User Account"
          onEdit={() => onEdit(2)}
        >
          <ConfigRow label="Username" value={config.username} />
          <ConfigRow label="Password" value="••••••••" />
        </ConfigSection>

        {/* Network */}
        <ConfigSection
          icon={config.wifiSsid ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          title="Network"
          onEdit={() => onEdit(3)}
        >
          {config.wifiSsid ? (
            <>
              <ConfigRow label="Connection" value="WiFi" />
              <ConfigRow label="Network" value={config.wifiSsid} />
              <ConfigRow label="Country" value={config.wifiCountry} />
            </>
          ) : (
            <ConfigRow label="Connection" value="Ethernet (cable)" />
          )}
        </ConfigSection>

        {/* SSH */}
        <ConfigSection
          icon={<Terminal className="w-5 h-5" />}
          title="Remote Access"
        >
          <ConfigRow 
            label="SSH" 
            value={config.enableSsh ? 'Enabled' : 'Disabled'} 
            highlight={config.enableSsh}
          />
          {config.enableSsh && (
            <div className="mt-2 p-3 rounded-lg bg-surface-900/50">
              <p className="text-xs text-surface-500 mb-1">SSH Command</p>
              <div className="flex items-center justify-between">
                <code className="text-sm text-freemen-400 font-mono">
                  ssh {config.username}@{config.hostname}.local
                </code>
                <button
                  onClick={() => copyToClipboard(`ssh ${config.username}@${config.hostname}.local`, 'ssh')}
                  className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded transition-colors"
                >
                  {copiedItem === 'ssh' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </ConfigSection>
      </div>

      {/* Checklist reminder */}
      <div className="p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20 mb-8">
        <h4 className="font-medium text-freemen-400 mb-3">✅ Before continuing, make sure:</h4>
        <ul className="text-sm text-surface-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-freemen-400">1.</span>
            You've copied all boot files to the SD card
          </li>
          <li className="flex items-start gap-2">
            <span className="text-freemen-400">2.</span>
            The SD card has been safely ejected
          </li>
          <li className="flex items-start gap-2">
            <span className="text-freemen-400">3.</span>
            {config.wifiSsid 
              ? `Your WiFi network "${config.wifiSsid}" is available`
              : 'You have an Ethernet cable ready'}
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Complete Setup
        </Button>
      </div>
    </div>
  );
}

interface ConfigSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

function ConfigSection({ icon, title, children, onEdit }: ConfigSectionProps) {
  return (
    <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-surface-400">{icon}</div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-freemen-400 hover:text-freemen-300"
          >
            Edit
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface ConfigRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

function ConfigRow({ label, value, highlight, copyable, onCopy, copied }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-surface-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${highlight ? 'text-green-400' : 'text-white'}`}>
          {value}
        </span>
        {copyable && onCopy && (
          <button
            onClick={onCopy}
            className="p-1 text-surface-500 hover:text-white transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
