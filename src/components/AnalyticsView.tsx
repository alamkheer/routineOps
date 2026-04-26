import { motion } from 'motion/react';
import { Frame } from './UI';
import { SystemHealthGauge } from './SystemHealthGauge';
import type { EvaluatedTask, SystemHealth } from '../types';

interface AnalyticsViewProps {
  tasks: EvaluatedTask[];
  health: SystemHealth;
}

export function AnalyticsView({ tasks, health }: AnalyticsViewProps) {
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const criticalCount = tasks.filter(t => !t.isCompleted && (t.computedTier === 'OUTAGE' || t.computedTier === 'CATASTROPHE')).length;
  const incidentCount = tasks.filter(t => !t.isCompleted && t.computedTier === 'INCIDENT').length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-on-surface">Cycle_Report // Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Frame title="SYSTEM_HEALTH" className="flex items-center justify-center py-8">
          <SystemHealthGauge health={health} />
        </Frame>

        <Frame title="METRICS_AGGREGATION" className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricBox label="Failures Prevented" value={completedCount} color="text-green-nominal" />
            <MetricBox label="Critical Outages" value={criticalCount} color="text-red-critical" />
            <MetricBox label="Active Incidents" value={incidentCount} color="text-orange-incident" />
            <MetricBox label="Completion Rate" value={`${completionRate}%`} color="text-cyan-system" />
          </div>
        </Frame>
      </div>

      <Frame title="PENALTY_BREAKDOWN">
         <div className="flex flex-col gap-3">
           <BreakdownRow label="Base Score" value={100} color="text-green-nominal" />
           <BreakdownRow label="Escalation Penalties" value={`-${health.breakdown.escalationPenalties}`} color="text-red-critical" />
           <BreakdownRow label="Recovery Penalties" value={`-${health.breakdown.recoveryPenalties}`} color="text-orange-incident" />
           <BreakdownRow label="Completion Bonuses" value={`+${health.breakdown.completionBonus}`} color="text-cyan-system" />
           <div className="h-[1px] w-full bg-border-subtle my-1" />
           <BreakdownRow label="Final Score" value={Math.round(health.score)} color="text-on-surface font-bold" />
         </div>
      </Frame>
    </motion.div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-surface-lvl2 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
      <span className="font-mono text-[9px] text-on-surface-muted uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-black font-mono ${color}`}>{value}</span>
    </div>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center justify-between font-mono text-sm">
      <span className="text-on-surface-muted uppercase">{label}</span>
      <span className={`${color}`}>{value}</span>
    </div>
  );
}
