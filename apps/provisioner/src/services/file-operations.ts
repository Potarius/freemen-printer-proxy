/**
 * File Operations Service
 * Handles file system operations using Tauri APIs or fallback to browser
 */

import type { DevicePackage, DevicePackageFile } from '../types';

// ============================================
// TYPES
// ============================================

export interface WriteResult {
  success: boolean;
  path: string;
  error?: string;
}

export interface PackageWriteResult {
  success: boolean;
  outputPath: string;
  filesWritten: number;
  errors: string[];
}

// ============================================
// TAURI API DETECTION
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTauri(): any {
  return (window as any).__TAURI__;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && getTauri() !== undefined;
}

// ============================================
// FILE OPERATIONS SERVICE
// ============================================

export class FileOperationsService {
  private outputBaseDir: string = '';

  /**
   * Initialize and get the output directory
   */
  async getOutputDirectory(): Promise<string> {
    if (this.outputBaseDir) {
      return this.outputBaseDir;
    }

    if (isTauri() && getTauri()) {
      try {
        const docDir = await getTauri().path.documentDir();
        this.outputBaseDir = await getTauri().path.join(docDir, 'Freemen Provisioner', 'output');
      } catch {
        this.outputBaseDir = './output';
      }
    } else {
      // Browser fallback - use relative path
      this.outputBaseDir = './output';
    }

    return this.outputBaseDir;
  }

  /**
   * Write a device package to disk
   */
  async writePackage(pkg: DevicePackage): Promise<PackageWriteResult> {
    if (isTauri() && getTauri()) {
      return this.writePackageTauri(pkg);
    } else {
      // Browser fallback - create downloadable content
      return this.writePackageBrowser(pkg);
    }
  }

  /**
   * Write package using Tauri file system
   */
  private async writePackageTauri(pkg: DevicePackage): Promise<PackageWriteResult> {
    const errors: string[] = [];
    let filesWritten = 0;

    try {
      const baseDir = await this.getOutputDirectory();
      const packageDir = await getTauri().path.join(baseDir, pkg.id);

      // Create package directory
      await getTauri().fs.createDir(packageDir, { recursive: true });

      // Write each file
      for (const file of pkg.files) {
        try {
          const filePath = await getTauri().path.join(packageDir, file.relativePath);
          await getTauri().fs.writeTextFile(filePath, file.content);
          filesWritten++;
        } catch (err) {
          errors.push(`Failed to write ${file.name}: ${(err as Error).message}`);
        }
      }

      return {
        success: errors.length === 0,
        outputPath: packageDir,
        filesWritten,
        errors,
      };
    } catch (err) {
      return {
        success: false,
        outputPath: '',
        filesWritten: 0,
        errors: [`Failed to create package directory: ${(err as Error).message}`],
      };
    }
  }

  /**
   * Browser fallback - prepare for download
   */
  private async writePackageBrowser(pkg: DevicePackage): Promise<PackageWriteResult> {
    // In browser mode, we can't write to disk
    // Store in memory and provide download mechanism
    console.log('[FileOperations] Browser mode - package prepared for download');
    
    return {
      success: true,
      outputPath: `memory://${pkg.id}`,
      filesWritten: pkg.files.length,
      errors: [],
    };
  }

  /**
   * Download a single file (browser)
   */
  downloadFile(file: DevicePackageFile): void {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download entire package as ZIP (browser)
   */
  async downloadPackageAsZip(pkg: DevicePackage): Promise<void> {
    // Create a simple ZIP-like structure using data URLs
    // For a real ZIP, you'd use a library like JSZip
    // For now, download files individually or create a combined file
    
    // Create a combined shell script that extracts files
    const combinedContent = this.createCombinedPackage(pkg);
    
    const blob = new Blob([combinedContent], { type: 'application/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pkg.id}-package.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Create a self-extracting shell script with embedded files
   */
  private createCombinedPackage(pkg: DevicePackage): string {
    const files = pkg.files;
    
    let script = `#!/bin/bash
# ============================================
# Freemen Printer Proxy - Self-Extracting Package
# ============================================
# Device: ${pkg.id}
# Generated: ${pkg.createdAt}
#
# Usage: chmod +x ${pkg.id}-package.sh && ./${pkg.id}-package.sh
#

set -e

PACKAGE_DIR="${pkg.id}"

echo "Extracting Freemen Printer Proxy package..."
echo "Device ID: ${pkg.id}"
echo ""

# Create package directory
mkdir -p "$PACKAGE_DIR"
cd "$PACKAGE_DIR"

`;

    // Embed each file using heredoc
    for (const file of files) {
      script += `
# --- ${file.name} ---
cat > '${file.relativePath}' << 'FREEMEN_EOF_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}'
${file.content}
FREEMEN_EOF_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}

`;
      if (file.isExecutable) {
        script += `chmod +x '${file.relativePath}'\n`;
      }
    }

    script += `
echo ""
echo "Package extracted to: $PACKAGE_DIR/"
echo ""
echo "Files created:"
ls -la
echo ""
echo "Next step: cd $PACKAGE_DIR && sudo ./setup.sh"
`;

    return script;
  }

  /**
   * Open folder in system file explorer
   */
  async openFolder(path: string): Promise<boolean> {
    if (isTauri() && getTauri()) {
      try {
        await getTauri().shell.open(path);
        return true;
      } catch (err) {
        console.error('Failed to open folder:', err);
        return false;
      }
    } else {
      // Browser fallback - can't open folder
      console.log('[FileOperations] Browser mode - cannot open folder:', path);
      return false;
    }
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (isTauri() && getTauri()) {
      try {
        await getTauri().clipboard.writeText(text);
        return true;
      } catch {
        // Fallback to browser API
      }
    }

    // Browser fallback
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Final fallback - create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  /**
   * Check if running in Tauri
   */
  isTauriEnvironment(): boolean {
    return isTauri();
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

let serviceInstance: FileOperationsService | null = null;

export function getFileOperationsService(): FileOperationsService {
  if (!serviceInstance) {
    serviceInstance = new FileOperationsService();
  }
  return serviceInstance;
}
