import { useState } from 'react';
import { motion } from 'motion/react';
import { Button, Frame, TerminalInput } from './UI';
import type { Task, EvaluatedTask } from '../types';
import { getCycleDurationMs } from '../engine/scheduler';

interface TaskFormProps {
  tasks: EvaluatedTask[];
  onCancel: () => void;
  onSubmit: (task: Task) => void | Promise<void>;
}

export function TaskForm({ tasks, onCancel, onSubmit }: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isRoutine: true,
    frequency: 'DAILY' as Task['frequency'],
    priority: 50,
    severity: 50,
    dependencies: [] as string[],
    targetDayOffset: 0,
  });

  const handleSubmit = () => {
    if (!formData.name) return;
    
    const now = Date.now();
    const freq = formData.isRoutine ? formData.frequency : undefined;
    const duration = getCycleDurationMs(freq);
    
    // Calculate the target scheduled time by applying the day offset
    const offsetMs = formData.targetDayOffset * 24 * 60 * 60 * 1000;
    const targetScheduledAt = now + offsetMs;
    
    onSubmit({
      id: `TSK_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      name: formData.name,
      description: formData.description,
      isRoutine: formData.isRoutine,
      frequency: freq,
      priority: formData.priority,
      severity: formData.severity,
      dependencies: formData.dependencies,
      dependents: [], // Will be built by graph analyzer ideally, but kept empty here
      isCompleted: false,
      isArchived: false,
      createdAt: now,
      cycleStartedAt: targetScheduledAt - duration,
      scheduledAt: targetScheduledAt,
      escalationTier: 'NOMINAL',
    });
  };

  const handleDependencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, dependencies: selectedOptions.filter(v => v !== '') }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 overflow-y-auto p-6 flex flex-col gap-8"
    >
      <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
        <div className="px-2 py-1 bg-white/5 border border-white/10 font-mono text-[10px] text-on-surface-muted">INITIALIZE_TASK</div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-on-surface">System_Input</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Frame title="SYS_LOG_01" className="md:col-span-2">
          <div className="flex flex-col gap-4">
            <TerminalInput
              label="Task_Identifier"
              placeholder="Enter alphanumeric task name..."
              value={formData.name}
              onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            />
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-on-surface-muted uppercase tracking-widest">Description_Payload</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-sm text-white focus:ring-1 focus:ring-amber-warning/50 focus:outline-none placeholder:text-on-surface-muted"
                rows={3}
                placeholder="Input detailed parameters..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </Frame>

        <Frame title="CFG_ROUTINE">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-on-surface-muted uppercase">Routine_Flag</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isRoutine: !prev.isRoutine }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${formData.isRoutine ? 'bg-amber-warning' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.isRoutine ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
            {formData.isRoutine && (
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-on-surface-muted uppercase">Execution_Freq</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none"
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as Task['frequency'] }))}
                >
                  <option className="bg-slate-900 text-white" value="DAILY">CRON: DAILY</option>
                  <option className="bg-slate-900 text-white" value="WEEKLY">CRON: WEEKLY</option>
                  <option className="bg-slate-900 text-white" value="MONTHLY">CRON: MONTHLY</option>
                </select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-on-surface-muted uppercase">Target_Date</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none"
                value={formData.targetDayOffset}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDayOffset: parseInt(e.target.value) }))}
              >
                <option className="bg-slate-900 text-white" value={0}>TODAY</option>
                <option className="bg-slate-900 text-white" value={1}>TOMORROW</option>
                <option className="bg-slate-900 text-white" value={2}>IN 2 DAYS</option>
                <option className="bg-slate-900 text-white" value={3}>IN 3 DAYS</option>
                <option className="bg-slate-900 text-white" value={4}>IN 4 DAYS</option>
                <option className="bg-slate-900 text-white" value={5}>IN 5 DAYS</option>
              </select>
            </div>
          </div>
        </Frame>

        <Frame title="MTX_DEF">
           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-on-surface-muted uppercase">Priority_LVL</span>
                    <span className="text-cyan-system">VALUE: {formData.priority}</span>
                 </div>
                 <input
                   type="range"
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-system"
                   value={formData.priority}
                   onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-on-surface-muted uppercase">Severity_IDX</span>
                    <span className="text-amber-warning">VALUE: {formData.severity}</span>
                 </div>
                 <input
                   type="range"
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-warning"
                   value={formData.severity}
                   onChange={(e) => setFormData(prev => ({ ...prev, severity: parseInt(e.target.value) }))}
                 />
              </div>
           </div>
        </Frame>

        <Frame title="DEP_MAP" className="md:col-span-2">
           <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-on-surface-muted uppercase">Blocked_By (Hold Ctrl/Cmd to select multiple)</label>
              <select
                multiple
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none h-32"
                value={formData.dependencies}
                onChange={handleDependencyChange}
              >
                <option className="bg-slate-900 text-white" value="">-- NO_DEPENDENCIES --</option>
                {tasks.map(t => (
                  <option className="bg-slate-900 text-white" key={t.id} value={t.id}>{t.id}: {t.name}</option>
                ))}
              </select>
           </div>
        </Frame>
      </div>

      <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-border-subtle">
        <Button variant="ghost" onClick={onCancel}>Abort</Button>
        <Button onClick={handleSubmit}>Commit_Task</Button>
      </div>
    </motion.div>
  );
}
