import { getCycleDurationMs } from '../../engine/scheduler';
import type { EvaluatedTask } from '../../types';

export interface TaskOccurrence {
  task: EvaluatedTask;
  date: Date;
}

export function generateOccurrences(
  tasks: EvaluatedTask[],
  startDate: Date,
  endDate: Date
): TaskOccurrence[] {
  const occurrences: TaskOccurrence[] = [];

  for (const task of tasks) {
    if (task.isRoutine && task.frequency) {
      let currTime = task.scheduledAt;
      const cycleMs = getCycleDurationMs(task.frequency);

      // Step backwards to find the earliest occurrence that falls in the window
      while (currTime > startDate.getTime() && currTime > task.createdAt) {
        currTime -= cycleMs;
      }

      // Step forwards to ensure we don't start before startDate or createdAt
      while (currTime < startDate.getTime() || currTime < task.createdAt) {
        currTime += cycleMs;
      }

      // Generate occurrences up to endDate
      while (currTime <= endDate.getTime()) {
        occurrences.push({ task, date: new Date(currTime) });
        currTime += cycleMs;
      }
    } else {
      const date = new Date(task.scheduledAt);
      if (date >= startDate && date <= endDate) {
        occurrences.push({ task, date });
      }
    }
  }

  // Sort chronologically
  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}
