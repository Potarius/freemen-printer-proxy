/**
 * Step 9: Success / Final
 * Displays provisioning success with package preview
 */

import { useState } from 'react';
import { CheckCircle, Download, ExternalLink, Copy, Terminal, FolderOpen, ChevronDown, ChevronUp, HardDrive, Zap } from 'lucide-react';
import { Button } from '../../ui/Button';
import { PackagePreview } from '../PackagePreview';
import { SDWriteWizard } from '../../sd-write';
import type { DevicePackage, DevicePackageFile, PiSetupConfig, TargetPlatform } from '../../../types';

interface SuccessStepProps {
  targetPlatform: TargetPlatform;
  hostname: string;
  tunnelName: string;
  tunnelToken?: string;
  deviceId: string;
  devicePackage?: DevicePackage | null;
  outputPath?: string;
  onDownload: () => void;
  onDownloadFile?: (file: DevicePackageFile) => void;
  onOpenFolder: () => void;
  onCopySteps?: () => void;
  onNewDevice: () => void;
}

export function SuccessStep({
  targetPlatform,
  hostname,
  tunnelName,
  tunnelToken,
  deviceId,
  devicePackage,
  outputPath,
  onDownload,
  onDownloadFile,
  onOpenFolder,
  onCopySteps,
  onNewDevice,
}: SuccessStepProps) {
  const [showPackagePreview, setShowPackagePreview] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showSDWizard, setShowSDWizard] = useState(false);
  const [sdWriteComplete, setSDWriteComplete] = useState(false);
  const [piConfig, setPiConfig] = useState<PiSetupConfig>(() => {
    const hostnamePrefix = hostname.split('.')[0] || 'freemen-pi';
    return {
      hostname: hostnamePrefix.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 63) || 'freemen-pi',
      username: 'freemen',
      password: `freemen-${Math.random().toString(36).slice(2, 10)}`,
      wifiSsid: '',
      wifiPassword: '',
      wifiCountry: 'US',
      enableSsh: true,
      timezone: 'America/New_York',
      locale: 'en_US.UTF-8',
      keyboardLayout: 'us',
    };
  });

  const isRaspberryPi = targetPlatform === 'raspberry-pi';
  const canPrepareSd = piConfig.hostname.length >= 2 && piConfig.username.length >= 2 && piConfig.password.length >= 8;
  const shouldGatePiFinish = isRaspberryPi && !sdWriteComplete;

  const copyToClipboard = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label || text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleSDWriteComplete = () => {
    setShowSDWizard(false);
    setSDWriteComplete(true);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {showSDWizard && isRaspberryPi && (
        <SDWriteWizard
          config={piConfig}
          tunnelToken={tunnelToken}
          onComplete={handleSDWriteComplete}
          onCancel={() => setShowSDWizard(false)}
        />
      )}

      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping opacity-25" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Provisioning Complete!</h2>
        <p className="text-surface-400">
          {isRaspberryPi
            ? (sdWriteComplete ? 'Your SD card is ready to boot' : 'Cloudflare provisioning is complete, now prepare your SD card')
            : 'Your device configuration is ready to deploy'}
        </p>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <InfoCard label="Public URL" value={`https://${hostname}`} copiable onCopy={() => copyToClipboard(`https://${hostname}`)} />
        <InfoCard label="Tunnel Name" value={tunnelName} />
        <InfoCard label="Device ID" value={deviceId} copiable onCopy={() => copyToClipboard(deviceId)} />
        <InfoCard
          label="Status"
          value={isRaspberryPi ? (sdWriteComplete ? 'SD Card Ready' : 'SD Preparation Required') : 'Ready to deploy'}
          success={!isRaspberryPi || sdWriteComplete}
        />
      </div>

      {/* Output path indicator */}
      {outputPath && (
        <div className="p-3 rounded-lg bg-surface-900/50 border border-surface-800 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <FolderOpen className="w-4 h-4 text-surface-400" />
            <span className="text-surface-400">Output:</span>
            <code className="text-freemen-400 font-mono text-xs truncate flex-1">{outputPath}</code>
            <button
              onClick={() => copyToClipboard(outputPath, 'path')}
              className="p-1 hover:bg-surface-700 rounded transition-colors"
            >
              {copiedText === 'path' ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-surface-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {isRaspberryPi ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/30 mb-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Prepare SD Card</h3>
              <p className="text-sm text-surface-300">
                Finish the Raspberry Pi flow by writing headless boot files directly to the SD card.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label className="text-sm text-surface-300">
              Pi hostname
              <input
                value={piConfig.hostname}
                onChange={(e) => setPiConfig((prev) => ({ ...prev, hostname: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 63) }))}
                className="mt-1 w-full rounded-lg bg-surface-900 border border-surface-700 px-3 py-2 text-white"
                placeholder="freemen-pi"
              />
            </label>
            <label className="text-sm text-surface-300">
              Username
              <input
                value={piConfig.username}
                onChange={(e) => setPiConfig((prev) => ({ ...prev, username: e.target.value }))}
                className="mt-1 w-full rounded-lg bg-surface-900 border border-surface-700 px-3 py-2 text-white"
                placeholder="freemen"
              />
            </label>
            <label className="text-sm text-surface-300 md:col-span-2">
              Password
              <input
                value={piConfig.password}
                onChange={(e) => setPiConfig((prev) => ({ ...prev, password: e.target.value }))}
                className="mt-1 w-full rounded-lg bg-surface-900 border border-surface-700 px-3 py-2 text-white"
                placeholder="Minimum 8 characters"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowSDWizard(true)}
              disabled={!canPrepareSd}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              leftIcon={<Zap className="w-4 h-4" />}
            >
              {sdWriteComplete ? 'Re-run SD Card Preparation' : 'Prepare SD Card'}
            </Button>
            {sdWriteComplete && (
              <>
                <Button variant="secondary" onClick={onOpenFolder} leftIcon={<FolderOpen className="w-4 h-4" />}>
                  Open Package Folder
                </Button>
                <Button variant="ghost" onClick={onDownload} leftIcon={<Download className="w-4 h-4" />}>
                  Download Package Backup
                </Button>
              </>
            )}
          </div>

          {shouldGatePiFinish && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-300">
                Complete SD card preparation first. Backup package actions unlock after a successful SD write.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-8">
          <h3 className="font-semibold text-white mb-4">Download Configuration</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onDownload} leftIcon={<Download className="w-4 h-4" />}>
              Download Package
            </Button>
            <Button variant="secondary" onClick={onOpenFolder} leftIcon={<FolderOpen className="w-4 h-4" />}>
              Open Folder
            </Button>
            {onCopySteps && (
              <Button variant="ghost" onClick={onCopySteps} leftIcon={<Copy className="w-4 h-4" />}>
                Copy Deploy Steps
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Package preview (collapsible) */}
      {devicePackage && (!isRaspberryPi || sdWriteComplete) && (
        <div className="mb-8">
          <button
            onClick={() => setShowPackagePreview(!showPackagePreview)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-900/30 border border-surface-800 hover:bg-surface-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-surface-400" />
              <span className="font-medium text-white">View Generated Files</span>
              <span className="text-xs text-surface-500">
                {devicePackage.files.length} files
              </span>
            </div>
            {showPackagePreview ? (
              <ChevronUp className="w-5 h-5 text-surface-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-surface-400" />
            )}
          </button>
          
          {showPackagePreview && (
            <div className="mt-4 p-4 rounded-xl bg-surface-900/20 border border-surface-800">
              <PackagePreview
                package={devicePackage}
                onDownloadFile={onDownloadFile}
                onDownloadAll={onDownload}
                onOpenFolder={onOpenFolder}
                onCopySteps={onCopySteps}
              />
            </div>
          )}
        </div>
      )}

      {/* Next steps */}
      <div className="p-6 rounded-2xl bg-freemen-500/5 border border-freemen-500/20 mb-8">
        <h3 className="font-semibold text-white mb-4">Next Steps</h3>
        {isRaspberryPi ? (
          <ol className="space-y-4">
            <NextStepItem number={1} title="Prepare and eject SD card">
              <p>{sdWriteComplete ? 'SD card is configured. Safely eject it from this computer.' : 'Click “Prepare SD Card”, select your boot partition, and complete the write.'}</p>
            </NextStepItem>
            <NextStepItem number={2} title="Boot your Raspberry Pi">
              <p>Insert the SD card, power on the Pi, and wait 1-2 minutes for first-boot configuration.</p>
            </NextStepItem>
            <NextStepItem number={3} title="Access your endpoint">
              <p>
                Open <a href={`https://${hostname}`} target="_blank" rel="noopener noreferrer" className="text-freemen-400 hover:underline">{`https://${hostname}`}</a> after the Pi is online.
              </p>
            </NextStepItem>
          </ol>
        ) : (
          <ol className="space-y-4">
            <NextStepItem number={1} title="Transfer files to your device">
              <p>Copy the downloaded configuration files to your target device</p>
            </NextStepItem>
            <NextStepItem number={2} title="Run the setup script">
              <div className="mt-2 p-3 rounded-lg bg-surface-900/80 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <code className="text-freemen-400">chmod +x setup.sh && ./setup.sh</code>
                  <button
                    onClick={() => copyToClipboard('chmod +x setup.sh && ./setup.sh')}
                    className="p-1.5 hover:bg-surface-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>
            </NextStepItem>
            <NextStepItem number={3} title="Verify the connection">
              <p>
                Visit <a href={`https://${hostname}`} target="_blank" rel="noopener noreferrer" className="text-freemen-400 hover:underline">{`https://${hostname}`}</a> to verify your device is accessible
              </p>
            </NextStepItem>
          </ol>
        )}
      </div>

      {/* Documentation link */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/30 border border-surface-800">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-surface-400" />
          <span className="text-surface-300">Need help? Check the deployment documentation</span>
        </div>
        <a
          href="#"
          className="flex items-center gap-2 text-freemen-400 hover:text-freemen-300 text-sm font-medium"
        >
          View Docs <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* New device button */}
      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={onNewDevice} disabled={shouldGatePiFinish}>
          Provision Another Device
        </Button>
        {shouldGatePiFinish && (
          <p className="text-xs text-surface-500 mt-2">
            Finish SD card preparation before starting a new device.
          </p>
        )}
      </div>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  copiable?: boolean;
  success?: boolean;
  onCopy?: () => void;
}

function InfoCard({ label, value, copiable, success, onCopy }: InfoCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
      <p className="text-xs text-surface-500 mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className={`font-medium truncate ${success ? 'text-green-400' : 'text-white'}`}>
          {value}
        </p>
        {copiable && onCopy && (
          <button onClick={onCopy} className="p-1 hover:bg-surface-700 rounded transition-colors flex-shrink-0 ml-2">
            <Copy className="w-3.5 h-3.5 text-surface-400" />
          </button>
        )}
      </div>
    </div>
  );
}

interface NextStepItemProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function NextStepItem({ number, title, children }: NextStepItemProps) {
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
