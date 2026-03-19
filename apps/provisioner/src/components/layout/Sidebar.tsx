/**
 * Sidebar Navigation Component
 */

import { NavLink } from 'react-router-dom';
import { Home, Zap, Settings, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/provision', icon: Zap, label: 'Provision' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-surface-900/50 border-r border-surface-800 flex flex-col">
      {/* Logo area */}
      <div className="p-6 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-freemen-500 to-freemen-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Freemen</h1>
            <p className="text-xs text-surface-400">Provisioner</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-freemen-600/20 text-freemen-400 border border-freemen-600/30'
                      : 'text-surface-400 hover:text-white hover:bg-surface-800'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-800">
        <a
          href="https://github.com/freemen-solutions/freemen-printer-proxy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          Documentation
        </a>
        <p className="text-xs text-surface-600 text-center mt-4">v1.0.0</p>
      </div>
    </aside>
  );
}
