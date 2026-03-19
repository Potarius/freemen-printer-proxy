/**
 * SD Write Wizard
 * Premium multi-step flow for writing Pi configuration to SD card
 */

import { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
  CircleDot,
  Wifi,
  Key,
  FileText,
  Shield,
  Cpu,
  ExternalLink,
  X,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { PiSetupConfig, DevicePackage } from '../../types';
import {
  detectDrives,
  writeToSDCard,
  looksLikePiBootPartition,
  formatBytes,
  getDriveDisplayName,
  type DetectedDrive,
  type SDWriteProgress,
  type SDWriteResult,
} from '../../services/sd-card-service';

// ============================================
// TYPES
// ============================================

interface SDWriteWizardProps {
  config: PiSetupConfig;
  devicePackage?: DevicePackage;
  onComplete: (result: SDWriteResult) => void;
  onCancel: () => void;
}

type WizardStep = 'select' | 'confirm' | 'writing' | 'complete';

// ============================================
// MAIN COMPONENT
// ============================================

export function SDWriteWizard({
  config,
  devicePackage,
  onComplete,
  onCancel,
}: SDWriteWizardProps) {
  const [step, setStep] = useState<WizardStep>('select');
  const [drives, setDrives] = useState<DetectedDrive[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<DetectedDrive | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [writeProgress, setWriteProgress] = useState<SDWriteProgress | null>(null);
  const [writeResult, setWriteResult] = useState<SDWriteResult | null>(null);

  // Detect drives on mount
  useEffect(() => {
    handleDetectDrives();
  }, []);

  const handleDetectDrives = useCallback(async () => {
    setIsDetecting(true);
    setDetectError(null);

    try {
      const detectedDrives = await detectDrives();
      setDrives(detectedDrives);

      // Auto-select if there's a likely boot partition
      const bootDrive = detectedDrives.find(looksLikePiBootPartition);
      if (bootDrive) {
        setSelectedDrive(bootDrive);
      }
    } catch (error) {
      setDetectError(`Failed to detect drives: ${error}`);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const handleConfirm = () => {
    if (selectedDrive) {
      setStep('confirm');
    }
  };

  const handleStartWrite = async () => {
    if (!selectedDrive) return;

    setStep('writing');
    setWriteProgress(null);

    const bootPath = `${selectedDrive.letter}:`;

    try {
      const result = await writeToSDCard(
        bootPath,
        config,
        devicePackage,
        (progress) => setWriteProgress(progress)
      );

      setWriteResult(result);
      setStep('complete');

      if (result.success) {
        onComplete(result);
      }
    } catch (error) {
      setWriteResult({
        success: false,
        filesWritten: [],
        errors: [`Write failed: ${error}`],
        bootPath,
      });
      setStep('complete');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl mx-4 bg-surface-900 rounded-2xl border border-surface-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Prepare SD Card</h2>
              <p className="text-xs text-surface-500">
                {step === 'select' && 'Select your SD card'}
                {step === 'confirm' && 'Confirm write operation'}
                {step === 'writing' && 'Writing files...'}
                {step === 'complete' && 'Complete'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
            disabled={step === 'writing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 border-b border-surface-800 bg-surface-900/50">
          <div className="flex items-center gap-2">
            {(['select', 'confirm', 'writing', 'complete'] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step === s
                      ? 'bg-freemen-500'
                      : (['select', 'confirm', 'writing', 'complete'].indexOf(step) > i)
                      ? 'bg-green-500'
                      : 'bg-surface-700'
                  }`}
                />
                {i < 3 && <div className="w-8 h-px bg-surface-700 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 'select' && (
            <SelectDriveStep
              drives={drives}
              selectedDrive={selectedDrive}
              onSelect={setSelectedDrive}
              isDetecting={isDetecting}
              error={detectError}
              onRefresh={handleDetectDrives}
            />
          )}

          {step === 'confirm' && selectedDrive && (
            <ConfirmStep
              drive={selectedDrive}
              config={config}
              devicePackage={devicePackage}
            />
          )}

          {step === 'writing' && (
            <WritingStep progress={writeProgress} />
          )}

          {step === 'complete' && writeResult && (
            <CompleteStep result={writeResult} config={config} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-800 flex justify-between">
          {step === 'select' && (
            <>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedDrive}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                onClick={handleStartWrite}
                variant="primary"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                Write to SD Card
              </Button>
            </>
          )}

          {step === 'writing' && (
            <div className="w-full text-center text-surface-400 text-sm">
              Please wait, do not remove the SD card...
            </div>
          )}

          {step === 'complete' && (
            <>
              <div />
              <Button onClick={onCancel}>
                {writeResult?.success ? 'Done' : 'Close'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SELECT DRIVE STEP
// ============================================

function SelectDriveStep({
  drives,
  selectedDrive,
  onSelect,
  isDetecting,
  error,
  onRefresh,
}: {
  drives: DetectedDrive[];
  selectedDrive: DetectedDrive | null;
  onSelect: (drive: DetectedDrive) => void;
  isDetecting: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const removableDrives = drives.filter(d => d.isRemovable);
  const otherDrives = drives.filter(d => !d.isRemovable);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <HardDrive className="w-12 h-12 text-surface-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Select SD Card Boot Partition
        </h3>
        <p className="text-sm text-surface-400">
          Insert your flashed SD card and select the <strong>boot</strong> partition
        </p>
      </div>

      {/* Refresh button */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isDetecting}
          leftIcon={
            isDetecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )
          }
        >
          {isDetecting ? 'Detecting...' : 'Refresh'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Drive list */}
      {!isDetecting && drives.length === 0 && (
        <div className="p-8 rounded-xl border-2 border-dashed border-surface-700 text-center">
          <CircleDot className="w-10 h-10 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 mb-2">No removable drives detected</p>
          <p className="text-sm text-surface-500">
            Insert your SD card and click Refresh
          </p>
        </div>
      )}

      {removableDrives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-surface-500 uppercase">
            Removable Drives
          </p>
          {removableDrives.map((drive) => (
            <DriveOption
              key={drive.letter}
              drive={drive}
              isSelected={selectedDrive?.letter === drive.letter}
              onSelect={() => onSelect(drive)}
              recommended={looksLikePiBootPartition(drive)}
            />
          ))}
        </div>
      )}

      {otherDrives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-surface-500 uppercase">
            Other Drives (use with caution)
          </p>
          {otherDrives.map((drive) => (
            <DriveOption
              key={drive.letter}
              drive={drive}
              isSelected={selectedDrive?.letter === drive.letter}
              onSelect={() => onSelect(drive)}
              recommended={false}
            />
          ))}
        </div>
      )}

      {/* Imager link */}
      <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
        <p className="text-sm text-surface-400 mb-2">
          Don't have Raspberry Pi OS on your SD card yet?
        </p>
        <a
          href="https://www.raspberrypi.com/software/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-freemen-400 hover:text-freemen-300 flex items-center gap-1"
        >
          Download Raspberry Pi Imager
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function DriveOption({
  drive,
  isSelected,
  onSelect,
  recommended,
}: {
  drive: DetectedDrive;
  isSelected: boolean;
  onSelect: () => void;
  recommended: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        isSelected
          ? 'bg-freemen-500/10 border-freemen-500/50'
          : 'bg-surface-900/50 border-surface-700 hover:bg-surface-800/50 hover:border-surface-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSelected ? 'bg-freemen-500/20' : 'bg-surface-800'
            }`}
          >
            {drive.isRemovable ? (
              <CircleDot className={`w-5 h-5 ${isSelected ? 'text-freemen-400' : 'text-surface-400'}`} />
            ) : (
              <HardDrive className={`w-5 h-5 ${isSelected ? 'text-freemen-400' : 'text-surface-400'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isSelected ? 'text-freemen-400' : 'text-white'}`}>
                {drive.letter}:
              </span>
              <span className="text-surface-300">{drive.label || 'Removable'}</span>
              {recommended && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-sm text-surface-500">
              {formatBytes(drive.size)} • {drive.fileSystem} • {drive.driveType}
            </p>
          </div>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected ? 'border-freemen-500 bg-freemen-500' : 'border-surface-600'
          }`}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

// ============================================
// CONFIRM STEP
// ============================================

function ConfirmStep({
  drive,
  config,
  devicePackage,
}: {
  drive: DetectedDrive;
  config: PiSetupConfig;
  devicePackage?: DevicePackage;
}) {
  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
        <div className="flex gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-orange-400 mb-1">
              Confirm Write Operation
            </h4>
            <p className="text-sm text-surface-300">
              This will write configuration files to <strong>{drive.letter}:</strong>
              <br />
              Existing files with the same names will be overwritten.
            </p>
          </div>
        </div>
      </div>

      {/* Target drive */}
      <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
        <p className="text-xs font-medium text-surface-500 uppercase mb-2">
          Target Drive
        </p>
        <div className="flex items-center gap-3">
          <CircleDot className="w-8 h-8 text-freemen-400" />
          <div>
            <p className="font-medium text-white">
              {getDriveDisplayName(drive)}
            </p>
            <p className="text-sm text-surface-400">{drive.fileSystem}</p>
          </div>
        </div>
      </div>

      {/* Files to write */}
      <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
        <p className="text-xs font-medium text-surface-500 uppercase mb-3">
          Files to Write
        </p>
        <div className="space-y-2">
          <FileItem icon={<Shield className="w-4 h-4" />} name="ssh" description="Enable SSH access" />
          <FileItem icon={<Key className="w-4 h-4" />} name="userconf.txt" description={`User: ${config.username}`} />
          {config.wifiSsid && (
            <FileItem icon={<Wifi className="w-4 h-4" />} name="wpa_supplicant.conf" description={`WiFi: ${config.wifiSsid}`} />
          )}
          <FileItem icon={<FileText className="w-4 h-4" />} name="firstrun.sh" description="First boot setup script" />
        </div>
      </div>

      {/* Configuration summary */}
      <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
        <p className="text-xs font-medium text-surface-500 uppercase mb-3">
          Configuration
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-surface-500">Hostname</p>
            <p className="text-white font-mono">{config.hostname}</p>
          </div>
          <div>
            <p className="text-surface-500">Username</p>
            <p className="text-white font-mono">{config.username}</p>
          </div>
          <div>
            <p className="text-surface-500">SSH</p>
            <p className="text-green-400">Enabled</p>
          </div>
          <div>
            <p className="text-surface-500">WiFi</p>
            <p className={config.wifiSsid ? 'text-green-400' : 'text-surface-500'}>
              {config.wifiSsid || 'Not configured'}
            </p>
          </div>
        </div>
        {devicePackage && (
          <div className="mt-3 pt-3 border-t border-surface-700">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-freemen-400" />
              <span className="text-sm text-freemen-400">
                Freemen device package will be included
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FileItem({
  icon,
  name,
  description,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-900/50">
      <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400">
        {icon}
      </div>
      <div>
        <p className="font-mono text-sm text-white">{name}</p>
        <p className="text-xs text-surface-500">{description}</p>
      </div>
    </div>
  );
}

// ============================================
// WRITING STEP
// ============================================

function WritingStep({ progress }: { progress: SDWriteProgress | null }) {
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="text-center py-8">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.83} 283`}
            className="text-freemen-500 transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-freemen-400 animate-spin" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        Writing to SD Card
      </h3>

      {progress && (
        <>
          <p className="text-surface-400 mb-4">{progress.message}</p>
          <div className="w-64 mx-auto">
            <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-freemen-500 to-pink-500 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-surface-500 mt-2">
              Step {progress.current} of {progress.total}
            </p>
          </div>
        </>
      )}

      <p className="text-sm text-yellow-400 mt-6">
        ⚠️ Do not remove the SD card
      </p>
    </div>
  );
}

// ============================================
// COMPLETE STEP
// ============================================

function CompleteStep({
  result,
  config,
}: {
  result: SDWriteResult;
  config: PiSetupConfig;
}) {
  return (
    <div className="text-center py-4">
      {result.success ? (
        <>
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            SD Card Ready!
          </h3>
          <p className="text-surface-400 mb-6">
            Your SD card is configured and ready for your Raspberry Pi
          </p>

          {/* Files written */}
          <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 text-left mb-6">
            <p className="text-xs font-medium text-surface-500 uppercase mb-2">
              Files Written
            </p>
            <div className="flex flex-wrap gap-2">
              {result.filesWritten.map((file) => (
                <span
                  key={file}
                  className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>

          {/* Next steps */}
          <div className="p-4 rounded-xl bg-freemen-500/10 border border-freemen-500/20 text-left">
            <h4 className="font-medium text-freemen-400 mb-3">Next Steps</h4>
            <ol className="text-sm text-surface-300 space-y-2 list-decimal list-inside">
              <li>Safely eject the SD card from your computer</li>
              <li>Insert the SD card into your Raspberry Pi</li>
              <li>Connect power to boot the Pi</li>
              <li>Wait 2-5 minutes for first boot setup</li>
              <li>
                Connect via SSH:
                <code className="ml-2 px-2 py-0.5 rounded bg-surface-800 text-freemen-400">
                  ssh {config.username}@{config.hostname}.local
                </code>
              </li>
            </ol>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Write Failed
          </h3>
          <p className="text-surface-400 mb-6">
            Some files could not be written to the SD card
          </p>

          {/* Errors */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
            <p className="text-xs font-medium text-red-400 uppercase mb-2">
              Errors
            </p>
            <ul className="text-sm text-red-300 space-y-1">
              {result.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>

          {result.filesWritten.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 text-left mt-4">
              <p className="text-xs font-medium text-surface-500 uppercase mb-2">
                Files Written Successfully
              </p>
              <div className="flex flex-wrap gap-2">
                {result.filesWritten.map((file) => (
                  <span
                    key={file}
                    className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
