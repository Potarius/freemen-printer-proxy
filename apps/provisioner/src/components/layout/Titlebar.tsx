/**
 * Custom Titlebar for Tauri
 * Draggable window titlebar with controls
 */

import { Minus, Square, X } from 'lucide-react';

export function Titlebar() {
  const handleMinimize = async () => {
    const { appWindow } = await import('@tauri-apps/api/window');
    appWindow.minimize();
  };

  const handleMaximize = async () => {
    const { appWindow } = await import('@tauri-apps/api/window');
    appWindow.toggleMaximize();
  };

  const handleClose = async () => {
    const { appWindow } = await import('@tauri-apps/api/window');
    appWindow.close();
  };

  return (
    <div 
      data-tauri-drag-region
      className="h-10 bg-surface-900 border-b border-surface-800 flex items-center justify-between px-4"
    >
      {/* App title */}
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <div className="w-5 h-5 rounded bg-gradient-to-br from-freemen-500 to-freemen-700" />
        <span className="text-sm font-medium text-surface-300">Freemen Provisioner</span>
        <span className="text-xs text-surface-600">v1.2.0</span>
        <span className="text-xs text-surface-700">·</span>
        <span className="text-xs text-surface-600">by Freemen Solutions</span>
      </div>

      {/* Window controls */}
      <div className="flex items-center -mr-2">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-white hover:bg-red-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
