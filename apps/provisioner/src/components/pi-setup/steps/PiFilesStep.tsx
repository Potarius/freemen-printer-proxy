/**
 * Pi Setup - Boot Files Step
 * Generate and download boot partition files OR write directly to SD card
 */

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  HardDrive,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Zap,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { SDWriteWizard } from '../../sd-write';
import type { PiBootFile, PiSetupPackage, PiSetupConfig } from '../../../types';

interface PiFilesStepProps {
  setupPackage: PiSetupPackage | null;
  config?: PiSetupConfig;
  onGenerate: () => void;
  onDownloadFile: (file: PiBootFile) => void;
  onDownloadAll: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function PiFilesStep({
  setupPackage,
  config,
  onGenerate,
  onDownloadFile,
  onDownloadAll,
  onNext,
  onBack,
}: PiFilesStepProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [showSDWizard, setShowSDWizard] = useState(false);
  const [sdWriteComplete, setSDWriteComplete] = useState(false);

  const copyFileContent = async (file: PiBootFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedFile(file.name);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const toggleFile = (fileName: string) => {
    setExpandedFile(expandedFile === fileName ? null : fileName);
  };

  const handleSDWriteComplete = () => {
    setShowSDWizard(false);
    setSDWriteComplete(true);
  };

  // Get config from setupPackage if not provided directly
  const piConfig = config || setupPackage?.config;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* SD Write Wizard Modal */}
      {showSDWizard && piConfig && (
        <SDWriteWizard
          config={piConfig}
          onComplete={handleSDWriteComplete}
          onCancel={() => setShowSDWizard(false)}
        />
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Configure SD Card
        </h2>
        <p className="text-surface-400">
          Write configuration directly to your SD card or download files manually
        </p>
      </div>

      {/* Generate button if no package */}
      {!setupPackage ? (
        <div className="text-center py-12">
          <HardDrive className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-400 mb-6">
            Generate your configuration files based on your settings
          </p>
          <Button onClick={onGenerate} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Generate Files
          </Button>
        </div>
      ) : (
        <>
          {/* SD Write Success Message */}
          {sdWriteComplete && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="font-medium text-green-400">SD Card Configured!</h4>
                  <p className="text-sm text-surface-300">
                    Your SD card is ready. Click Continue to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action: Write to SD Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/30 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                <CircleDot className="w-6 h-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Write Directly to SD Card
                </h3>
                <p className="text-sm text-surface-400 mb-4">
                  Automatically configure your SD card with all necessary boot files.
                  This is the recommended and fastest method.
                </p>
                <Button
                  onClick={() => setShowSDWizard(true)}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Write to SD Card
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-surface-950 text-sm text-surface-500">
                or download files manually
              </span>
            </div>
          </div>

          {/* Manual Instructions */}
          <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800 mb-6">
            <h3 className="font-medium text-surface-300 mb-2">📋 Manual Method</h3>
            <ol className="text-sm text-surface-400 space-y-1 list-decimal list-inside">
              <li>Insert your flashed SD card into this computer</li>
              <li>Open the <strong className="text-surface-300">boot</strong> partition</li>
              <li>Download and copy the files below to the boot partition root</li>
              <li>Safely eject the SD card</li>
            </ol>
          </div>

          {/* Download all button */}
          <div className="flex justify-center mb-6">
            <Button 
              onClick={onDownloadAll} 
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download All Files
            </Button>
          </div>

          {/* File list */}
          <div className="space-y-3 mb-8">
            {setupPackage.bootFiles.map((file) => (
              <div
                key={file.name}
                className={`rounded-xl border overflow-hidden ${
                  file.required
                    ? 'bg-surface-900/50 border-surface-700'
                    : 'bg-surface-900/30 border-surface-800'
                }`}
              >
                {/* File header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-800/30 transition-colors"
                  onClick={() => toggleFile(file.name)}
                >
                  <div className="flex items-center gap-3">
                    {expandedFile === file.name ? (
                      <ChevronDown className="w-4 h-4 text-surface-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-surface-500" />
                    )}
                    <FileText className="w-5 h-5 text-surface-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white font-mono">
                          {file.name}
                        </span>
                        {file.required && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-freemen-500/20 text-freemen-400">
                            Required
                          </span>
                        )}
                        {!file.required && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-surface-700 text-surface-400">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500">{file.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyFileContent(file)}
                      className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
                      title="Copy content"
                    >
                      {copiedFile === file.name ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDownloadFile(file)}
                      className="p-2 text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* File content preview */}
                {expandedFile === file.name && (
                  <div className="border-t border-surface-800 p-4 bg-surface-950">
                    {file.content ? (
                      <pre className="text-xs text-surface-300 font-mono overflow-x-auto max-h-48 overflow-y-auto bg-black/30 p-3 rounded-lg">
                        {file.content}
                      </pre>
                    ) : (
                      <p className="text-sm text-surface-500 italic">
                        Empty file (creates by presence only)
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Important notes */}
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-8">
            <h4 className="font-medium text-yellow-400 mb-2">⚠️ Important</h4>
            <ul className="text-sm text-surface-300 space-y-1">
              <li>• Files must be in the <strong>root</strong> of the boot partition</li>
              <li>• The <code className="text-yellow-400">ssh</code> file has no extension</li>
              <li>• Make sure to safely eject the SD card before removing it</li>
            </ul>
          </div>

          {/* Regenerate button */}
          <div className="text-center mb-8">
            <button
              onClick={onGenerate}
              className="text-sm text-surface-500 hover:text-white flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate files
            </button>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!setupPackage}>
          Continue
        </Button>
      </div>
    </div>
  );
}
