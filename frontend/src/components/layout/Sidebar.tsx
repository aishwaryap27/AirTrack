import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  Plane,
  BarChart3,
  MapPin,
  Building2,
  Database,
  Layers,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      to: '/airspace',
      label: 'Live Airspace',
      icon: Radar,
      badge: 'Sim'
    },
    {
      to: '/flights',
      label: 'Flight Records',
      icon: Plane,
      badge: 'CRUD'
    },
    {
      to: '/analytics',
      label: 'Analytics Hub',
      icon: BarChart3,
      badge: 'Big Data'
    },
    {
      to: '/airports',
      label: 'Airports Directory',
      icon: MapPin,
      badge: '100'
    },
    {
      to: '/airlines',
      label: 'Airlines Directory',
      icon: Building2,
      badge: '50'
    },
    {
      to: '/database',
      label: 'MongoDB Engine',
      icon: Database,
      badge: 'Health'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-800 bg-aviation-950 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top spacer for header alignment */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-sky-400" />
            <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Control Panel
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              &times;
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:bg-aviation-900 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aviation-800 text-slate-400 border border-slate-700/50">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom dataset stats card */}
        <div className="p-4 border-t border-slate-800/80 bg-aviation-900/40 m-3 rounded-xl border">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-2">
            <Database className="h-3.5 w-3.5" />
            <span>AirTrafficDB Corpus</span>
          </div>
          <div className="space-y-1 text-xs text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Flights:</span>
              <span className="text-slate-200">50,000 docs</span>
            </div>
            <div className="flex justify-between">
              <span>Airports:</span>
              <span className="text-slate-200">100 docs</span>
            </div>
            <div className="flex justify-between">
              <span>Airlines:</span>
              <span className="text-slate-200">50 docs</span>
            </div>
            <div className="flex justify-between">
              <span>Aircraft:</span>
              <span className="text-slate-200">20 types</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
