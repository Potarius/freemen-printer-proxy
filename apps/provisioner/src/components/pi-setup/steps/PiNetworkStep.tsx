/**
 * Pi Setup - Network/WiFi Step
 */

import { useState } from 'react';
import { Wifi, WifiOff, Globe, Eye, EyeOff, Ethernet } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { WIFI_COUNTRIES } from '../../../services/pi-setup-service';

interface PiNetworkStepProps {
  wifiSsid: string;
  wifiPassword: string;
  wifiCountry: string;
  onWifiChange: (ssid: string, password: string, country: string) => void;
  onClearWifi: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function PiNetworkStep({
  wifiSsid,
  wifiPassword,
  wifiCountry,
  onWifiChange,
  onClearWifi,
  onNext,
  onBack,
}: PiNetworkStepProps) {
  const [useWifi, setUseWifi] = useState(!!wifiSsid);
  const [showPassword, setShowPassword] = useState(false);
  const [localSsid, setLocalSsid] = useState(wifiSsid);
  const [localPassword, setLocalPassword] = useState(wifiPassword);
  const [localCountry, setLocalCountry] = useState(wifiCountry || 'US');

  const handleToggleWifi = (enabled: boolean) => {
    setUseWifi(enabled);
    if (!enabled) {
      onClearWifi();
      setLocalSsid('');
      setLocalPassword('');
    }
  };

  const handleContinue = () => {
    if (useWifi && localSsid && localPassword) {
      onWifiChange(localSsid, localPassword, localCountry);
    }
    onNext();
  };

  const canContinue = !useWifi || (localSsid && localPassword.length >= 8);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <Wifi className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Network Configuration
        </h2>
        <p className="text-surface-400">
          Configure how your Pi connects to the network
        </p>
      </div>

      {/* Connection type selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => handleToggleWifi(true)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            useWifi
              ? 'bg-freemen-500/10 border-freemen-500'
              : 'bg-surface-900/30 border-surface-800 hover:border-surface-700'
          }`}
        >
          <Wifi className={`w-8 h-8 mb-3 ${useWifi ? 'text-freemen-400' : 'text-surface-500'}`} />
          <h3 className={`font-semibold mb-1 ${useWifi ? 'text-white' : 'text-surface-300'}`}>
            WiFi
          </h3>
          <p className="text-sm text-surface-500">
            Connect wirelessly to your network
          </p>
        </button>

        <button
          onClick={() => handleToggleWifi(false)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            !useWifi
              ? 'bg-freemen-500/10 border-freemen-500'
              : 'bg-surface-900/30 border-surface-800 hover:border-surface-700'
          }`}
        >
          <Ethernet className={`w-8 h-8 mb-3 ${!useWifi ? 'text-freemen-400' : 'text-surface-500'}`} />
          <h3 className={`font-semibold mb-1 ${!useWifi ? 'text-white' : 'text-surface-300'}`}>
            Ethernet
          </h3>
          <p className="text-sm text-surface-500">
            Connect via cable (recommended)
          </p>
        </button>
      </div>

      {/* WiFi configuration */}
      {useWifi ? (
        <div className="space-y-6">
          {/* SSID */}
          <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
            <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
              <Wifi className="w-4 h-4" />
              Network Name (SSID)
            </label>
            <Input
              value={localSsid}
              onChange={(e) => setLocalSsid(e.target.value)}
              placeholder="Your WiFi network name"
            />
          </div>

          {/* Password */}
          <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
            <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
              <WifiOff className="w-4 h-4" />
              WiFi Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={localPassword}
                onChange={(e) => setLocalPassword(e.target.value)}
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
            {localPassword && localPassword.length < 8 && (
              <p className="text-xs text-yellow-400 mt-2">
                WiFi password must be at least 8 characters
              </p>
            )}
          </div>

          {/* Country */}
          <div className="p-5 rounded-xl bg-surface-900/50 border border-surface-800">
            <label className="flex items-center gap-2 text-sm font-medium text-surface-300 mb-3">
              <Globe className="w-4 h-4" />
              WiFi Country
            </label>
            <select
              value={localCountry}
              onChange={(e) => setLocalCountry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-900 border border-surface-700 text-white focus:outline-none focus:ring-2 focus:ring-freemen-500 focus:border-transparent"
            >
              {WIFI_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-surface-500 mt-2">
              Select your country to comply with local WiFi regulations
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-surface-900/30 border border-surface-800 text-center">
          <Ethernet className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">Ethernet Connection</h3>
          <p className="text-surface-400 mb-4">
            Connect your Pi to your router with an Ethernet cable.
            <br />
            This is the most reliable option for headless setup.
          </p>
          <div className="p-3 rounded-lg bg-surface-900/50 inline-block">
            <p className="text-sm text-surface-300">
              No additional configuration needed
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 rounded-xl bg-freemen-500/5 border border-freemen-500/20">
        <h4 className="font-medium text-freemen-400 mb-2">
          💡 {useWifi ? 'WiFi Tips' : 'Ethernet Tips'}
        </h4>
        {useWifi ? (
          <ul className="text-sm text-surface-300 space-y-1">
            <li>• Make sure you enter the exact WiFi name (case-sensitive)</li>
            <li>• 5GHz networks may have compatibility issues with Pi 3</li>
            <li>• The WiFi password is stored in plain text on the SD card</li>
          </ul>
        ) : (
          <ul className="text-sm text-surface-300 space-y-1">
            <li>• Use a Cat5e or Cat6 cable for best performance</li>
            <li>• Your Pi will get an IP address via DHCP automatically</li>
            <li>• You can add WiFi later through SSH</li>
          </ul>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
