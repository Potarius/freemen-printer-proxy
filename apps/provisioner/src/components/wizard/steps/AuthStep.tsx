/**
 * Step 3: Cloudflare Authentication
 */

import { useState } from 'react';
import { KeyRound, ExternalLink, CheckCircle } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

interface AuthStepProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: () => Promise<boolean>;
  isValidated: boolean;
}

export function AuthStep({ value, onChange, onValidate, isValidated }: AuthStepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!value.trim()) {
      setError('Please enter an API token');
      return;
    }
    
    setIsValidating(true);
    setError(null);
    
    try {
      const success = await onValidate();
      if (!success) {
        setError('Invalid API token. Please check your token and try again.');
      }
    } catch (err) {
      setError('Failed to validate token. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-freemen-500/20 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-freemen-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect to Cloudflare</h2>
        <p className="text-surface-400">Enter your Cloudflare API token to continue</p>
      </div>

      {isValidated ? (
        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-300 mb-1">Token Verified</h3>
          <p className="text-sm text-surface-400">Your Cloudflare connection is ready</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <Input
              label="API Token"
              type="password"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter your Cloudflare API token"
              error={error || undefined}
              leftIcon={<KeyRound className="w-5 h-5" />}
            />

            <Button
              className="w-full"
              onClick={handleValidate}
              isLoading={isValidating}
              disabled={!value.trim()}
            >
              Verify Token
            </Button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-surface-900/50 border border-surface-800">
            <h4 className="text-sm font-medium text-surface-300 mb-3">Required Permissions:</h4>
            <ul className="text-sm text-surface-400 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-freemen-500" />
                Zone : Zone : Read
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-freemen-500" />
                Zone : DNS : Edit
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-freemen-500" />
                Account : Cloudflare Tunnel : Edit
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-freemen-500" />
                Account : Account Settings : Read
              </li>
            </ul>
          </div>

          <a
            href="https://dash.cloudflare.com/profile/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-4 text-sm text-freemen-400 hover:text-freemen-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Create API Token in Cloudflare Dashboard
          </a>
        </>
      )}
    </div>
  );
}
