import React, { useState, useMemo } from 'react';
import { 
  Terminal as TerminalIcon, 
  Grid, 
  List, 
  BarChart3, 
  Plus, 
  ShieldAlert, 
  Radio,
  ChevronRight,
  AlertOctagon,
  History,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, Task, SystemLog } from './types';
import { Frame, StatusChip, Button, TerminalInput } from './components/UI';

// Mock Tasks
const INITIAL_TASKS: Task[] = [
  {
    id: 'TSK_LNDRY_01',
    name: 'Core Laundry Flush',
    description: 'Execute full cycle on domestic textiles.',
    isRoutine: true,
    frequency: 'WEEKLY',
    priority: 85,
    severity: 92,
    dependencies: ['DEP_REFILL_DTG'],
    isCompleted: false,
    createdAt: Date.now()
  },
  {
    id: 'DEP_REFILL_DTG',
    name: 'Detergent Resupply',
    description: 'Procure chemical cleaning agent.',
    isRoutine: false,
    priority: 40,
    severity: 75,
    dependencies: [],
    isCompleted: false,
    createdAt: Date.now()
  },
  {
    id: 'TSK_CLN_FLR',
    name: 'Floor Surface Integrity',
    description: 'Remove particulate matter from localized habitat.',
    isRoutine: true,
    frequency: 'DAILY',
    priority: 80,
    severity: 30,
    dependencies: [],
    isCompleted: false,
    createdAt: Date.now()
  }
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('MATRIX');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [logs, setLogs] = useState<SystemLog[]>([
    { id: '1', timestamp: Date.now(), message: 'SYSTEM_READY // INITIALIZED', type: 'SUCCESS' },
    { id: '2', timestamp: Date.now(), message: 'SCANNING_ROUTINES: 3 ENTITIES FOUND', type: 'INFO' },
  ]);

  const addLog = (message: string, type: SystemLog['type'] = 'INFO') => {
    setLogs(prev => [...prev.slice(-4), { id: Math.random().toString(), timestamp: Date.now(), message, type }]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    const task = tasks.find(t => t.id === id);
    addLog(`TASK_STATUS_CHANGED: ${id} -> ${task?.isCompleted ? 'ACTIVE' : 'COMPLETED'}`, 'INFO');
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addLog(`TASK_PURGED: ${id}`, 'WARN');
  };

  const [selectedTaskId, setSelectedTaskId] = useState<string>('TSK_LNDRY_01');
  const currentTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative">
      <div className="mesh-gradient">
        <div className="mesh-1" />
        <div className="mesh-2" />
      </div>
      <div className="scanning-line" />
      
      {/* Top Bar */}
      <header className="h-16 md:h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] shrink-0">
            <Radio className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col justify-center truncate">
            <h1 className="text-white font-sans font-bold text-lg md:text-xl tracking-tight uppercase truncate">
              ROUTINE OPS<span className="hidden md:inline text-orange-500 italic ml-2">// ESCALATION MATRIX</span>
            </h1>
            <p className="hidden md:block text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
              System Integrity: 84.2% • Cycle 09.24.Active
            </p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-4 shrink-0">
          <div className="hidden md:block px-4 py-2 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-lg text-[10px] font-mono">
            <span className="text-slate-500 uppercase">Next Sync:</span> <span className="text-blue-400 ml-2">04:12:08</span>
          </div>
          <Button onClick={() => setActiveScreen('NEW_TASK')} className="px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs">
            <span className="md:hidden">+ NEW</span>
            <span className="hidden md:inline">INITIALIZE TASK +</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden z-10 p-3 md:px-6 md:py-6 gap-4 md:gap-6">
        
        {/* Sidebar Nav */}
        <nav className="hidden md:flex flex-col w-64 frosted-card p-3 gap-2 shrink-0">
          <div className="p-4 mb-2 border-b border-white/5">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Interdependencies</span>
          </div>
          
          <div className="flex flex-col gap-3 px-2">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
               <p className="text-xs font-bold text-red-400 uppercase">Blocking: Laundry</p>
               <p className="text-[10px] text-red-300/60 mt-1 italic tracking-tight">Failure Path: Meeting Prep → Focus</p>
            </div>
            
            <NavItem 
              active={activeScreen === 'MATRIX'} 
              onClick={() => setActiveScreen('MATRIX')}
              icon={<Grid className="w-4 h-4" />} 
              label="Matrix Overview" 
            />
            <NavItem 
              active={activeScreen === 'LISTS'} 
              onClick={() => setActiveScreen('LISTS')}
              icon={<List className="w-4 h-4" />} 
              label="Task Feed" 
            />
            <NavItem 
              active={activeScreen === 'ANALYTICS'} 
              onClick={() => setActiveScreen('ANALYTICS')}
              icon={<BarChart3 className="w-4 h-4" />} 
              label="System Analytics" 
            />
          </div>
          
          <div className="mt-auto p-4 border-t border-white/5">
             <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-slate-500 uppercase">Risk Profile</span>
                <div className="flex items-center gap-3">
                   <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[65%]" />
                   </div>
                   <span className="text-[10px] font-mono text-orange-500">65%</span>
                </div>
             </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative">
          
          {/* Main Display */}
          <div className="flex-1 flex flex-col frosted-card overflow-hidden relative">
             <AnimatePresence mode="wait">
                {activeScreen === 'MATRIX' && <MatrixView tasks={tasks} onSelectTask={setSelectedTaskId} selectedTaskId={selectedTaskId} onToggleTask={toggleTask} key="matrix" />}
                {activeScreen === 'LISTS' && <ListView tasks={tasks} onToggleTask={toggleTask} key="lists" />}
                {activeScreen === 'ANALYTICS' && <AnalyticsView tasks={tasks} key="analytics" />}
                {activeScreen === 'NEW_TASK' && (
                  <TaskForm 
                    tasks={tasks}
                    onCancel={() => setActiveScreen('MATRIX')}
                    onSubmit={(newTask) => {
                      setTasks(prev => [...prev, newTask]);
                      addLog(`TASK_INITIALIZED: ${newTask.id}`, 'SUCCESS');
                      setActiveScreen('MATRIX');
                    }}
                    key="new_task"
                  />
                )}
             </AnimatePresence>

             {/* Terminal Overlay */}
             <div className="hidden md:block absolute bottom-0 left-0 w-full h-40 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-4 font-mono text-xs overflow-y-auto z-40">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-4 mb-1">
                    <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={log.type === 'ERROR' ? 'text-red-critical' : log.type === 'WARN' ? 'text-amber-warning' : 'text-cyan-system'}>
                      {log.type === 'ERROR' ? '!!' : log.type === 'WARN' ? '>>' : '>'} {log.message}
                    </span>
                  </div>
                ))}
                <div className="flex gap-2">
                   <span className="text-cyan-system">{'>'}</span>
                   <span className="text-cyan-system uppercase">Awaiting_Input<span className="terminal-cursor" /></span>
                </div>
             </div>
          </div>

          {/* Context Sidebar (Right) */}
          <aside className="hidden xl:flex flex-col w-80 gap-4 shrink-0 overflow-y-auto">
            <Frame title="CTX_FOCUS">
              {currentTask ? (
                <div className="flex flex-col gap-4">
                  <h2 className="font-mono text-xl text-red-critical font-black uppercase tracking-tighter">
                    {currentTask.name}
                  </h2>
                  <div className="w-full bg-border-subtle h-2 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentTask.priority}%` }}
                      className="absolute top-0 left-0 h-full bg-red-critical glow-red" 
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-gray-500">PRIORITY_LEVEL</span>
                    <span className="text-red-critical font-bold">{currentTask.priority}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 font-mono text-xs">NO_TARGET_ACQUIRED</div>
              )}
            </Frame>

            <Frame title="ESCALATION_DETAILS" className="flex-1 border-red-critical/30 ring-1 ring-red-critical/10">
               <div className="flex items-center gap-2 mb-4">
                  <AlertOctagon className="text-red-critical w-4 h-4" />
                  <span className="font-mono text-[10px] text-red-critical font-bold uppercase tracking-widest">Active_Warnings</span>
               </div>
               
               <div className="flex flex-col gap-6">
                  {currentTask ? (
                    <>
                      <div>
                        <span className="font-mono text-[10px] text-gray-500">TARGET:</span>
                        <p className="text-sm font-mono text-on-surface uppercase mt-1">{currentTask.id} ({currentTask.name})</p>
                      </div>
                      
                      {currentTask.dependencies.length > 0 && (
                        <div className="border-l-2 border-amber-warning pl-3 ml-1">
                          <span className="font-mono text-[10px] text-amber-warning uppercase">Blockers:</span>
                          <p className="text-sm font-mono text-on-surface uppercase mt-1">
                            {currentTask.dependencies.join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="mt-8 flex flex-col gap-2">
                        <Button 
                          variant={currentTask.isCompleted ? 'secondary' : 'critical'} 
                          className="w-full"
                          onClick={() => toggleTask(currentTask.id)}
                        >
                          {currentTask.isCompleted ? 'REOPEN_TASK' : 'OVERRIDE_AND_PROCEED'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-red-400 border-red-500/30"
                          onClick={() => deleteTask(currentTask.id)}
                        >
                          PURGE_SYSTEM_RECORD
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600 font-mono text-xs italic">SELECT_TASK_FOR_ANALYSIS</div>
                  )}
               </div>
            </Frame>
          </aside>
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden h-16 border-t border-white/5 bg-slate-950 flex items-center justify-around z-50 shrink-0">
          <NavItem 
            active={activeScreen === 'MATRIX'} 
            onClick={() => setActiveScreen('MATRIX')}
            icon={<Grid className="w-5 h-5" />} 
            label="MATRIX"
            mobile
          />
          <NavItem 
            active={activeScreen === 'LISTS'} 
            onClick={() => setActiveScreen('LISTS')}
            icon={<List className="w-5 h-5" />} 
            label="LISTS"
            mobile
          />
          <NavItem 
            active={activeScreen === 'ANALYTICS'} 
            onClick={() => setActiveScreen('ANALYTICS')}
            icon={<BarChart3 className="w-5 h-5" />} 
            label="STATS"
            mobile
          />
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, mobile = false }: { 
  active: boolean; 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      className={`
        relative flex items-center gap-3 transition-all px-4 py-3 group overflow-hidden
        ${active ? 'text-cyan-system bg-surface-lvl3 border-l-2 border-cyan-system' : 'text-gray-500 hover:text-white hover:bg-surface-lvl2 border-l-2 border-transparent'}
        ${mobile ? 'flex-col gap-1 px-2 py-1 flex-1 border-l-0 border-t-2' : ''}
        ${mobile && active ? 'border-cyan-system border-t-2' : ''}
        ${mobile && !active ? 'border-transparent border-t-2' : ''}
      `}
    >
      <div className={`absolute inset-0 bg-cyan-system/5 transition-transform duration-300 translate-x-[-100%] ${active ? 'translate-x-0' : 'group-hover:translate-x-0'}`} />
      <span className="relative z-10">{icon}</span>
      <span className={`relative z-10 font-mono text-[10px] font-bold tracking-widest uppercase ${active ? '' : 'text-gray-600 group-hover:text-gray-300'}`}>
        {label}
      </span>
    </button>
  );
}

function MatrixView({ tasks, onSelectTask, selectedTaskId, onToggleTask }: { tasks: Task[]; onSelectTask: (id: string) => void; selectedTaskId?: string; onToggleTask?: (id: string) => void; }) {
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
          <span className="font-mono text-[10px] text-gray-500">VIEW:</span>
          <span className="font-mono text-[10px] text-cyan-system border-b border-cyan-system uppercase tracking-widest pb-1 font-bold">Cartesian_Matrix</span>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <Legend color="bg-red-critical" label="Q1: CRITICAL" />
          <Legend color="bg-amber-warning" label="Q2: STRAT" />
          <Legend color="bg-cyan-system" label="Q3: URGENT" />
          <Legend color="bg-border-subtle" label="Q4: MINOR" />
        </div>
      </div>

      <div className="flex-1 relative border-l border-b border-slate-700/50 mx-4 mb-8 font-mono">
        {/* Axis Labels */}
        <div className="absolute bottom-[-24px] right-0 text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Severity (Impact) →</div>
        <div className="absolute left-[-40px] top-0 text-[10px] text-slate-500 font-mono tracking-tighter transform -rotate-90 origin-top-left uppercase">Priority (Urgency) →</div>

        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
          <div className="border-r border-slate-400"></div><div className="border-r border-slate-400"></div><div className="border-r border-slate-400"></div><div className=""></div>
          <div className="border-b border-slate-400"></div><div className="border-b border-slate-400"></div><div className="border-b border-slate-400"></div><div className="border-b border-slate-400"></div>
        </div>

        {/* Quadrant Backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 font-black text-gray-900 pointer-events-none select-none text-8xl opacity-10">
          <div className="flex items-center justify-center border-r border-b border-white/5">Q2</div>
          <div className="flex items-center justify-center border-b border-white/5">Q1</div>
          <div className="flex items-center justify-center border-r border-white/5">Q3</div>
          <div className="flex items-center justify-center">Q4</div>
        </div>

        {/* Nodes */}
        {tasks.map(task => {
          const x = task.priority;
          const y = 100 - task.severity; 
          const isCritical = task.severity > 90;
          
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
                w-4 h-4 border-2 border-black 
                ${task.isCompleted ? 'bg-green-500 opacity-50' : 
                  isCritical ? 'bg-red-critical glow-red animate-pulse' : 
                  task.severity > 70 ? 'bg-amber-warning' : 
                  task.priority > 70 ? 'bg-cyan-system' : 'bg-gray-600'}
                ${selectedTaskId === task.id ? 'ring-4 ring-white/20' : ''}
              `} />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 border border-white/10 p-2 z-50 rounded-lg">
                 <div className="font-mono text-[10px] text-white font-bold uppercase">{task.name}</div>
                 <div className="flex items-center gap-2 mt-1">
                    <StatusChip status={task.isCompleted ? 'STABLE' : task.id} type={task.isCompleted ? 'SUCCESS' : isCritical ? 'ERROR' : 'INFO'} />
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

function ListView({ tasks, onToggleTask }: { tasks: Task[]; onToggleTask: (id: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-mono font-bold text-on-surface uppercase tracking-widest">Ops_Feed // System_Tasks</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Risks Section */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="text-red-critical w-4 h-4" />
            <span className="font-mono text-[10px] text-red-critical font-bold uppercase tracking-widest">Section: Critical_Risks</span>
            <div className="flex-1 h-[1px] bg-red-critical/20 ml-2" />
          </div>

          {tasks.filter(t => t.severity > 70 && !t.isCompleted).map(task => (
             <TaskCard key={task.id} task={task} onAction={() => onToggleTask(task.id)} mobileCompat />
          ))}
        </section>

        {/* Routine Section */}
        <section className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <History className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest truncate">Section: Routine_Ops</span>
            <div className="flex-1 h-[1px] bg-border-subtle ml-2" />
          </div>

          {tasks.filter(t => (t.severity <= 70 || t.isCompleted)).map(task => (
             <TaskCard key={task.id} task={task} onAction={() => onToggleTask(task.id)} mobileCompat />
          ))}
        </section>
      </div>
    </motion.div>
  );
}

function TaskCard({ task, onAction, mobileCompat }: { task: Task; onAction: () => void; mobileCompat?: boolean }) {
  const isCritical = task.severity > 90;
  return (
    <div className={`
      bg-white/5 border p-3 md:p-4 flex flex-col ${mobileCompat ? 'sm:flex-row' : 'md:flex-row'} justify-between items-start ${mobileCompat ? 'sm:items-center' : 'md:items-center'} gap-3 md:gap-4 transition-colors hover:bg-white/10 rounded-xl shadow-lg backdrop-blur-md
      ${task.isCompleted ? 'opacity-40 grayscale border-white/5' : isCritical ? 'border-red-500/30 ring-1 ring-red-500/10' : 'border-white/10'}
    `}>
      <div className="flex gap-3 md:gap-4 overflow-hidden w-full">
        <div className="font-mono text-[9px] bg-slate-900 border border-white/5 px-2 py-1 text-slate-500 h-fit rounded shrink-0">
          {task.id}
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className={`font-sans text-sm md:text-base font-bold text-white uppercase tracking-tight truncate ${task.isCompleted ? 'line-through' : ''}`}>
            {task.name}
          </h3>
          {task.dependencies.length > 0 && !task.isCompleted && (
             <div className="flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />
                <span className="font-mono text-[9px] text-orange-500 uppercase font-bold truncate">Dependency_Blocked</span>
             </div>
          )}
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-4 w-full ${mobileCompat ? 'sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0' : 'md:w-auto pt-4 md:pt-0 border-t md:border-t-0'} border-white/5`}>
        <div className="flex flex-col gap-1 min-w-[50px] shrink-0">
           <span className="font-mono text-[9px] text-slate-500 uppercase">Pri/Sev</span>
           <span className={`font-mono text-[10px] md:text-xs font-bold ${task.isCompleted ? 'text-gray-500' : isCritical ? 'text-red-400' : 'text-blue-400'}`}>
             {task.priority / 10} / {task.severity / 10}
           </span>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
           <span className="font-mono text-[9px] text-slate-500 uppercase">Status</span>
           <StatusChip 
             status={task.isCompleted ? 'DONE' : task.dependencies.length > 0 ? 'BLOCKED' : 'ACTIVE'} 
             type={task.isCompleted ? 'SUCCESS' : task.dependencies.length > 0 ? 'WARN' : 'INFO'} 
           />
        </div>
        <Button 
          variant={task.isCompleted ? 'secondary' : isCritical ? 'critical' : 'secondary'} 
          className={`ml-auto scale-90 md:scale-95 px-3 py-1.5 ${mobileCompat ? 'text-[10px]' : ''}`}
          onClick={(e) => {
             e.stopPropagation();
             onAction();
          }}
        >
          {task.isCompleted ? 'REOPEN' : isCritical ? 'OVERRIDE' : 'ACKNOWLEDGE'}
        </Button>
      </div>
    </div>
  );
}

function TaskForm({ tasks, onCancel, onSubmit }: { 
  tasks: Task[]; 
  onCancel: () => void; 
  onSubmit: (task: Task) => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isRoutine: true,
    frequency: 'DAILY' as Task['frequency'],
    priority: 50,
    severity: 50,
    dependency: ''
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 overflow-y-auto p-6 flex flex-col gap-8"
    >
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <div className="px-2 py-1 bg-white/5 border border-white/10 font-mono text-[10px] text-slate-500">INITIALIZE_TASK</div>
        <h2 className="text-xl font-bold uppercase tracking-tight">System_Input</h2>
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
              <label className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Description_Payload</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-sm text-white focus:ring-1 focus:ring-orange-500/50 focus:outline-none placeholder:text-slate-600"
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
              <span className="font-mono text-[10px] text-slate-500 uppercase">Routine_Flag</span>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isRoutine: !prev.isRoutine }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${formData.isRoutine ? 'bg-orange-500' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.isRoutine ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-slate-500 uppercase">Execution_Freq</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as Task['frequency'] }))}
              >
                <option value="DAILY">CRON: DAILY (0 0 * * *)</option>
                <option value="WEEKLY">CRON: WEEKLY (0 0 * * 0)</option>
                <option value="MONTHLY">CRON: MONTHLY (0 0 1 * *)</option>
              </select>
            </div>
          </div>
        </Frame>

        <Frame title="MTX_DEF">
           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-slate-500 uppercase">Priority_LVL</span>
                    <span className="text-blue-400">VALUE: {formData.priority}</span>
                 </div>
                 <input 
                   type="range" 
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                   value={formData.priority}
                   onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-slate-500 uppercase">Severity_IDX</span>
                    <span className="text-orange-400">VALUE: {formData.severity}</span>
                 </div>
                 <input 
                   type="range" 
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                   value={formData.severity}
                   onChange={(e) => setFormData(prev => ({ ...prev, severity: parseInt(e.target.value) }))}
                 />
              </div>
           </div>
        </Frame>

        <Frame title="DEP_MAP" className="md:col-span-2">
           <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] text-slate-500 uppercase">Blocked_By</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none"
                value={formData.dependency}
                onChange={(e) => setFormData(prev => ({ ...prev, dependency: e.target.value }))}
              >
                <option value="">NO_DEPENDENCIES</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.id}: {t.name}</option>
                ))}
              </select>
           </div>
        </Frame>
      </div>

      <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-white/5">
        <Button variant="ghost" onClick={onCancel}>Abort</Button>
        <Button onClick={() => {
          if (!formData.name) return;
          onSubmit({
            id: `TSK_${Math.floor(100 + Math.random() * 900)}`,
            name: formData.name,
            description: formData.description,
            isRoutine: formData.isRoutine,
            frequency: formData.isRoutine ? formData.frequency : undefined,
            priority: formData.priority,
            severity: formData.severity,
            dependencies: formData.dependency ? [formData.dependency] : [],
            isCompleted: false,
            createdAt: Date.now()
          });
        }}>Commit_Task</Button>
      </div>
    </motion.div>
  );
}

