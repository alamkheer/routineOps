import Dexie, { type EntityTable } from 'dexie';
import type { Task, SystemLog, HealthSnapshot } from './types';

// Database definition
const db = new Dexie('RoutineOpsDB') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
  logs: EntityTable<SystemLog, 'id'>;
  healthHistory: EntityTable<HealthSnapshot, 'id'>;
};

// --- Schema v1 (original) ---
db.version(1).stores({
  tasks: 'id, priority, severity, isCompleted, createdAt',
  logs: 'id, timestamp',
});

// --- Schema v2 (escalation support) ---
db.version(2).stores({
  tasks: 'id, priority, severity, isCompleted, escalationTier, scheduledAt, createdAt',
  logs: 'id, timestamp, type, relatedTaskId',
  healthHistory: 'id, timestamp',
}).upgrade(tx => {
  // Migrate existing v1 tasks: add new required fields with defaults
  const DAILY_MS = 24 * 60 * 60 * 1000;
  return tx.table('tasks').toCollection().modify((task: Record<string, unknown>) => {
    task.escalationTier = 'NOMINAL';
    task.scheduledAt = (task.createdAt as number) + DAILY_MS;
    task.cycleStartedAt = task.createdAt;
    task.escalatedAt = undefined;
    task.dependents = [];
    task.isArchived = false;
  });
});

// Seed initial tasks on first-ever database creation
db.on('populate', (tx) => {
  const now = Date.now();
  const DAILY_MS = 24 * 60 * 60 * 1000;
  const WEEKLY_MS = 7 * DAILY_MS;

  tx.table('tasks').bulkAdd([
    {
      id: 'TSK_LNDRY_01',
      name: 'Core Laundry Flush',
      description: 'Execute full cycle on domestic textiles.',
      isRoutine: true,
      frequency: 'WEEKLY',
      priority: 85,
      severity: 92,
      dependencies: ['DEP_REFILL_DTG'],
      dependents: [],
      isCompleted: false,
      isArchived: false,
      createdAt: now,
      scheduledAt: now + WEEKLY_MS,
      cycleStartedAt: now,
      escalationTier: 'NOMINAL',
    },
    {
      id: 'DEP_REFILL_DTG',
      name: 'Detergent Resupply',
      description: 'Procure chemical cleaning agent.',
      isRoutine: false,
      priority: 40,
      severity: 75,
      dependencies: [],
      dependents: ['TSK_LNDRY_01'],
      isCompleted: false,
      isArchived: false,
      createdAt: now,
      scheduledAt: now + DAILY_MS,
      cycleStartedAt: now,
      escalationTier: 'NOMINAL',
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
      dependents: [],
      isCompleted: false,
      isArchived: false,
      createdAt: now,
      scheduledAt: now + DAILY_MS,
      cycleStartedAt: now,
      escalationTier: 'NOMINAL',
    },
  ]);

  tx.table('logs').bulkAdd([
    {
      id: crypto.randomUUID(),
      timestamp: now,
      message: 'SYSTEM_READY // INITIALIZED',
      type: 'SUCCESS',
    },
    {
      id: crypto.randomUUID(),
      timestamp: now,
      message: 'SCANNING_ROUTINES: 3 ENTITIES FOUND',
      type: 'INFO',
    },
  ]);
});

export { db };
