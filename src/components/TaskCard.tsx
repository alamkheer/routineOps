import { AlertTriangle } from 'lucide-react';
import { Button } from './UI';
import { EscalationBadge } from './EscalationBadge';
import { getEscalationClasses } from '../utils/escalation-colors';
import type { EvaluatedTask, EscalationTier } from '../types';

interface TaskCardProps {
  task: EvaluatedTask;
  onAction: () => void;
  onClick?: () => void;
  mobileCompat?: boolean;
  className?: string;
}

/**
 * Renders a single task with escalation-aware styling.
 * Border color, action button variant, and status badge all
 * adapt to the task's computed escalation tier.
 */
export function TaskCard({ task, onAction, onClick, mobileCompat, className = '' }: TaskCardProps) {
  const tier = task.isCompleted ? 'NOMINAL' : task.computedTier;
  const classes = getEscalationClasses(tier);
  const isHighSeverity = tier === 'OUTAGE' || tier === 'CATASTROPHE';

  const actionLabel = getActionLabel(tier, task.isCompleted);
  const buttonVariant = getButtonVariant(tier, task.isCompleted);

  return (
    <div
      onClick={onClick}
      className={`
        bg-white/5 border p-3 md:p-4 flex flex-col
        ${mobileCompat ? 'sm:flex-row' : 'md:flex-row'}
        justify-between items-start
        ${mobileCompat ? 'sm:items-center' : 'md:items-center'}
        gap-3 md:gap-4 transition-colors hover:bg-white/10
        rounded-xl shadow-lg backdrop-blur-md
        ${onClick ? 'cursor-pointer' : ''}
        ${task.isCompleted
          ? 'opacity-40 grayscale border-white/5'
          : `${classes.border} ${isHighSeverity ? `ring-1 ${classes.border}` : ''}`
        }
        ${className}
      `}
    >
      <div className="flex gap-3 md:gap-4 overflow-hidden w-full">
        <div className="font-mono text-[9px] bg-slate-900 border border-white/5 px-2 py-1 text-slate-500 h-fit rounded shrink-0">
          {task.id}
        </div>
        <div className="flex flex-col min-w-0">
          <h3
            className={`font-sans text-sm md:text-base font-bold text-white uppercase tracking-tight truncate ${
              task.isCompleted ? 'line-through' : ''
            }`}
          >
            {task.name}
          </h3>
          {!task.isCompleted && task.dependencies.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-warning shrink-0" />
              <span className="font-mono text-[9px] text-amber-warning uppercase font-bold truncate">
                Dependency_Blocked
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center gap-4 w-full ${
          mobileCompat ? 'sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0' : 'md:w-auto pt-4 md:pt-0 border-t md:border-t-0'
        } border-white/5`}
      >
        <div className="flex flex-col gap-1 min-w-[50px] shrink-0">
          <span className="font-mono text-[9px] text-on-surface-muted uppercase">Pri/Sev</span>
          <span className={`font-mono text-[10px] md:text-xs font-bold ${task.isCompleted ? 'text-gray-500' : classes.text}`}>
            {task.priority / 10} / {task.severity / 10}
          </span>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <span className="font-mono text-[9px] text-on-surface-muted uppercase">Status</span>
          <EscalationBadge tier={tier} />
        </div>
        <Button
          variant={buttonVariant}
          className={`ml-auto scale-90 md:scale-95 px-3 py-1.5 ${mobileCompat ? 'text-[10px]' : ''}`}
          onClick={(e) => {
            e?.stopPropagation();
            onAction();
          }}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function getActionLabel(tier: EscalationTier, isCompleted: boolean): string {
  if (isCompleted) return 'REOPEN';
  switch (tier) {
    case 'CATASTROPHE':
    case 'OUTAGE':
      return 'OVERRIDE';
    case 'INCIDENT':
      return 'RESOLVE';
    case 'WARNING':
      return 'ACKNOWLEDGE';
    case 'NOMINAL':
      return 'MARK_DONE';
    default:
      return 'MARK_DONE';
  }
}

function getButtonVariant(tier: EscalationTier, isCompleted: boolean): 'primary' | 'secondary' | 'critical' | 'ghost' {
  if (isCompleted) return 'secondary';
  switch (tier) {
    case 'CATASTROPHE':
    case 'OUTAGE':
      return 'critical';
    case 'INCIDENT':
      return 'primary';
    default:
      return 'secondary';
  }
}
