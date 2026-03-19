/**
 * Step 7: Review Summary
 */

import { ClipboardList, Globe, Server, Link, Settings, Cpu } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { TargetPlatform, CloudflareZone } from '../../../types';

interface SummaryStepProps {
  platform: TargetPlatform;
  zone: CloudflareZone | null;
  hostname: string;
  tunnelName: string;
  deviceName: string;
}

export function SummaryStep({ platform, zone, hostname, tunnelName, deviceName }: SummaryStepProps) {
  const fullHostname = zone ? `${hostname}.${zone.name}` : hostname;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-freemen-500/20 flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8 text-freemen-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Review Configuration</h2>
        <p className="text-surface-400">Please review your settings before provisioning</p>
      </div>

      <div className="space-y-4">
        {/* Platform */}
        <SummaryCard
          icon={<Cpu className="w-5 h-5" />}
          label="Target Platform"
          value={platform === 'raspberry-pi' ? 'Raspberry Pi' : 'Ubuntu / Linux'}
        />

        {/* Domain */}
        <SummaryCard
          icon={<Globe className="w-5 h-5" />}
          label="Domain"
          value={zone?.name || 'Not selected'}
          badge={zone?.status === 'active' ? <Badge variant="success" dot>Active</Badge> : undefined}
        />

        {/* Public URL */}
        <SummaryCard
          icon={<Link className="w-5 h-5" />}
          label="Public URL"
          value={`https://${fullHostname}`}
          highlight
        />

        {/* Tunnel */}
        <SummaryCard
          icon={<Server className="w-5 h-5" />}
          label="Tunnel Name"
          value={tunnelName}
        />

        {/* Device */}
        <SummaryCard
          icon={<Settings className="w-5 h-5" />}
          label="Device Name"
          value={deviceName}
        />
      </div>

      {/* What will happen */}
      <div className="mt-8 p-5 rounded-xl bg-surface-900/50 border border-surface-800">
        <h4 className="font-medium text-white mb-3">What happens next:</h4>
        <ol className="space-y-2 text-sm text-surface-400">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 text-xs font-semibold flex items-center justify-center">1</span>
            <span>Create Cloudflare Tunnel "<strong className="text-surface-200">{tunnelName}</strong>"</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 text-xs font-semibold flex items-center justify-center">2</span>
            <span>Configure DNS record for <strong className="text-surface-200">{fullHostname}</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 text-xs font-semibold flex items-center justify-center">3</span>
            <span>Generate configuration files for your device</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-500/20 text-freemen-400 text-xs font-semibold flex items-center justify-center">4</span>
            <span>Create deployment package ready for download</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
  highlight?: boolean;
}

function SummaryCard({ icon, label, value, badge, highlight }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-900/50 border border-surface-800">
      <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-500">{label}</p>
        <p className={`font-medium truncate ${highlight ? 'text-freemen-400 font-mono text-sm' : 'text-white'}`}>
          {value}
        </p>
      </div>
      {badge}
    </div>
  );
}
