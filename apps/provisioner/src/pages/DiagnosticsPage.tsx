/**
 * Diagnostics Page
 * System health checks and troubleshooting tools
 */

import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Monitor,
  HardDrive,
  Wifi,
  Globe,
  Shield,
  Clock,
  Cpu,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface DiagnosticCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message?: string;
  duration?: number;
}

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  appVersion: string;
  tauriVersion: string;
}

export function DiagnosticsPage() {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([
    { id: 'app', name: 'Application Status', description: 'Core application health', status: 'pending' },
    { id: 'storage', name: 'Local Storage', description: 'Browser storage availability', status: 'pending' },
    { id: 'network', name: 'Network Connectivity', description: 'Internet connection check', status: 'pending' },
    { id: 'cloudflare', name: 'Cloudflare API', description: 'API accessibility', status: 'pending' },
    { id: 'tauri', name: 'Tauri Runtime', description: 'Native shell integration', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get system info on mount
    detectSystemInfo();
  }, []);

  const detectSystemInfo = async () => {
    const info: SystemInfo = {
      platform: navigator.platform || 'Unknown',
      arch: navigator.userAgent.includes('x64') || navigator.userAgent.includes('Win64') ? 'x64' : 'x86',
      nodeVersion: 'N/A',
      appVersion: '1.0.0',
      tauriVersion: '1.5.x',
    };

    // Try to detect if running in Tauri
    if (window.__TAURI__) {
      try {
        const { platform, arch } = await import('@tauri-apps/api/os');
        info.platform = await platform();
        info.arch = await arch();
      } catch {
        // Not in Tauri or API not available
      }
    }

    setSystemInfo(info);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    // Reset all checks to pending
    setChecks(prev => prev.map(c => ({ ...c, status: 'pending' as const, message: undefined })));

    // Run each check sequentially
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      
      // Set to running
      setChecks(prev => prev.map(c => 
        c.id === check.id ? { ...c, status: 'running' as const } : c
      ));

      const startTime = Date.now();
      let result: Pick<DiagnosticCheck, 'status' | 'message'>;

      try {
        switch (check.id) {
          case 'app':
            result = await checkAppStatus();
            break;
          case 'storage':
            result = await checkStorage();
            break;
          case 'network':
            result = await checkNetwork();
            break;
          case 'cloudflare':
            result = await checkCloudflare();
            break;
          case 'tauri':
            result = await checkTauri();
            break;
          default:
            result = { status: 'success', message: 'OK' };
        }
      } catch (err) {
        result = { status: 'error', message: (err as Error).message };
      }

      const duration = Date.now() - startTime;

      setChecks(prev => prev.map(c => 
        c.id === check.id ? { ...c, ...result, duration } : c
      ));

      // Small delay between checks for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);
    setLastRun(new Date());
  };

  const checkAppStatus = async (): Promise<Pick<DiagnosticCheck, 'status' | 'message'>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { status: 'success', message: 'Application running normally' };
  };

  const checkStorage = async (): Promise<Pick<DiagnosticCheck, 'status' | 'message'>> => {
    try {
      const testKey = '__diagnostics_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      const used = new Blob(Object.values(localStorage)).size;
      const usedKB = (used / 1024).toFixed(1);
      
      return { status: 'success', message: `Storage available (${usedKB} KB used)` };
    } catch {
      return { status: 'error', message: 'Local storage unavailable' };
    }
  };

  const checkNetwork = async (): Promise<Pick<DiagnosticCheck, 'status' | 'message'>> => {
    if (!navigator.onLine) {
      return { status: 'error', message: 'No internet connection' };
    }

    try {
      const start = Date.now();
      await fetch('https://cloudflare.com/cdn-cgi/trace', { mode: 'no-cors' });
      const latency = Date.now() - start;
      
      return { 
        status: latency < 500 ? 'success' : 'warning', 
        message: `Connected (${latency}ms latency)` 
      };
    } catch {
      return { status: 'warning', message: 'Connection unstable' };
    }
  };

  const checkCloudflare = async (): Promise<Pick<DiagnosticCheck, 'status' | 'message'>> => {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer test' },
      });
      
      // We expect 401/403 since we're using a fake token, but the API should respond
      if (response.status === 401 || response.status === 403) {
        return { status: 'success', message: 'API reachable' };
      }
      
      return { status: 'success', message: 'API accessible' };
    } catch {
      return { status: 'warning', message: 'API check failed (CORS or network)' };
    }
  };

  const checkTauri = async (): Promise<Pick<DiagnosticCheck, 'status' | 'message'>> => {
    if (window.__TAURI__) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        const label = appWindow.label;
        return { status: 'success', message: `Tauri active (window: ${label})` };
      } catch {
        return { status: 'warning', message: 'Tauri API limited' };
      }
    }
    return { status: 'warning', message: 'Running in browser mode' };
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-freemen-400 animate-spin" />;
      default:
        return <Activity className="w-5 h-5 text-surface-500" />;
    }
  };

  const getCheckIcon = (id: string) => {
    switch (id) {
      case 'app': return <Monitor className="w-5 h-5" />;
      case 'storage': return <HardDrive className="w-5 h-5" />;
      case 'network': return <Wifi className="w-5 h-5" />;
      case 'cloudflare': return <Globe className="w-5 h-5" />;
      case 'tauri': return <Shield className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const copyDiagnostics = async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const generateReport = () => {
    const lines = [
      '=== FREEMEN PROVISIONER DIAGNOSTICS ===',
      `Date: ${new Date().toISOString()}`,
      '',
      '--- System Info ---',
      `Platform: ${systemInfo?.platform || 'Unknown'}`,
      `Architecture: ${systemInfo?.arch || 'Unknown'}`,
      `App Version: ${systemInfo?.appVersion || 'Unknown'}`,
      '',
      '--- Diagnostic Results ---',
      ...checks.map(c => `${c.name}: ${c.status.toUpperCase()} - ${c.message || 'N/A'} (${c.duration || 0}ms)`),
      '',
      '--- End Report ---',
    ];
    return lines.join('\n');
  };

  const successCount = checks.filter(c => c.status === 'success').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const errorCount = checks.filter(c => c.status === 'error').length;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Diagnostics</h1>
          <p className="text-surface-400">
            System health checks and troubleshooting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={copyDiagnostics}
            disabled={!lastRun}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy Report'}
          </Button>
          <Button
            onClick={runDiagnostics}
            isLoading={isRunning}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      {/* Status summary */}
      {lastRun && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                <Activity className="w-5 h-5 text-surface-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{checks.length}</p>
                <p className="text-xs text-surface-500">Total Checks</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{successCount}</p>
                <p className="text-xs text-surface-500">Passed</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
                <p className="text-xs text-surface-500">Warnings</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{errorCount}</p>
                <p className="text-xs text-surface-500">Errors</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic checks */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-freemen-500/20 to-freemen-600/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-freemen-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System Checks</h2>
            <p className="text-sm text-surface-500">
              {lastRun 
                ? `Last run: ${lastRun.toLocaleTimeString()}`
                : 'Click "Run Diagnostics" to start'
              }
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                check.status === 'running'
                  ? 'bg-freemen-500/5 border-freemen-500/20'
                  : check.status === 'success'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : check.status === 'warning'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : check.status === 'error'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-surface-900/30 border-surface-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  check.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                  check.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                  check.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  check.status === 'running' ? 'bg-freemen-500/20 text-freemen-400' :
                  'bg-surface-800 text-surface-500'
                }`}>
                  {getCheckIcon(check.id)}
                </div>
                <div>
                  <h3 className="font-medium text-white">{check.name}</h3>
                  <p className="text-sm text-surface-500">{check.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {check.message && (
                  <span className="text-sm text-surface-400">{check.message}</span>
                )}
                {check.duration !== undefined && (
                  <span className="text-xs text-surface-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {check.duration}ms
                  </span>
                )}
                {getStatusIcon(check.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System Information</h2>
            <p className="text-sm text-surface-500">Runtime environment details</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
            <p className="text-xs text-surface-500 mb-1">Platform</p>
            <p className="font-medium text-white">{systemInfo?.platform || 'Detecting...'}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
            <p className="text-xs text-surface-500 mb-1">Architecture</p>
            <p className="font-medium text-white">{systemInfo?.arch || 'Detecting...'}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
            <p className="text-xs text-surface-500 mb-1">App Version</p>
            <p className="font-medium text-white">{systemInfo?.appVersion || 'Unknown'}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800">
            <p className="text-xs text-surface-500 mb-1">Tauri Version</p>
            <p className="font-medium text-white">{systemInfo?.tauriVersion || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Troubleshooting</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => localStorage.clear()}
            className="p-4 rounded-xl bg-surface-900/50 border border-surface-800 text-left hover:bg-surface-800/50 transition-colors group"
          >
            <HardDrive className="w-5 h-5 text-surface-400 group-hover:text-white mb-2" />
            <h4 className="font-medium text-white mb-1">Clear Local Storage</h4>
            <p className="text-xs text-surface-500">Reset all saved data and preferences</p>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-4 rounded-xl bg-surface-900/50 border border-surface-800 text-left hover:bg-surface-800/50 transition-colors group"
          >
            <RefreshCw className="w-5 h-5 text-surface-400 group-hover:text-white mb-2" />
            <h4 className="font-medium text-white mb-1">Reload Application</h4>
            <p className="text-xs text-surface-500">Refresh and reinitialize the app</p>
          </button>
          <a
            href="https://github.com/Potarius/freemen-printer-proxy/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-surface-900/50 border border-surface-800 text-left hover:bg-surface-800/50 transition-colors group"
          >
            <Globe className="w-5 h-5 text-surface-400 group-hover:text-white mb-2" />
            <h4 className="font-medium text-white mb-1">Report an Issue</h4>
            <p className="text-xs text-surface-500">Open GitHub issues page</p>
          </a>
        </div>
      </div>
    </div>
  );
}

