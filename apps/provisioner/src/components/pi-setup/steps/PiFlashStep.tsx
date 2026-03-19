/**
 * Pi Setup - Flash SD Card Step
 */

import { useState } from 'react';
import { 
  Download, 
  HardDrive, 
  ExternalLink, 
  CheckCircle, 
  Circle,
  AlertTriangle,
  Monitor,
} from 'lucide-react';
import { Button } from '../../ui/Button';

interface PiFlashStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PiFlashStep({ onNext, onBack }: PiFlashStepProps) {
  const [checklist, setChecklist] = useState({
    downloaded: false,
    opened: false,
    selected: false,
    flashed: false,
    ejected: false,
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const toggleItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
          <HardDrive className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Flash Raspberry Pi OS
        </h2>
        <p className="text-surface-400">
          Download and flash Raspberry Pi OS Lite (64-bit) to your microSD card
        </p>
      </div>

      {/* Important notice */}
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-8">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-400 mb-1">Important</h3>
            <p className="text-sm text-surface-300">
              Use <strong>Raspberry Pi OS Lite (64-bit)</strong> — not the Desktop version.
              The Lite version is smaller and optimized for headless use.
            </p>
          </div>
        </div>
      </div>

      {/* Download Imager */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-white mb-1">Raspberry Pi Imager</h3>
            <p className="text-sm text-surface-400">
              Official tool for flashing Raspberry Pi OS to SD cards
            </p>
          </div>
          <a
            href="https://www.raspberrypi.com/software/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
              Download
              <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
            </Button>
          </a>
        </div>

        {/* Visual guide */}
        <div className="p-4 rounded-xl bg-surface-950 border border-surface-800">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-surface-500" />
            <span className="text-xs font-medium text-surface-500 uppercase">
              Imager Settings
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-surface-900">
              <p className="text-xs text-surface-500 mb-1">Device</p>
              <p className="text-sm font-medium text-white">Raspberry Pi 4/5</p>
            </div>
            <div className="p-3 rounded-lg bg-freemen-500/10 border border-freemen-500/30">
              <p className="text-xs text-surface-500 mb-1">OS</p>
              <p className="text-sm font-medium text-freemen-400">
                Pi OS Lite (64-bit)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-900">
              <p className="text-xs text-surface-500 mb-1">Storage</p>
              <p className="text-sm font-medium text-white">Your SD Card</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-8">
        <h3 className="font-semibold text-white mb-4">Checklist</h3>
        <div className="space-y-3">
          <ChecklistItem
            checked={checklist.downloaded}
            onToggle={() => toggleItem('downloaded')}
            title="Downloaded Raspberry Pi Imager"
            description="Installed on this computer"
          />
          <ChecklistItem
            checked={checklist.opened}
            onToggle={() => toggleItem('opened')}
            title="Opened Raspberry Pi Imager"
            description="Application is running"
          />
          <ChecklistItem
            checked={checklist.selected}
            onToggle={() => toggleItem('selected')}
            title="Selected Raspberry Pi OS Lite (64-bit)"
            description="Under 'Raspberry Pi OS (other)'"
          />
          <ChecklistItem
            checked={checklist.flashed}
            onToggle={() => toggleItem('flashed')}
            title="Flashed to SD card"
            description="Wait for write and verification to complete"
          />
          <ChecklistItem
            checked={checklist.ejected}
            onToggle={() => toggleItem('ejected')}
            title="Safely ejected SD card"
            description="Then re-insert it to access the boot partition"
          />
        </div>
      </div>

      {/* Pro tip */}
      <div className="p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20 mb-8">
        <h4 className="font-medium text-freemen-400 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-surface-300">
          <strong>Skip the Imager's OS customization.</strong> We'll configure 
          everything in the next steps using files that are more reliable 
          and can be re-used.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!allChecked}>
          {allChecked ? 'Continue' : 'Complete checklist to continue'}
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({
  checked,
  onToggle,
  title,
  description,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
        checked
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-surface-900/50 border border-surface-800 hover:bg-surface-800/50'
      }`}
    >
      <div className="mt-0.5">
        {checked ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <Circle className="w-5 h-5 text-surface-500" />
        )}
      </div>
      <div>
        <p className={`font-medium ${checked ? 'text-green-400' : 'text-white'}`}>
          {title}
        </p>
        <p className="text-sm text-surface-400">{description}</p>
      </div>
    </button>
  );
}
