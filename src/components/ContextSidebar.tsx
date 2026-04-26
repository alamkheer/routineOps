import { motion } from 'motion/react';
import { AlertOctagon } from 'lucide-react';
import { Frame, Button } from './UI';
import { EscalationBadge } from './EscalationBadge';
import { getEscalationClasses } from '../utils/escalation-colors';
import type { EvaluatedTask } from '../types';

interface ContextSidebarProps {
  currentTask?: EvaluatedTask;
  onToggleTask: (id: string) => void | Promise<void>;
  onArchiveTask: (id: string) => void | Promise<void>;
  onForceAgeTask: (id: string) => void | Promise<void>;
}

export function ContextSidebar({ currentTask, onToggleTask, onArchiveTask, onForceAgeTask }: ContextSidebarProps) {
  if (!currentTask) {
    return (
      <aside className="hidden xl:flex flex-col w-80 gap-4 shrink-0 overflow-y-auto">
        <Frame title="CTX_FOCUS">
          <div className="text-on-surface-muted font-mono text-xs italic">NO_TARGET_ACQUIRED</div>
        </Frame>
      </aside>
    );
  }

  const tier = currentTask.isCompleted ? 'NOMINAL' : currentTask.computedTier;
  const classes = getEscalationClasses(tier);
  const isHighSeverity = tier === 'OUTAGE' || tier === 'CATASTROPHE';

  return (
    <aside className="hidden xl:flex flex-col w-80 gap-4 shrink-0 overflow-y-auto">
      <Frame title="CTX_FOCUS" className={`${isHighSeverity ? `ring-1 ${classes.border}` : ''}`}>
        <div className="flex flex-col gap-4">
          <h2 className={`font-mono text-xl font-black uppercase tracking-tighter ${classes.text}`}>
            {currentTask.name}
          </h2>
          <div className="w-full bg-surface-lvl2 h-2 relative rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentTask.priority}%` }}
              className={`absolute top-0 left-0 h-full ${classes.bg} ${classes.glow}`}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-on-surface-muted">PRIORITY_LEVEL</span>
            <span className={`font-bold ${classes.text}`}>{currentTask.priority}%</span>
          </div>
          <div className="w-full bg-surface-lvl2 h-2 relative rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentTask.severity}%` }}
              className={`absolute top-0 left-0 h-full ${classes.bg} ${classes.glow}`}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-on-surface-muted">SEVERITY_IMPACT</span>
            <span className={`font-bold ${classes.text}`}>{currentTask.severity}%</span>
          </div>
        </div>
      </Frame>

      <Frame title="ESCALATION_DETAILS" className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <AlertOctagon className={`w-4 h-4 ${classes.text} ${classes.pulse ? 'animate-pulse' : ''}`} />
          <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${classes.text}`}>State_Analysis</span>
        </div>

        <div className="flex flex-col gap-6 flex-1">
          <div>
            <span className="font-mono text-[10px] text-on-surface-muted">TARGET:</span>
            <p className="text-sm font-mono text-on-surface uppercase mt-1 break-all">{currentTask.id}</p>
          </div>

          <div>
            <span className="font-mono text-[10px] text-on-surface-muted">CURRENT_TIER:</span>
            <div className="mt-2">
              <EscalationBadge tier={tier} />
            </div>
          </div>

          {currentTask.dependencies.length > 0 && (
            <div className="border-l-2 border-amber-warning pl-3 ml-1 mt-2">
              <span className="font-mono text-[10px] text-amber-warning uppercase">Blockers:</span>
              <ul className="text-sm font-mono text-on-surface uppercase mt-1 flex flex-col gap-1">
                {currentTask.dependencies.map(dep => (
                  <li key={dep} className="truncate">{dep}</li>
                ))}
              </ul>
            </div>
          )}
          
          {currentTask.description && (
             <div className="mt-2">
               <span className="font-mono text-[10px] text-on-surface-muted">DESCRIPTION:</span>
               <p className="text-xs font-sans text-on-surface mt-1">{currentTask.description}</p>
             </div>
          )}

          <div className="mt-auto pt-6 flex flex-col gap-2">
            <Button
              variant={currentTask.isCompleted ? 'secondary' : isHighSeverity ? 'critical' : 'primary'}
              className="w-full"
              onClick={() => onToggleTask(currentTask.id)}
            >
              {currentTask.isCompleted ? 'REOPEN_TASK' : 'PROCESS_TASK'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-red-400 hover:bg-red-900/20"
              onClick={() => onArchiveTask(currentTask.id)}
            >
              ARCHIVE_RECORD
            </Button>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
               <span className="font-mono text-[9px] text-amber-warning uppercase tracking-widest">Dev_Tools</span>
               <Button
                 variant="ghost"
                 className="w-full text-[10px] border border-amber-warning/30 text-amber-warning hover:bg-amber-warning/10"
                 onClick={() => onForceAgeTask(currentTask.id)}
               >
                 FORCE_AGE (+24h)
               </Button>
            </div>
          </div>
        </div>
      </Frame>
    </aside>
  );
}
