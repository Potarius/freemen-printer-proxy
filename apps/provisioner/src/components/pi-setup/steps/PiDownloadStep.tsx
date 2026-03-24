/**
 * Pi Setup - Download OS Step
 *
 * Phase 1: OS selector — pick from Pi OS Lite, Ubuntu Server 24/22, Pi OS Desktop
 * Phase 2: Download  — checks if already cached, downloads with progress bar
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  Cpu,
  Server,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  isTauri,
  getDownloadPath,
  downloadOsImage,
  onDownloadProgress,
  cancelOperation,
  imageExists,
  formatBytes,
  OS_OPTIONS,
  type OsOption,
  type DownloadProgress,
} from '../../../services/os-flash-service';

// ============================================
// TYPES
// ============================================

type Phase = 'select' | 'checking' | 'ready' | 'downloading' | 'done' | 'error';

interface PiDownloadStepProps {
  onComplete: (imagePath: string) => void;
  onBack: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function PiDownloadStep({ onComplete, onBack }: PiDownloadStepProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedOs, setSelectedOs] = useState<OsOption>(OS_OPTIONS[0]);
  const [imagePath, setImagePath] = useState('');
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(0);

  const unlistenRef = useRef<(() => void) | null>(null);
  const prevRef = useRef({ downloaded: 0, ts: Date.now() });

  useEffect(() => () => { unlistenRef.current?.(); }, []);

  // Speed tracking
  useEffect(() => {
    if (!progress) return;
    const now = Date.now();
    const elapsed = (now - prevRef.current.ts) / 1000;
    if (elapsed >= 1) {
      setSpeed(Math.max(0, Math.round((progress.downloaded - prevRef.current.downloaded) / elapsed)));
      prevRef.current = { downloaded: progress.downloaded, ts: now };
    }
  }, [progress]);

  // When user clicks "Continue" on OS select screen
  const handleOsConfirm = useCallback(async () => {
    setError(null);
    setPhase('checking');

    if (!isTauri()) {
      setPhase('ready');
      setAlreadyExists(false);
      return;
    }

    try {
      const dir = await getDownloadPath();
      const path = `${dir}\\${selectedOs.filename}`;
      setImagePath(path);
      const found = await imageExists(path);
      setAlreadyExists(found);
      setPhase('ready');
    } catch {
      setAlreadyExists(false);
      setPhase('ready');
    }
  }, [selectedOs]);

  const handleDownload = useCallback(async () => {
    setError(null);
    setPhase('downloading');
    prevRef.current = { downloaded: 0, ts: Date.now() };

    try {
      const dir = await getDownloadPath();
      const path = `${dir}\\${selectedOs.filename}`;
      setImagePath(path);

      const unlisten = await onDownloadProgress((p) => setProgress(p));
      unlistenRef.current = unlisten;

      await downloadOsImage(selectedOs.url, path);

      unlisten();
      unlistenRef.current = null;
      setPhase('done');
      setTimeout(() => onComplete(path), 700);
    } catch (err) {
      unlistenRef.current?.();
      unlistenRef.current = null;
      const msg = String(err);
      if (msg === 'cancelled') {
        setPhase('ready');
        setProgress(null);
      } else {
        setError(msg);
        setPhase('error');
      }
    }
  }, [selectedOs, onComplete]);

  // ── RENDER ────────────────────────────────

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">

      {/* ── PHASE: OS SELECTION ── */}
      {phase === 'select' && (
        <>
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Choose Operating System</h2>
            <p className="text-surface-400">
              Select the OS to install on your Raspberry Pi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {OS_OPTIONS.map((os) => (
              <OsCard
                key={os.id}
                os={os}
                isSelected={selectedOs.id === os.id}
                onSelect={() => setSelectedOs(os)}
              />
            ))}
          </div>

          {/* Selected summary */}
          <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-700 mb-8">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-surface-400">Selected: </span>
                <span className="text-white font-medium">{selectedOs.name}</span>
              </div>
              <div className="flex gap-4 text-surface-500">
                <span>~{selectedOs.approxCompressedMb} MB download</span>
                <span>~{selectedOs.approxWrittenGb} GB on card</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={handleOsConfirm}>
              Continue with {selectedOs.name.split(' ').slice(0, 3).join(' ')} →
            </Button>
          </div>
        </>
      )}

      {/* ── PHASE: CHECKING ── */}
      {phase === 'checking' && (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 text-surface-400 animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Checking for existing download…</p>
        </div>
      )}

      {/* ── PHASE: READY ── */}
      {phase === 'ready' && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {alreadyExists ? 'Image Already Downloaded' : 'Ready to Download'}
            </h2>
            <p className="text-surface-400">{selectedOs.name}</p>
          </div>

          {alreadyExists ? (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/30">
                <div className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-400 mb-1">
                      Found on this machine
                    </h3>
                    <p className="text-sm text-surface-300">
                      No need to download again. Ready to flash.
                    </p>
                    <p className="text-xs text-surface-500 mt-2 font-mono break-all">
                      {imagePath}
                    </p>
                  </div>
                </div>
              </div>

              <OsInfoRow os={selectedOs} />

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPhase('select')}>
                    ← Change OS
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAlreadyExists(false); }}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Re-download
                  </Button>
                </div>
                <Button onClick={() => onComplete(imagePath)}>
                  Continue →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <OsInfoRow os={selectedOs} />

              <div className="p-4 rounded-xl bg-surface-900/30 border border-surface-800 text-sm text-surface-400 space-y-1">
                <p>• Approximately {selectedOs.approxCompressedMb} MB to download</p>
                <p>• ~{selectedOs.approxWrittenGb} GB once written to SD card</p>
                <p>• File is saved locally — no re-download needed next time</p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setPhase('select')}>
                  ← Change OS
                </Button>
                <Button
                  size="lg"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-5 h-5" />}
                >
                  Download {selectedOs.name.split(' ').slice(0, 3).join(' ')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PHASE: DOWNLOADING ── */}
      {phase === 'downloading' && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-blue-400 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Downloading…</h2>
            <p className="text-surface-400">{selectedOs.name}</p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="font-medium text-white">Downloading OS image</span>
              </div>
              <span className="text-sm tabular-nums text-surface-400">
                {progress ? `${progress.percent.toFixed(1)}%` : '—'}
              </span>
            </div>

            <div className="h-3 bg-surface-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-300 rounded-full"
                style={{ width: `${progress?.percent ?? 0}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-surface-500">
              <span>
                {progress
                  ? `${formatBytes(progress.downloaded)}${progress.total > 0 ? ` / ${formatBytes(progress.total)}` : ''}`
                  : 'Starting…'}
              </span>
              {speed > 0 && <span>{formatBytes(speed)}/s</span>}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => cancelOperation()}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* ── PHASE: DONE ── */}
      {phase === 'done' && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <p className="text-white font-semibold text-xl mb-1">Download complete!</p>
          <p className="text-surface-400">{selectedOs.name} is ready to flash</p>
        </div>
      )}

      {/* ── PHASE: ERROR ── */}
      {phase === 'error' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Download Failed</h2>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400 mb-1">Could not download image</p>
                <p className="text-sm text-surface-300">{error}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setPhase('select')}>← Change OS</Button>
            <Button onClick={() => { setError(null); handleDownload(); }}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// OS CARD  (selection grid)
// ============================================

function OsCard({
  os,
  isSelected,
  onSelect,
}: {
  os: OsOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const iconBg = os.variant === 'pi'
    ? 'bg-red-500/10'
    : 'bg-orange-500/10';
  const iconColor = os.variant === 'pi'
    ? 'text-red-400'
    : 'text-orange-400';
  const Icon = os.variant === 'pi' ? Cpu : Server;

  return (
    <button
      onClick={onSelect}
      className={`relative text-left p-5 rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'bg-freemen-500/10 border-freemen-500/50 shadow-lg shadow-freemen-500/10'
          : 'bg-surface-900/50 border-surface-700 hover:border-surface-600 hover:bg-surface-800/50'
      }`}
    >
      {/* Recommended badge */}
      {os.recommended && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-0.5 text-xs rounded-full bg-freemen-500/20 text-freemen-400 font-medium">
            Recommended
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      {/* Name */}
      <h3 className={`font-semibold mb-0.5 ${isSelected ? 'text-freemen-300' : 'text-white'}`}>
        {os.name}
      </h3>
      <p className="text-xs text-surface-500 mb-2">{os.subtitle}</p>

      {/* Description */}
      <p className="text-sm text-surface-400 mb-3 leading-relaxed line-clamp-2">
        {os.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {os.tags.map((tag) => (
          <span
            key={tag}
            className={`px-2 py-0.5 text-xs rounded ${
              isSelected
                ? 'bg-freemen-500/20 text-freemen-400'
                : 'bg-surface-800 text-surface-400'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Size */}
      <p className="text-xs text-surface-500 mt-3">
        ~{os.approxCompressedMb} MB download · ~{os.approxWrittenGb} GB on card
      </p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3">
          <CheckCircle className="w-4 h-4 text-freemen-400" />
        </div>
      )}
    </button>
  );
}

// ============================================
// OS INFO ROW  (compact selected-OS display)
// ============================================

function OsInfoRow({ os }: { os: OsOption }) {
  const Icon = os.variant === 'pi' ? Cpu : Server;
  const iconColor = os.variant === 'pi' ? 'text-red-400' : 'text-orange-400';
  const iconBg = os.variant === 'pi' ? 'bg-red-500/10' : 'bg-orange-500/10';

  return (
    <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="font-medium text-white">{os.name}</p>
          <p className="text-sm text-surface-500">{os.subtitle}</p>
        </div>
        {os.recommended && (
          <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-freemen-500/20 text-freemen-400">
            Recommended
          </span>
        )}
      </div>
    </div>
  );
}
