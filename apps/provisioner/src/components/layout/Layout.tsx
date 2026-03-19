/**
 * Main Layout Component
 * Provides the app shell with navigation
 */

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Titlebar } from './Titlebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
