import { motion } from 'motion/react';
import type { EvaluatedTask } from '../types';
import { getEscalationClasses } from '../utils/escalation-colors';
import { TaskCard } from './TaskCard';

interface MatrixViewProps {
  tasks: EvaluatedTask[];
  onSelectTask: (id: string) => void;
  selectedTaskId?: string;
  onToggleTask?: (id: string) => void | Promise<void>;
}

export function MatrixView({ tasks, onSelectTask, selectedTaskId, onToggleTask }: MatrixViewProps) {
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 relative flex flex-col p-2 md:p-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 md:px-4 mt-2 md:mt-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] text-on-surface-muted">VIEW:</span>
          <span className="font-mono text-[10px] text-cyan-system border-b border-cyan-system uppercase tracking-widest pb-1 font-bold">Cartesian_Matrix</span>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <Legend color="bg-red-critical" label="L3/L4: CRITICAL" />
          <Legend color="bg-orange-incident" label="L2: INCIDENT" />
          <Legend color="bg-amber-warning" label="L1: WARNING" />
          <Legend color="bg-green-nominal" label="L0: NOMINAL" />
        </div>
      </div>

      <div className="flex-1 relative border-l border-b border-slate-700/50 mx-4 mb-8 font-mono">
        {/* Axis Labels */}
        <div className="absolute bottom-[-24px] right-0 text-[10px] text-on-surface-muted font-mono tracking-tighter uppercase">Severity (Impact) →</div>
        <div className="absolute left-[-40px] top-0 text-[10px] text-on-surface-muted font-mono tracking-tighter transform -rotate-90 origin-top-left uppercase">Priority (Urgency) →</div>

        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
          <div className="border-r border-slate-400"></div><div className="border-r border-slate-400"></div><div className="border-r border-slate-400"></div><div className=""></div>
          <div className="border-b border-slate-400"></div><div className="border-b border-slate-400"></div><div className="border-b border-slate-400"></div><div className="border-b border-slate-400"></div>
        </div>

        {/* Nodes */}
        {tasks.map(task => {
          const x = task.priority;
          const y = 100 - task.severity;
          
          const tier = task.isCompleted ? 'NOMINAL' : task.computedTier;
          const classes = getEscalationClasses(tier);

          return (
            <motion.div
              key={task.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => onSelectTask(task.id)}
              className="absolute z-20 group cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`
                w-4 h-4 border-2 border-black rounded-full
                ${classes.bg}
                ${classes.pulse ? 'animate-pulse' : ''}
                ${task.isCompleted ? 'opacity-50 grayscale' : classes.glow}
                ${selectedTaskId === task.id ? 'ring-4 ring-white/30' : ''}
              `} />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background-void border border-white/10 p-2 z-50 rounded-lg pointer-events-none shadow-xl">
                 <div className="font-mono text-[10px] text-white font-bold uppercase">{task.name}</div>
                 <div className={`font-mono text-[9px] mt-1 ${classes.text}`}>
                    TIER: {tier}
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Selected Task Preview */}
      {selectedTask && (
        <div className="md:hidden absolute bottom-4 left-4 right-4 z-50">
          <TaskCard task={selectedTask} onAction={() => onToggleTask?.(selectedTask.id)} mobileCompat />
        </div>
      )}
    </motion.div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 ${color} rounded-full`} />
      <span className="font-mono text-[9px] text-on-surface-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}
