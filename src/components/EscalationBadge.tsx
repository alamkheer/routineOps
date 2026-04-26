import type { EscalationTier } from '../types';
import { getEscalationClasses, getEscalationLabel, getEscalationCode } from '../utils/escalation-colors';

interface EscalationBadgeProps {
  tier: EscalationTier;
  className?: string;
}

/**
 * Compact inline badge showing the escalation tier code + label.
 * Color and glow are determined by `getEscalationClasses(tier)`.
 * OUTAGE and CATASTROPHE badges pulse.
 */
export function EscalationBadge({ tier, className = '' }: EscalationBadgeProps) {
  const classes = getEscalationClasses(tier);
  const code = getEscalationCode(tier);

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 border px-2 py-0.5 rounded-md
        font-mono text-[9px] font-bold uppercase tracking-wider
        ${classes.text} ${classes.border}
        ${classes.pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${classes.bg} ${classes.pulse ? 'animate-pulse' : ''}`} />
      <span>{code}</span>
      <span className="opacity-70">{getEscalationLabel(tier).split(' ')[1]}</span>
    </div>
  );
}
