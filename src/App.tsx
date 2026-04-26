import { useState, useMemo } from 'react';
import { Grid, List, BarChart3, Radio, Loader2, Calendar, CalendarDays } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from './components/UI';
import { NavItem } from './components/NavItem';
import { MatrixView } from './components/MatrixView';
import { ListView } from './components/ListView';
import { AnalyticsView } from './components/AnalyticsView';
import { WeekView, MonthView } from './components/CalendarViews';
import { TaskForm } from './components/TaskForm';
import { TerminalOverlay } from './components/TerminalOverlay';
import { ContextSidebar } from './components/ContextSidebar';

import { useDatabase } from './hooks/useDatabase';
import { useEscalation } from './hooks/useEscalation';
import { useSystemHealth } from './hooks/useSystemHealth';
import type { Screen } from './types';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('MATRIX');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  // 1. Base DB layer
  const { isLoading, addTask, toggleTask, archiveTask, forceAgeTask, logs } = useDatabase();
  
  // 2. Escalation Engine layer (computes tiers)
  const { tasks: evaluatedTasks } = useEscalation();
  
  // 3. Health Engine layer (computes score from evaluated tasks)
  const health = useSystemHealth(evaluatedTasks);

  // Filter out archived tasks for the UI
  const activeTasks = useMemo(() => evaluatedTasks.filter(t => !t.isArchived), [evaluatedTasks]);

  const currentTask = activeTasks.find(t => t.id === selectedTaskId) || activeTasks[0];

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background-void items-center justify-center gap-4">
        <div className="mesh-gradient">
          <div className="mesh-1" />
          <div className="mesh-2" />
        </div>
        <Loader2 className="w-8 h-8 text-amber-warning animate-spin" />
        <p className="font-mono text-xs text-on-surface-muted uppercase tracking-widest">Initializing_Database...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-void relative">
      <div className="mesh-gradient">
        <div className="mesh-1" />
        <div className="mesh-2" />
      </div>
      <div className="scanning-line" />
      
      {/* Top Bar */}
      <header className="h-16 md:h-20 border-b border-border-subtle bg-background-void/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-50 shrink-0">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] shrink-0">
            <Radio className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex flex-col justify-center truncate">
            <h1 className="text-white font-sans font-bold text-lg md:text-xl tracking-tight uppercase truncate">
              ROUTINE OPS<span className="hidden md:inline text-amber-warning italic ml-2">// ESCALATION MATRIX</span>
            </h1>
            <p className="hidden md:block text-[10px] text-on-surface-muted font-mono tracking-widest uppercase mt-0.5">
              System Integrity: {Math.round(health.score)}% • Status: {health.status.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-4 shrink-0">
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
          <div className="p-4 mb-2 border-b border-border-subtle">
             <span className="font-mono text-[10px] text-on-surface-muted uppercase tracking-wider font-bold">System_Navigation</span>
          </div>
          
          <div className="flex flex-col gap-3 px-2">
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
            <NavItem 
              active={activeScreen === 'WEEK_VIEW'} 
              onClick={() => setActiveScreen('WEEK_VIEW')}
              icon={<Calendar className="w-4 h-4" />} 
              label="Week View" 
            />
            <NavItem 
              active={activeScreen === 'MONTH_VIEW'} 
              onClick={() => setActiveScreen('MONTH_VIEW')}
              icon={<CalendarDays className="w-4 h-4" />} 
              label="Month View" 
            />
          </div>
          
          <div className="mt-auto p-4 border-t border-border-subtle">
             <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-on-surface-muted uppercase">Health_Score</span>
                <div className="flex items-center gap-3">
                   <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-system transition-all duration-500" 
                        style={{ width: `${health.score}%` }} 
                      />
                   </div>
                   <span className="text-[10px] font-mono text-cyan-system">{Math.round(health.score)}%</span>
                </div>
             </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative">
          
          {/* Main Display */}
          <div className="flex-1 flex flex-col frosted-card overflow-hidden relative">
             <AnimatePresence mode="wait">
                {activeScreen === 'MATRIX' && <MatrixView tasks={activeTasks} onSelectTask={setSelectedTaskId} selectedTaskId={selectedTaskId} onToggleTask={toggleTask} key="matrix" />}
                {activeScreen === 'LISTS' && <ListView tasks={activeTasks} onToggleTask={toggleTask} onSelectTask={setSelectedTaskId} selectedTaskId={selectedTaskId} key="lists" />}
                {activeScreen === 'ANALYTICS' && <AnalyticsView tasks={activeTasks} health={health} key="analytics" />}
                {activeScreen === 'WEEK_VIEW' && <WeekView tasks={activeTasks} onSelectTask={setSelectedTaskId} selectedTaskId={selectedTaskId} onToggleTask={toggleTask} key="week_view" />}
                {activeScreen === 'MONTH_VIEW' && <MonthView tasks={activeTasks} onSelectTask={setSelectedTaskId} selectedTaskId={selectedTaskId} onToggleTask={toggleTask} key="month_view" />}
                {activeScreen === 'NEW_TASK' && (
                  <TaskForm 
                    tasks={activeTasks}
                    onCancel={() => setActiveScreen('MATRIX')}
                    onSubmit={async (newTask) => {
                      await addTask(newTask);
                      setActiveScreen('MATRIX');
                    }}
                    key="new_task"
                  />
                )}
             </AnimatePresence>

             {/* Terminal Overlay */}
             {activeScreen !== 'NEW_TASK' && <TerminalOverlay logs={logs} />}
          </div>

          {/* Context Sidebar (Right) */}
          <ContextSidebar 
            currentTask={currentTask} 
            onToggleTask={toggleTask} 
            onArchiveTask={archiveTask} 
            onForceAgeTask={forceAgeTask}
          />
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden h-16 border-t border-border-subtle bg-background-void flex items-center justify-around z-50 shrink-0">
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
          <NavItem 
            active={activeScreen === 'WEEK_VIEW'} 
            onClick={() => setActiveScreen('WEEK_VIEW')}
            icon={<Calendar className="w-5 h-5" />} 
            label="WEEK"
            mobile
          />
          <NavItem 
            active={activeScreen === 'MONTH_VIEW'} 
            onClick={() => setActiveScreen('MONTH_VIEW')}
            icon={<CalendarDays className="w-5 h-5" />} 
            label="MONTH"
            mobile
          />
      </div>
    </div>
  );
}
