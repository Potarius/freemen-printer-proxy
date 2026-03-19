/**
 * Package Preview Component
 * Displays generated device package files with preview and download
 */

import { useState } from 'react';
import {
  FileText,
  FileCode,
  FileJson,
  Terminal,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  Package,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { DevicePackage, DevicePackageFile } from '../../types';
import { DevicePackageGenerator } from '../../services/device-package-generator';

interface PackagePreviewProps {
  package: DevicePackage;
  onDownloadFile?: (file: DevicePackageFile) => void;
  onDownloadAll?: () => void;
  onOpenFolder?: () => void;
  onCopySteps?: () => void;
}

export function PackagePreview({
  package: pkg,
  onDownloadFile,
  onDownloadAll,
  onOpenFolder,
  onCopySteps,
}: PackagePreviewProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const toggleFile = (fileName: string) => {
    setExpandedFile(expandedFile === fileName ? null : fileName);
  };

  const copyFileContent = async (file: DevicePackageFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedFile(file.name);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const getFileIcon = (file: DevicePackageFile) => {
    if (file.name.endsWith('.json')) return <FileJson className="w-4 h-4" />;
    if (file.name.endsWith('.sh')) return <Terminal className="w-4 h-4" />;
    if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) return <FileCode className="w-4 h-4" />;
    if (file.name.endsWith('.md')) return <FileText className="w-4 h-4" />;
    if (file.name.endsWith('.service')) return <FileCode className="w-4 h-4" />;
    if (file.name.endsWith('.env')) return <FileCode className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'config': return 'info';
      case 'script': return 'success';
      case 'docker': return 'warning';
      case 'docs': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-freemen-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-freemen-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Device Package</h3>
            <p className="text-sm text-surface-400">
              {pkg.summary.totalFiles} files • {DevicePackageGenerator.formatSize(pkg.summary.totalSize)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-surface-500">Device ID:</span>
            <span className="ml-2 text-white font-mono">{pkg.summary.deviceId}</span>
          </div>
          <div>
            <span className="text-surface-500">Platform:</span>
            <span className="ml-2 text-white capitalize">{pkg.summary.platform.replace('-', ' ')}</span>
          </div>
          <div className="col-span-2">
            <span className="text-surface-500">Public URL:</span>
            <span className="ml-2 text-freemen-400">{pkg.summary.publicUrl}</span>
          </div>
        </div>
      </div>

      {/* File list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-surface-300 mb-3">Generated Files</h4>
        
        {pkg.files.map((file) => (
          <div
            key={file.name}
            className="rounded-lg border border-surface-800 overflow-hidden bg-surface-900/30"
          >
            {/* File header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-800/50 transition-colors"
              onClick={() => toggleFile(file.name)}
            >
              <div className="flex items-center gap-3">
                {expandedFile === file.name ? (
                  <ChevronDown className="w-4 h-4 text-surface-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-surface-500" />
                )}
                <div className="text-surface-400">
                  {getFileIcon(file)}
                </div>
                <div>
                  <span className="font-medium text-white">{file.name}</span>
                  <span className="ml-2 text-xs text-surface-500">
                    {DevicePackageGenerator.formatSize(file.size)}
                  </span>
                </div>
                <Badge variant={getCategoryColor(file.category) as any} className="ml-2">
                  {file.category}
                </Badge>
                {file.isExecutable && (
                  <Badge variant="success" className="ml-1">executable</Badge>
                )}
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => copyFileContent(file)}
                  className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded transition-colors"
                  title="Copy content"
                >
                  {copiedFile === file.name ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {onDownloadFile && (
                  <button
                    onClick={() => onDownloadFile(file)}
                    className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* File preview */}
            {expandedFile === file.name && (
              <div className="border-t border-surface-800">
                <div className="p-3 bg-surface-950">
                  <p className="text-xs text-surface-500 mb-2">{file.description}</p>
                  <pre className="text-xs text-surface-300 overflow-x-auto max-h-64 overflow-y-auto font-mono bg-black/30 p-3 rounded-lg">
                    {file.content.length > 3000
                      ? file.content.substring(0, 3000) + '\n\n... (truncated)'
                      : file.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {onDownloadAll && (
          <Button onClick={onDownloadAll} leftIcon={<Download className="w-4 h-4" />}>
            Download Package
          </Button>
        )}
        {onOpenFolder && (
          <Button
            variant="secondary"
            onClick={onOpenFolder}
            leftIcon={<Folder className="w-4 h-4" />}
          >
            Open Folder
          </Button>
        )}
        {onCopySteps && (
          <Button
            variant="ghost"
            onClick={onCopySteps}
            leftIcon={<Copy className="w-4 h-4" />}
          >
            Copy Deployment Steps
          </Button>
        )}
      </div>

      {/* Deployment steps */}
      <div className="p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20">
        <h4 className="font-medium text-white mb-3">Deployment Steps</h4>
        <ol className="space-y-2">
          {pkg.summary.deploymentSteps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-freemen-500/20 text-freemen-400 text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-surface-300">{step.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
