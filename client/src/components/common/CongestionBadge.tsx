import React from 'react';
import { CongestionCategory } from '@shared/types';

interface CongestionBadgeProps {
  category: CongestionCategory;
  score?: number;
  showScore?: boolean;
  className?: string;
}

export const CongestionBadge: React.FC<CongestionBadgeProps> = ({
  category,
  score,
  showScore = true,
  className = '',
}) => {
  const configs = {
    free_flow: {
      bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
      dot: 'bg-emerald-400',
      label: 'Free Flow',
    },
    moderate: {
      bg: 'bg-amber-950/60 border-amber-500/40 text-amber-400',
      dot: 'bg-amber-400',
      label: 'Moderate',
    },
    heavy: {
      bg: 'bg-orange-950/60 border-orange-500/40 text-orange-400',
      dot: 'bg-orange-400',
      label: 'Heavy',
    },
    severe: {
      bg: 'bg-rose-950/60 border-rose-500/40 text-rose-400',
      dot: 'bg-rose-400',
      label: 'Severe',
    },
  };

  const current = configs[category] || configs.free_flow;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />
      <span>{current.label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[11px] opacity-90 ml-0.5">({score}%)</span>
      )}
    </span>
  );
};
