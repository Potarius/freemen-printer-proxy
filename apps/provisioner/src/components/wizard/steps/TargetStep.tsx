/**
 * Step 2: Target Platform Selection
 */

import { Server, Cpu } from 'lucide-react';
import { SelectableCard } from '../../ui/Card';
import { TargetPlatform } from '../../../types';

interface TargetStepProps {
  value: TargetPlatform;
  onChange: (value: TargetPlatform) => void;
}

export function TargetStep({ value, onChange }: TargetStepProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Target Platform</h2>
        <p className="text-surface-400">Choose the device where you'll deploy the printer proxy</p>
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        <SelectableCard
          icon={<Cpu className="w-7 h-7" />}
          title="Raspberry Pi"
          description="ARM64 device running Raspberry Pi OS or similar"
          selected={value === 'raspberry-pi'}
          onClick={() => onChange('raspberry-pi')}
        />
        
        <SelectableCard
          icon={<Server className="w-7 h-7" />}
          title="Ubuntu / Linux"
          description="Standard Linux server or desktop (AMD64 or ARM64)"
          selected={value === 'linux'}
          onClick={() => onChange('linux')}
        />
      </div>

      <div className="mt-8 p-4 rounded-xl bg-surface-900/50 border border-surface-800 max-w-xl mx-auto">
        <h4 className="text-sm font-medium text-surface-300 mb-2">What's included:</h4>
        <ul className="text-sm text-surface-400 space-y-1">
          <li>• Platform-specific setup script</li>
          <li>• Docker Compose configuration</li>
          <li>• Cloudflare Tunnel integration</li>
          <li>• Ready-to-use configuration files</li>
        </ul>
      </div>
    </div>
  );
}
