import { format } from 'date-fns';
import { X } from 'lucide-react';
import { getEscalationClasses } from '../../utils/escalation-colors';
import { EscalationBadge } from '../EscalationBadge';
import type { TaskOccurrence } from './utils';

interface DateModalProps {
  date: Date;
  occurrences: TaskOccurrence[];
  onClose: () => void;
  onSelectTask: (id: string) => void;
}

export function DateModal({ date, occurrences, onClose, onSelectTask }: DateModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background-void/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <h3 className="text-lg font-mono font-bold text-white uppercase tracking-tight">
            {format(date, 'MMM d, yyyy')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-on-surface-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="flex flex-col overflow-y-auto max-h-[60vh] p-2 gap-2">
          {occurrences.length === 0 ? (
            <div className="text-center p-8 text-on-surface-muted font-mono text-xs uppercase">
              No tasks scheduled for this date.
            </div>
          ) : (
            occurrences.map((occ, i) => {
              const tier = occ.task.isCompleted ? 'NOMINAL' : occ.task.computedTier;
              const classes = getEscalationClasses(tier);
              return (
                <button
                  key={`modal-${occ.task.id}-${i}`}
                  onClick={() => {
                    onSelectTask(occ.task.id);
                    onClose();
                  }}
                  className={`
                    flex items-center justify-between text-left w-full p-3 rounded-lg
                    border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group
                    ${occ.task.isCompleted ? 'opacity-50 grayscale' : ''}
                  `}
                >
                  <div className="flex flex-col min-w-0 mr-4">
                    <span className={`truncate font-sans font-bold text-sm ${occ.task.isCompleted ? 'line-through text-white/50' : 'text-white'}`}>
                      {occ.task.name}
                    </span>
                    <span className={`font-mono text-[10px] mt-1 ${classes.text}`}>
                      PRI: {occ.task.priority}% • SEV: {occ.task.severity}%
                    </span>
                  </div>
                  <EscalationBadge tier={tier} />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
