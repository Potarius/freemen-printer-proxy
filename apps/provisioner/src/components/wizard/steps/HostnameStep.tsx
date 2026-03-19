/**
 * Step 5: Hostname & Tunnel Configuration
 */

import { Link, Server } from 'lucide-react';
import { Input } from '../../ui/Input';

interface HostnameStepProps {
  hostname: string;
  tunnelName: string;
  zoneName: string;
  onHostnameChange: (value: string) => void;
  onTunnelNameChange: (value: string) => void;
  hostnameError?: string;
}

export function HostnameStep({
  hostname,
  tunnelName,
  zoneName,
  onHostnameChange,
  onTunnelNameChange,
  hostnameError,
}: HostnameStepProps) {
  const fullHostname = hostname ? `${hostname}.${zoneName}` : `[subdomain].${zoneName}`;

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-freemen-500/20 flex items-center justify-center mx-auto mb-4">
          <Link className="w-8 h-8 text-freemen-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Configure Access</h2>
        <p className="text-surface-400">Set up the hostname and tunnel for your device</p>
      </div>

      <div className="space-y-6">
        {/* Hostname */}
        <div>
          <Input
            label="Subdomain"
            value={hostname}
            onChange={(e) => onHostnameChange(e.target.value)}
            placeholder="printer"
            error={hostnameError}
            hint={`Your device will be accessible at https://${fullHostname}`}
          />
          
          {/* Preview */}
          <div className="mt-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
            <p className="text-xs text-surface-500 mb-1">Public URL Preview</p>
            <p className="font-mono text-sm text-freemen-400">https://{fullHostname}</p>
          </div>
        </div>

        {/* Tunnel Name */}
        <Input
          label="Tunnel Name"
          value={tunnelName}
          onChange={(e) => onTunnelNameChange(e.target.value)}
          placeholder="freemen-printer-proxy"
          hint="A friendly name for your Cloudflare Tunnel"
          leftIcon={<Server className="w-5 h-5" />}
        />
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 rounded-xl bg-surface-900/50 border border-surface-800">
        <h4 className="text-sm font-medium text-surface-300 mb-2">What happens next:</h4>
        <ul className="text-sm text-surface-400 space-y-1">
          <li>• A Cloudflare Tunnel will be created with this name</li>
          <li>• A DNS CNAME record will point to your tunnel</li>
          <li>• Traffic will be encrypted end-to-end</li>
          <li>• No port forwarding needed on your router</li>
        </ul>
      </div>
    </div>
  );
}
