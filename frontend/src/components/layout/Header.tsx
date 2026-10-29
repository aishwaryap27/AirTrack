import React, { useState, useEffect } from 'react';
import { Plane, Database, Clock, Activity, Menu, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Update live UTC clock every second
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Ping DB status
    const checkDb = async () => {
      try {
        const status = await api.getSystemStatus();
        setDbConnected(status.connected);
      } catch {
        setDbConnected(false);
      }
    };
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-aviation-950/95 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand / Mobile menu button */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Plane className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">AirTrack</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded">
                  MongoDB Analytics
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Air Traffic Data Management & Aggregation Engine
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right: Live UTC Clock & Database Health Status */}
        <div className="flex items-center gap-3">
          {/* UTC Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-aviation-900 text-xs font-mono text-slate-300">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span>{utcTime || '00:00:00 UTC'}</span>
          </div>

          {/* MongoDB Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              dbConnected === true
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : dbConnected === false
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="MongoDB AirTrafficDB connection status"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden md:inline">DB:</span>
            <span className="font-mono">AirTrafficDB</span>
            <span
              className={`h-2 w-2 rounded-full ${
                dbConnected === true
                  ? 'bg-emerald-400 animate-pulse'
                  : dbConnected === false
                  ? 'bg-rose-500'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Academic Notice Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            <span>Academic Demonstration (Synthetic Data)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
