import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Task, SystemLog, LogType } from '../types';

const MAX_LOGS = 50;

/**
 * React hook that provides live-queried tasks/logs and
 * mutation functions backed by IndexedDB via Dexie.
 */
export function useDatabase() {
  // Live queries — automatically re-render when DB changes
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const logs = useLiveQuery(
    () => db.logs.orderBy('timestamp').reverse().limit(MAX_LOGS).toArray()
  ) ?? [];

  // Reverse so oldest-first for display (query was newest-first for the LIMIT)
  // const sortedLogs = [...logs].reverse();
  const sortedLogs = [...logs];

  const isLoading = tasks === undefined || logs === undefined;

  // --- Mutations ---

  async function addTask(task: Task) {
    await db.tasks.add(task);
    await addLog(`TASK_CREATED: ${task.id} (${task.name})`, 'INFO', task.id);
  }

  async function updateTask(id: string, changes: Partial<Task>) {
    await db.tasks.update(id, changes);
  }

  async function toggleTask(id: string) {
    const task = await db.tasks.get(id);
    if (task) {
      const now = Date.now();
      if (task.isCompleted) {
        // Reopening — reset to active
        await db.tasks.update(id, {
          isCompleted: false,
          completedAt: undefined,
        });
        await addLog(`TASK_REOPENED: ${task.id}`, 'WARN', task.id);
      } else {
        // Completing — record completion time, reset tier to NOMINAL
        await db.tasks.update(id, {
          isCompleted: true,
          completedAt: now,
          escalationTier: 'NOMINAL',
        });
        await addLog(`TASK_RESOLVED: ${task.id}`, 'SUCCESS', task.id);
      }
    }
  }

  async function deleteTask(id: string) {
    await db.tasks.delete(id);
  }

  async function archiveTask(id: string) {
    await db.tasks.update(id, { isArchived: true });
    await addLog(`RECORD_ARCHIVED: ${id}`, 'INFO', id);
  }

  // --- DEV TOOLS ---
  async function forceAgeTask(id: string) {
    const task = await db.tasks.get(id);
    if (task) {
      const DAY = 24 * 60 * 60 * 1000;
      await db.tasks.update(id, {
        scheduledAt: task.scheduledAt - DAY,
        cycleStartedAt: task.cycleStartedAt - DAY,
      });
      await addLog(`DEV_TOOLS: Artificial aging +24h applied to ${id}`, 'WARN', id);
    }
  }

  async function addLog(
    message: string,
    type: LogType = 'INFO',
    relatedTaskId?: string,
  ) {
    await db.logs.add({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      type,
      relatedTaskId,
    });

    // Trim old logs beyond the cap
    const count = await db.logs.count();
    if (count > MAX_LOGS) {
      const excess = await db.logs
        .orderBy('timestamp')
        .limit(count - MAX_LOGS)
        .primaryKeys();
      await db.logs.bulkDelete(excess);
    }
  }

  return {
    tasks,
    logs: sortedLogs,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    archiveTask,
    forceAgeTask,
    addLog,
  };
}
