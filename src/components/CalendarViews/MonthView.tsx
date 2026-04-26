import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../UI';
import { CalendarCell } from './CalendarCell';
import { generateOccurrences } from './utils';
import { TaskCard } from '../TaskCard';
import { DateModal } from './DateModal';
import type { EvaluatedTask } from '../../types';

interface MonthViewProps {
  tasks: EvaluatedTask[];
  onSelectTask: (id: string) => void;
  selectedTaskId?: string;
  onToggleTask?: (id: string) => void | Promise<void>;
}

export function MonthView({ tasks, onSelectTask, selectedTaskId, onToggleTask }: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const occurrences = useMemo(() => {
    return generateOccurrences(tasks, startDate, endDate);
  }, [tasks, startDate, endDate]);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  // Days of week header (Mon-Sun)
  const weekDays = eachDayOfInterval({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) });

  return (
    <div className="flex-1 flex flex-col h-full bg-white/5 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
        <h2 className="text-lg md:text-xl font-sans font-bold text-white uppercase tracking-tight">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" className="px-3 py-1 text-xs" onClick={today}>
            TODAY
          </Button>
          <div className="flex gap-1 bg-white/5 rounded-lg border border-white/10">
            <Button variant="ghost" className="p-1.5 hover:bg-white/10 rounded-l-lg border-r border-white/10" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="p-1.5 hover:bg-white/10 rounded-r-lg" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0 p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={format(day, 'E')} className="text-center font-mono text-[10px] md:text-xs text-on-surface-muted uppercase">
              {format(day, 'E')}
            </div>
          ))}
        </div>

        {/* Days Row */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1">
          {days.map((day) => {
            const dayOccurrences = occurrences.filter((occ) => isSameDay(occ.date, day));
            return (
              <CalendarCell
                key={day.toISOString()}
                date={day}
                occurrences={dayOccurrences}
                onSelectTask={onSelectTask}
                onDayClick={setSelectedDate}
                isCurrentMonth={isSameMonth(day, currentDate)}
                maxItems={2} // Show fewer items to avoid month view cells being too tall
              />
            );
          })}
        </div>
      </div>

      {/* Mobile Selected Task Preview */}
      {selectedTask && !selectedDate && (
        <div className="xl:hidden absolute bottom-4 left-4 right-4 z-50">
          <TaskCard task={selectedTask} onAction={() => onToggleTask?.(selectedTask.id)} mobileCompat />
        </div>
      )}

      {/* Full Date Modal */}
      {selectedDate && (
        <DateModal
          date={selectedDate}
          occurrences={occurrences.filter((occ) => isSameDay(occ.date, selectedDate))}
          onClose={() => setSelectedDate(null)}
          onSelectTask={onSelectTask}
        />
      )}
    </div>
  );
}