function AnalyticsView({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.isCompleted).length;
    const criticals = tasks.filter(t => t.severity > 80).length;
    return { completed, criticals, total: tasks.length };
  }, [tasks]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight">Cycle_Report // Analytics</h2>
        <StatusChip status="Archived_Secure" type="SUCCESS" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-white/5 p-[1px] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/50 p-4 md:p-6 flex flex-col gap-2">
           <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Failures Prevented</span>
           <div className="text-3xl md:text-4xl font-black text-blue-400 font-mono">{stats.completed}</div>
        </div>
        <div className="bg-slate-900/50 p-4 md:p-6 flex flex-col gap-2">
           <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Escalations Active</span>
           <div className="text-3xl md:text-4xl font-black text-orange-400 font-mono">{stats.criticals}</div>
        </div>
        <div className="bg-slate-900/50 p-4 md:p-6 flex flex-col gap-2">
           <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">System Efficiency</span>
           <div className="text-3xl md:text-4xl font-black text-green-400 font-mono">
             {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
           </div>
        </div>
      </div>

      <Frame title="RADAR_DISTRIBUTION">
         <div className="h-64 flex items-center justify-center relative">
            <div className="w-48 h-48 border border-white/10 rounded-full flex items-center justify-center">
               <div className="w-32 h-32 border border-white/5 rounded-full" />
               <div className="absolute w-full h-[1px] bg-white/5 rotate-45" />
               <div className="absolute w-full h-[1px] bg-white/5 -rotate-45" />
               <div className="absolute w-[1px] h-full bg-white/5" />
               <div className="absolute h-[1px] w-full bg-white/5" />
               
               {/* Decorative Radar Simulation */}
               <div 
                 className="absolute inset-0 bg-blue-500/10" 
                 style={{ clipPath: 'polygon(50% 20%, 80% 50%, 50% 80%, 20% 50%)' }} 
               />
               <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-blue-400 rounded-full glow-blue" />
               <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-orange-400 rounded-full glow-orange" />
            </div>
         </div>
      </Frame>
    </motion.div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 ${color}`} />
      <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
