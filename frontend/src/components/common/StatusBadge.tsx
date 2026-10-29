import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (statusStr: string) => {
    switch (statusStr?.toLowerCase()) {
      case 'landed':
      case 'on time':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'delayed':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'diverted':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'en route':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse';
      case 'scheduled':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-700/20 text-slate-400 border-slate-700/40';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${getBadgeStyle(status)}`}
    >
      {status?.toLowerCase() === 'en route' && (
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
      )}
      {status}
    </span>
  );
};
