/**
 * Settings Page
 * App configuration and preferences
 */

import { Settings, FolderOpen, Moon } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-surface-400 mb-8">Configure provisioner preferences</p>

      <div className="space-y-6">
        {/* Output Directory */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-surface-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Output Directory</h3>
              <p className="text-sm text-surface-400">Where to save generated config files</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value="./output"
              readOnly
              className="input flex-1"
            />
            <button className="btn-secondary">
              Browse
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
              <Moon className="w-5 h-5 text-surface-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Appearance</h3>
              <p className="text-sm text-surface-400">App theme preference</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button className="p-3 rounded-lg border bg-freemen-600/20 border-freemen-600/50 text-white text-sm">
              Dark
            </button>
            <button className="p-3 rounded-lg border bg-surface-800/50 border-surface-700 text-surface-400 text-sm hover:border-surface-600">
              Light
            </button>
            <button className="p-3 rounded-lg border bg-surface-800/50 border-surface-700 text-surface-400 text-sm hover:border-surface-600">
              System
            </button>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
              <Settings className="w-5 h-5 text-surface-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">About</h3>
              <p className="text-sm text-surface-400">Version and info</p>
            </div>
          </div>
          <div className="text-sm text-surface-400 space-y-1">
            <p><span className="text-surface-500">Version:</span> 1.0.0</p>
            <p><span className="text-surface-500">Built with:</span> Tauri + React</p>
            <p><span className="text-surface-500">Author:</span> Freemen Solutions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
