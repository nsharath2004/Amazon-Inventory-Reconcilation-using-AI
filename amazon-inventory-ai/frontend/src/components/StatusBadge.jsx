import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const normStatus = (status || 'UNRECONCILED').toUpperCase();

  const configs = {
    MATCH: {
      label: 'MATCH',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    },
    OVERSTOCKED: {
      label: 'OVERSTOCKED',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      dot: 'bg-amber-500'
    },
    UNDERSTOCKED: {
      label: 'UNDERSTOCKED',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle,
      dot: 'bg-rose-500'
    },
    UNRECONCILED: {
      label: 'UNRECONCILED',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: HelpCircle,
      dot: 'bg-slate-400'
    }
  };

  const config = configs[normStatus] || configs.UNRECONCILED;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-sm px-3.5 py-1.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm ${config.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
