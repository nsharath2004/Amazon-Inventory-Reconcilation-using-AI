import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';

export default function ModeBadge({ mode, size = 'md' }) {
  const isAi = mode === 'AI_MODEL';

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : size === 'lg' 
    ? 'text-sm px-3.5 py-1.5' 
    : 'text-xs px-2.5 py-1';

  if (isAi) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm ${sizeClasses}`} title="PyTorch ResNet Deep Learning Inference">
        <Cpu className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>AI MODEL</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-sm ${sizeClasses}`} title="Computer Vision Heuristic Demo Simulation">
      <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>DEMO MODE</span>
    </span>
  );
}
