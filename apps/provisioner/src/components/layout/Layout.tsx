/**
 * Main Layout Component
 * Provides the app shell with navigation
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Titlebar } from './Titlebar';

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-surface-950">
      {/* Custom titlebar for Tauri */}
      <Titlebar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
