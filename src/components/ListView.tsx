import { motion } from 'motion/react';
import { ShieldAlert, History } from 'lucide-react';
import type { EvaluatedTask } from '../types';
import { TaskCard } from './TaskCard';

interface ListViewProps {
  tasks: EvaluatedTask[];
  onToggleTask: (id: string) => void | Promise<void>;
  onSelectTask: (id: string) => void;
  selectedTaskId?: string;
}

export function ListView({ tasks, onToggleTask, onSelectTask, selectedTaskId }: ListViewProps) {
  // Sort tasks by tier severity, then priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return 1;
    if (!a.isCompleted && b.isCompleted) return -1;
    
    // Sort logic could be improved, but for now simple severity check
    if (a.healthImpact < b.healthImpact) return -1;
    if (a.healthImpact > b.healthImpact) return 1;
    
    return b.priority - a.priority;
  });

  const criticalTasks = sortedTasks.filter(t => !t.isCompleted && (t.computedTier === 'OUTAGE' || t.computedTier === 'CATASTROPHE' || t.computedTier === 'INCIDENT'));
  const routineTasks = sortedTasks.filter(t => t.isCompleted || t.computedTier === 'NOMINAL' || t.computedTier === 'WARNING');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 h-full min-h-0 overflow-y-auto p-4 md:pb-44 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <h2 className="text-xl font-mono font-bold text-on-surface uppercase tracking-widest">Ops_Feed // System_Tasks</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Risks Section */}
        {criticalTasks.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="text-red-critical w-4 h-4 animate-pulse" />
              <span className="font-mono text-[10px] text-red-critical font-bold uppercase tracking-widest">Section: Active_Incidents</span>
              <div className="flex-1 h-[1px] bg-red-critical/20 ml-2" />
            </div>

            {criticalTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onAction={() => onToggleTask(task.id)} 
                onClick={() => onSelectTask(task.id)}
                className={selectedTaskId === task.id ? 'ring-2 ring-cyan-system' : ''}
                mobileCompat 
              />
            ))}
          </section>
        )}

        {/* Routine Section */}
        <section className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 mb-2 text-on-surface-muted">
            <History className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest truncate">Section: Routine_Ops</span>
            <div className="flex-1 h-[1px] bg-border-subtle ml-2" />
          </div>

          {routineTasks.map(task => (
             <TaskCard 
               key={task.id} 
               task={task} 
               onAction={() => onToggleTask(task.id)} 
               onClick={() => onSelectTask(task.id)}
               className={selectedTaskId === task.id ? 'ring-2 ring-cyan-system' : ''}
               mobileCompat 
             />
          ))}
          {routineTasks.length === 0 && (
            <div className="p-4 text-center border border-dashed border-border-subtle rounded-xl text-on-surface-muted font-mono text-xs">
              NO ROUTINE TASKS LOGGED
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
