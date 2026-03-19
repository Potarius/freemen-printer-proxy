/**
 * Step 9: Success / Final
 */

import { CheckCircle, Download, ExternalLink, Copy, Terminal, FolderOpen } from 'lucide-react';
import { Button } from '../../ui/Button';

interface SuccessStepProps {
  hostname: string;
  tunnelName: string;
  deviceId: string;
  onDownload: () => void;
  onOpenFolder: () => void;
  onNewDevice: () => void;
}

export function SuccessStep({
  hostname,
  tunnelName,
  deviceId,
  onDownload,
  onOpenFolder,
  onNewDevice,
}: SuccessStepProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle className="w-12 h-12 text-green-400" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping opacity-25" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Provisioning Complete!</h2>
        <p className="text-surface-400">Your device configuration is ready to deploy</p>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <InfoCard label="Public URL" value={`https://${hostname}`} copiable onCopy={() => copyToClipboard(`https://${hostname}`)} />
        <InfoCard label="Tunnel Name" value={tunnelName} />
        <InfoCard label="Device ID" value={deviceId} copiable onCopy={() => copyToClipboard(deviceId)} />
        <InfoCard label="Status" value="Ready to deploy" success />
      </div>

      {/* Actions */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4">Download Configuration</h3>
        <div className="flex gap-4">
          <Button onClick={onDownload} leftIcon={<Download className="w-4 h-4" />}>
            Download Package
          </Button>
          <Button variant="secondary" onClick={onOpenFolder} leftIcon={<FolderOpen className="w-4 h-4" />}>
            Open Folder
          </Button>
        </div>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-2xl bg-freemen-500/5 border border-freemen-500/20 mb-8">
        <h3 className="font-semibold text-white mb-4">Next Steps</h3>
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
