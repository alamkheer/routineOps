import { motion } from 'motion/react';
import type { SystemHealth, SystemStatus } from '../types';

interface SystemHealthGaugeProps {
  health: SystemHealth;
  className?: string;
}

const STATUS_COLORS: Record<SystemStatus, string> = {
  OPTIMAL: 'text-green-nominal',
  NOMINAL: 'text-cyan-system',
  DEGRADED: 'text-amber-warning',
  AT_RISK: 'text-orange-incident',
  CRITICAL: 'text-red-critical',
  SYSTEM_FAILURE: 'text-red-catastrophe',
};

const STATUS_GLOWS: Record<SystemStatus, string> = {
  OPTIMAL: 'drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]',
  NOMINAL: 'drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  DEGRADED: 'drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]',
  AT_RISK: 'drop-shadow-[0_0_12px_rgba(234,88,12,0.4)]',
  CRITICAL: 'drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]',
  SYSTEM_FAILURE: 'drop-shadow-[0_0_16px_rgba(220,38,38,0.6)]',
};

/**
 * Displays the System Health score as a large monospace number
 * with status indicator. Color transitions through the SystemStatus spectrum.
 */
export function SystemHealthGauge({ health, className = '' }: SystemHealthGaugeProps) {
  const colorClass = STATUS_COLORS[health.status];
  const glowClass = STATUS_GLOWS[health.status];
  const isPulsing = health.status === 'CRITICAL' || health.status === 'SYSTEM_FAILURE';

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        key={health.score}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`
          text-5xl font-mono font-black tabular-nums
          ${colorClass} ${glowClass}
          ${isPulsing ? 'animate-pulse' : ''}
        `}
      >
        {Math.round(health.score)}
      </motion.div>

      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')} ${isPulsing ? 'animate-pulse' : ''}`} />
        <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
          {health.status.replace('_', ' ')}
        </span>
      </div>

      {/* Score breakdown bar */}
      <div className="w-full mt-2">
        <div className="flex justify-between font-mono text-[9px] text-on-surface-muted mb-1">
          <span>SYSTEM_HEALTH</span>
          <span>{Math.round(health.score)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${health.score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
          />
        </div>
      </div>
    </div>
  );
}
