/**
 * Step: Success / Final
 * Shown after all provisioning and SD card flashing is complete.
 */

import { useState } from 'react';
import { CheckCircle, Download, ExternalLink, Copy, Terminal, FolderOpen, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { PackagePreview } from '../PackagePreview';
import type { DevicePackage, DevicePackageFile, TargetPlatform } from '../../../types';

interface SuccessStepProps {
  targetPlatform: TargetPlatform;
  hostname: string;
  tunnelName: string;
  tunnelToken?: string;
  proxyApiKey: string;
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
  proxyApiKey,
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

  const isRaspberryPi = targetPlatform === 'raspberry-pi';

  const copyToClipboard = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label || text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping opacity-25" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          {isRaspberryPi ? 'SD Card Ready!' : 'Provisioning Complete!'}
        </h2>
        <p className="text-surface-400">
          {isRaspberryPi
            ? 'Your SD card is flashed and configured. Insert it into the Pi and power on.'
            : 'Your device configuration is ready to deploy.'}
        </p>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <InfoCard label="Public URL" value={`https://${hostname}`} copiable onCopy={() => copyToClipboard(`https://${hostname}`)} />
        <InfoCard label="Tunnel Name" value={tunnelName} />
        <InfoCard label="Device ID" value={deviceId} copiable onCopy={() => copyToClipboard(deviceId)} />
        <InfoCard label="Status" value="Ready" success />
      </div>

      {/* Output path */}
      {outputPath && (
        <div className="p-3 rounded-lg bg-surface-900/50 border border-surface-800 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <FolderOpen className="w-4 h-4 text-surface-400" />
            <span className="text-surface-400">Package saved to:</span>
            <code className="text-freemen-400 font-mono text-xs truncate flex-1">{outputPath}</code>
            <button onClick={() => copyToClipboard(outputPath, 'path')} className="p-1 hover:bg-surface-700 rounded transition-colors">
              {copiedText === 'path'
                ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                : <Copy className="w-3.5 h-3.5 text-surface-400" />}
            </button>
          </div>
        </div>
      )}

      {/* API Key reminder */}
      {proxyApiKey && (
        <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/40 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">API Key — save this</h3>
              <p className="text-sm text-yellow-200/70">
                Already embedded in your device. Store it in your ERP or cloud server as the{' '}
                <code className="bg-yellow-500/20 px-1 rounded text-yellow-300">x-api-key</code> header value.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-950 border border-yellow-500/30">
            <code className="flex-1 font-mono text-sm text-yellow-300 break-all select-all">{proxyApiKey}</code>
            <button
              onClick={() => copyToClipboard(proxyApiKey, 'apiKey')}
              className="flex-shrink-0 p-2 hover:bg-surface-800 rounded-lg transition-colors"
              title="Copy API key"
            >
              {copiedText === 'apiKey'
                ? <CheckCircle className="w-4 h-4 text-green-400" />
                : <Copy className="w-4 h-4 text-yellow-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Package actions */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4">Device Package</h3>
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

      {/* Package file preview (collapsible) */}
      {devicePackage && (
        <div className="mb-8">
          <button
            onClick={() => setShowPackagePreview(!showPackagePreview)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-900/30 border border-surface-800 hover:bg-surface-900/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-surface-400" />
              <span className="font-medium text-white">View Generated Files</span>
              <span className="text-xs text-surface-500">{devicePackage.files.length} files</span>
            </div>
            {showPackagePreview ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
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
            <NextStepItem number={1} title="Insert SD card and power on">
              <p>Put the SD card in your Raspberry Pi and power it on. First-boot setup runs automatically (2–5 min).</p>
            </NextStepItem>
            <NextStepItem number={2} title="Wait for the tunnel to connect">
              <p>The Pi will install Docker, cloudflared, and start the printer proxy on first boot.</p>
            </NextStepItem>
            <NextStepItem number={3} title="Access your endpoint">
              <p>
                Once online, your proxy is available at{' '}
                <a href={`https://${hostname}`} target="_blank" rel="noopener noreferrer" className="text-freemen-400 hover:underline">
                  {`https://${hostname}`}
                </a>
                . Use the API key above to authenticate.
              </p>
            </NextStepItem>
          </ol>
        ) : (
          <ol className="space-y-4">
            <NextStepItem number={1} title="Transfer files to your device">
              <p>Copy the downloaded configuration files to your target device.</p>
            </NextStepItem>
            <NextStepItem number={2} title="Run the setup script">
              <div className="mt-2 p-3 rounded-lg bg-surface-900/80 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <code className="text-freemen-400">chmod +x setup.sh && ./setup.sh</code>
                  <button onClick={() => copyToClipboard('chmod +x setup.sh && ./setup.sh')} className="p-1.5 hover:bg-surface-700 rounded transition-colors">
                    <Copy className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>
            </NextStepItem>
            <NextStepItem number={3} title="Verify the connection">
              <p>
                Visit{' '}
                <a href={`https://${hostname}`} target="_blank" rel="noopener noreferrer" className="text-freemen-400 hover:underline">
                  {`https://${hostname}`}
                </a>{' '}
                to verify your device is accessible.
              </p>
            </NextStepItem>
          </ol>
        )}
      </div>

      {/* Docs link */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/30 border border-surface-800 mb-8">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-surface-400" />
          <span className="text-surface-300">Need help? Check the deployment documentation</span>
        </div>
        <a href="#" className="flex items-center gap-2 text-freemen-400 hover:text-freemen-300 text-sm font-medium">
          View Docs <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onNewDevice}>
          Provision Another Device
        </Button>
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
