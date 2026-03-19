/**
 * Pi Setup - Configuration Step
 * Hostname, username, password settings
 */

import { useState } from 'react';
import { User, Key, Server, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface PiConfigStepProps {
  hostname: string;
  username: string;
  password: string;
  onHostnameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  validationErrors: string[];
  onNext: () => void;
  onBack: () => void;
}

export function PiConfigStep({
  hostname,
  username,
  password,
  onHostnameChange,
  onUsernameChange,
  onPasswordChange,
  validationErrors,
  onNext,
  onBack,
}: PiConfigStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password === confirmPassword;
  const canContinue = 
    hostname.length >= 2 &&
    username.length >= 2 &&
    password.length >= 8 &&
    passwordsMatch &&
    validationErrors.length === 0;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          System Configuration
        </h2>
        <p className="text-surface-400">
          Set up your Pi's identity and admin account
        </p>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400 mb-1">Please fix the following:</h4>
              <ul className="text-sm text-surface-300 space-y-1">
                {validationErrors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Hostname */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
            <Server className="w-4 h-4" />
            Hostname
          </label>
          <Input
            value={hostname}
            onChange={(e) => onHostnameChange(e.target.value.toLowerCase())}
            placeholder="freemen-pi"
            className="mb-2"
          />
          <p className="text-xs text-surface-500">
            Your Pi will be accessible as <code className="text-freemen-400">{hostname || 'freemen-pi'}.local</code>
          </p>
        </div>

        {/* Username */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
            <User className="w-4 h-4" />
            Username
          </label>
          <Input
            value={username}
            onChange={(e) => onUsernameChange(e.target.value.toLowerCase())}
            placeholder="freemen"
            className="mb-2"
          />
          <p className="text-xs text-surface-500">
            Lowercase letters, numbers, underscores, and hyphens only. Cannot be "pi".
          </p>
        </div>

        {/* Password */}
        <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
            <Key className="w-4 h-4" />
            Password
          </label>
          <div className="relative mb-3">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Minimum 8 characters"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Confirm password */}
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={confirmPassword && !passwordsMatch ? 'border-red-500' : ''}
            />
            {confirmPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-400 mt-2">Passwords do not match</p>
          )}
          
          {/* Password strength indicator */}
          <div className="mt-3">
            <PasswordStrength password={password} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20">
        <h4 className="font-medium text-freemen-400 mb-2">💡 Security Note</h4>
        <p className="text-sm text-surface-300">
          The default "pi" user has been deprecated for security reasons. 
          We recommend using a unique username and a strong password.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { level: 2, text: 'Medium', color: 'bg-yellow-500' };
    return { level: 3, text: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${strength.color}`}
          style={{ width: `${(strength.level / 3) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${
        strength.level === 1 ? 'text-red-400' :
        strength.level === 2 ? 'text-yellow-400' : 'text-green-400'
      }`}>
        {strength.text}
      </span>
    </div>
  );
}
