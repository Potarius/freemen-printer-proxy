/**
 * Step 6: Device Configuration
 */

import { Settings, Printer } from 'lucide-react';
import { Input } from '../../ui/Input';

interface DeviceStepProps {
  deviceName: string;
  printerIp: string;
  printerPort: string;
  onDeviceNameChange: (value: string) => void;
  onPrinterIpChange: (value: string) => void;
  onPrinterPortChange: (value: string) => void;
}

export function DeviceStep({
  deviceName,
  printerIp,
  printerPort,
  onDeviceNameChange,
  onPrinterIpChange,
  onPrinterPortChange,
}: DeviceStepProps) {
  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-freemen-500/20 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-freemen-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Device Configuration</h2>
        <p className="text-surface-400">Configure your printer proxy device settings</p>
      </div>

      <div className="space-y-6">
        {/* Device Name */}
        <Input
          label="Device Name"
          value={deviceName}
          onChange={(e) => onDeviceNameChange(e.target.value)}
          placeholder="Office Printer Proxy"
          hint="A friendly name to identify this device"
        />

        {/* Printer Settings */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
              <Printer className="w-5 h-5 text-surface-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Printer Connection</h4>
              <p className="text-xs text-surface-500">Optional - can be configured later</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Printer IP"
              value={printerIp}
              onChange={(e) => onPrinterIpChange(e.target.value)}
              placeholder="192.168.1.100"
            />
            <Input
              label="Port"
              value={printerPort}
              onChange={(e) => onPrinterPortChange(e.target.value)}
              placeholder="9100"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl bg-freemen-500/10 border border-freemen-500/20">
        <p className="text-sm text-freemen-300">
          <strong>Tip:</strong> You can configure the printer connection later through the device's admin interface at <code className="bg-surface-800 px-1.5 py-0.5 rounded text-freemen-400">http://localhost:6500</code>
        </p>
      </div>
    </div>
  );
}
