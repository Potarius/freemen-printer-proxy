/**
 * Premium Sidebar Navigation Component
 */

import { NavLink } from 'react-router-dom';
import { Home, Zap, Settings, HelpCircle, Cpu, Monitor, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Home', description: 'Dashboard' },
  { to: '/wizard', icon: Zap, label: 'Provision', description: 'New device' },
  { to: '/pi-setup', icon: Cpu, label: 'Pi Setup', description: 'Raspberry Pi' },
  { to: '/ubuntu-deploy', icon: Monitor, label: 'Deploy', description: 'Ubuntu/Linux' },
  { to: '/settings', icon: Settings, label: 'Settings', description: 'Preferences' },
];

export function Sidebar() {
  return (
    <aside className="w-72 bg-surface-900/30 border-r border-surface-800/50 flex flex-col backdrop-blur-sm">
      {/* Logo area */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-freemen-500 to-freemen-600 flex items-center justify-center shadow-lg shadow-freemen-500/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface-900" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Freemen</h1>
            <p className="text-xs text-surface-500 font-medium">Provisioner v1.0</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-surface-600">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-freemen-600/20 to-freemen-500/10 text-white border border-freemen-500/20 shadow-lg shadow-freemen-500/5'
                      : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                      isActive 
                        ? 'bg-freemen-500/20 text-freemen-400' 
                        : 'bg-surface-800/50 text-surface-500 group-hover:bg-surface-700/50 group-hover:text-surface-300'
                    )}>
                      <item.icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1">
                      <span className="block">{item.label}</span>
                      <span className={clsx(
                        'text-[10px] transition-colors',
                        isActive ? 'text-freemen-400/70' : 'text-surface-600'
                      )}>
                        {item.description}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-freemen-400 animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-3">
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-surface-700/50 to-transparent" />
        
        {/* Help link */}
        <a
          href="https://github.com/Potarius/freemen-printer-proxy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-surface-800/50 flex items-center justify-center group-hover:bg-surface-700/50 transition-colors">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <span className="flex-1">Documentation</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Status indicator */}
        <div className="px-4 py-3 rounded-xl bg-surface-800/30 border border-surface-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-surface-500">Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
