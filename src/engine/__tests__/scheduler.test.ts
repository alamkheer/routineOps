// ============================================================
// Tests — Scheduler (Cycle Management)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  CYCLE_DURATION_MS,
  getCycleDurationMs,
  shouldResetCycle,
  getNextScheduledAt,
  getNextCycleStart,
} from '../scheduler';
import type { Task } from '../../types';

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = 1_700_000_000_000; // Fixed timestamp
  return {
    id: 'TSK_TEST',
    name: 'Test Task',
    description: 'A test task',
    isRoutine: true,
    frequency: 'DAILY',
    priority: 50,
    severity: 50,
    dependencies: [],
    dependents: [],
    isCompleted: false,
    isArchived: false,
    createdAt: now,
    scheduledAt: now + CYCLE_DURATION_MS.DAILY,
    cycleStartedAt: now,
    escalationTier: 'NOMINAL',
    ...overrides,
  };
}

describe('getCycleDurationMs', () => {
  it('returns DAILY duration for DAILY frequency', () => {
    expect(getCycleDurationMs('DAILY')).toBe(86_400_000);
  });

  it('returns WEEKLY duration for WEEKLY frequency', () => {
    expect(getCycleDurationMs('WEEKLY')).toBe(604_800_000);
  });

  it('returns MONTHLY duration for MONTHLY frequency', () => {
    expect(getCycleDurationMs('MONTHLY')).toBe(2_592_000_000);
  });

  it('defaults to DAILY when frequency is undefined', () => {
    expect(getCycleDurationMs(undefined)).toBe(CYCLE_DURATION_MS.DAILY);
  });
});

describe('shouldResetCycle', () => {
  it('returns false for non-routine tasks', () => {
    const task = makeTask({ isRoutine: false, isCompleted: true });
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY + 1;
    expect(shouldResetCycle(task, now)).toBe(false);
  });

  it('returns false for incomplete tasks', () => {
    const task = makeTask({ isCompleted: false });
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY + 1;
    expect(shouldResetCycle(task, now)).toBe(false);
  });

  it('returns false if cycle has not ended', () => {
    const task = makeTask({ isCompleted: true });
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY - 1;
    expect(shouldResetCycle(task, now)).toBe(false);
  });

  it('returns true when routine task is completed and cycle has ended', () => {
    const task = makeTask({ isCompleted: true });
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY + 1;
    expect(shouldResetCycle(task, now)).toBe(true);
  });

  it('returns true at exact cycle boundary', () => {
    const task = makeTask({ isCompleted: true });
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY;
    expect(shouldResetCycle(task, now)).toBe(true);
  });

  it('uses WEEKLY duration for weekly tasks', () => {
    const task = makeTask({ frequency: 'WEEKLY', isCompleted: true });
    const justBeforeCycleEnd = task.cycleStartedAt + CYCLE_DURATION_MS.WEEKLY - 1;
    expect(shouldResetCycle(task, justBeforeCycleEnd)).toBe(false);

    const atCycleEnd = task.cycleStartedAt + CYCLE_DURATION_MS.WEEKLY;
    expect(shouldResetCycle(task, atCycleEnd)).toBe(true);
  });
});

describe('getNextScheduledAt', () => {
  it('returns cycleStart + daily duration for daily tasks', () => {
    const start = 1_700_000_000_000;
    expect(getNextScheduledAt(start, 'DAILY')).toBe(start + CYCLE_DURATION_MS.DAILY);
  });

  it('defaults to daily for undefined frequency', () => {
    const start = 1_700_000_000_000;
    expect(getNextScheduledAt(start, undefined)).toBe(start + CYCLE_DURATION_MS.DAILY);
  });
});

describe('getNextCycleStart', () => {
  it('advances by one cycle duration', () => {
    const start = 1_700_000_000_000;
    expect(getNextCycleStart(start, 'MONTHLY')).toBe(start + CYCLE_DURATION_MS.MONTHLY);
  });
});
