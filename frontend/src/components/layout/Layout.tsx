import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ShieldCheck } from 'lucide-react';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-aviation-950 flex flex-col text-slate-100">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-aviation-950 via-aviation-900/40 to-aviation-950">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>

          {/* Academic Footer */}
          <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              <span>
                AirTrack — Air Traffic Data Management & Analytics using MongoDB (AirTrafficDB)
              </span>
            </div>
            <div className="text-center sm:text-right text-[11px] text-slate-500">
              Academic Big Data Project • Synthetic Aviation Corpus (50,000 Records) • Not an operational ATC system
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
