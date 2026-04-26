import { useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { getEscalationClasses } from '../../utils/escalation-colors';
import { EscalationBadge } from '../EscalationBadge';
import type { TaskOccurrence } from './utils';

interface CalendarCellProps {
  date: Date;
  occurrences: TaskOccurrence[];
  onSelectTask: (id: string) => void;
  onDayClick: (date: Date) => void;
  isCurrentMonth?: boolean;
  maxItems?: number;
}

export function CalendarCell({
  date,
  occurrences,
  onSelectTask,
  onDayClick,
  isCurrentMonth = true,
  maxItems = 3,
}: CalendarCellProps) {
  const displayed = occurrences.slice(0, maxItems);
  const overflow = occurrences.length - maxItems;
  const today = isToday(date);

  return (
    <div
      onClick={() => onDayClick(date)}
      className={`
        relative border border-white/5 p-1 md:p-2 flex flex-col gap-1 min-h-[80px] md:min-h-[100px] transition-colors
        cursor-pointer
        ${isCurrentMonth ? 'bg-white/5 hover:bg-white/10' : 'bg-transparent opacity-40'}
      `}
    >
      <div className="flex justify-between items-start">
        <span
          className={`
            text-[10px] md:text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full
            ${today ? 'bg-amber-warning text-black font-bold' : 'text-on-surface-muted'}
          `}
        >
          {format(date, 'd')}
        </span>
        {occurrences.length > 0 && (
          <span className="text-[8px] font-mono text-on-surface-muted md:hidden">
            {occurrences.length} tasks
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        {displayed.map((occ, i) => {
          const tier = occ.task.isCompleted ? 'NOMINAL' : occ.task.computedTier;
          const classes = getEscalationClasses(tier);
          return (
            <button
              key={`${occ.task.id}-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTask(occ.task.id);
              }}
              className={`
                text-left w-full truncate text-[9px] md:text-[10px] font-sans font-medium px-1.5 py-0.5 rounded
                border transition-all
                ${occ.task.isCompleted ? 'opacity-50 grayscale border-white/10 text-white/50' : `${classes.bg} ${classes.text} ${classes.border} hover:opacity-80`}
              `}
            >
              {occ.task.name}
            </button>
          );
        })}

        {overflow > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDayClick(date);
            }}
            className="text-left w-full text-[9px] md:text-[10px] font-mono text-on-surface-muted hover:text-white px-1.5 py-0.5"
          >
            + {overflow} more
          </button>
        )}
      </div>
    </div>
  );
}
