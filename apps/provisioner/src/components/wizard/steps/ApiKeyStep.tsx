/**
 * API Key Step
 * Displays the generated proxy API key and requires the user to confirm
 * they've saved it before continuing. The key is embedded in the device
 * config (docker-compose) and needed to authenticate requests.
 */

import { useState } from 'react';
import { Key, Copy, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';

interface ApiKeyStepProps {
  apiKey: string;
  onRegenerate: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function ApiKeyStep({ apiKey, onRegenerate, onNext, onBack }: ApiKeyStepProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = () => {
    setConfirmed(false);
    onRegenerate();
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Save Your API Key</h2>
        <p className="text-surface-400">
          This key authenticates requests to your printer proxy. Copy it now — it won't be shown again after this step.
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-200/80">
          Store this key in a password manager or secure location. It will be embedded in your device and is required to make API calls.
        </p>
      </div>

      {/* Key display */}
      <div className="p-5 rounded-2xl bg-surface-900/80 border border-surface-700 mb-6">
        <p className="text-xs text-surface-500 uppercase font-medium tracking-wide mb-3">Proxy API Key</p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-950 border border-surface-700">
          <code className="flex-1 font-mono text-sm text-yellow-300 break-all select-all">
            {apiKey}
          </code>
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-2 rounded-lg hover:bg-surface-700 transition-colors text-surface-400 hover:text-white flex-shrink-0"
          >
            {copied
              ? <CheckCircle className="w-4 h-4 text-green-400" />
              : <Copy className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-surface-500 mt-2">
          Send as <code className="text-freemen-400">x-api-key</code> header with every request to your proxy endpoint.
        </p>
      </div>

      {/* Where it's used */}
      <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-800 mb-6 space-y-2 text-sm">
        <p className="font-medium text-surface-300 mb-2">This key will be written to:</p>
        <div className="flex items-start gap-2 text-surface-400">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span>Your device's <code className="text-freemen-400">docker-compose.yml</code> — as <code className="text-freemen-400">API_KEY</code> environment variable</span>
        </div>
        <div className="flex items-start gap-2 text-surface-400">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span>Your device package <code className="text-freemen-400">.env</code> file for reference</span>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-center gap-3 p-4 rounded-xl border border-surface-700 cursor-pointer hover:bg-surface-900/30 transition-colors mb-8">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-4 h-4 rounded accent-freemen-500"
        />
        <span className="text-surface-300 select-none">I've copied and saved my API key in a safe place</span>
      </label>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleRegenerate}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Regenerate
          </Button>
          <Button onClick={onNext} disabled={!confirmed}>
            {confirmed ? 'Continue' : 'Save key to continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
