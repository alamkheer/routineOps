// ============================================================
// Tests — Escalation Engine
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeEscalationTier,
  computeCascadingEffects,
  detectCircularDependencies,
} from '../escalation';
import { DEFAULT_RULES } from '../rules';
import { CYCLE_DURATION_MS } from '../scheduler';
import { CircularDependencyError } from '../errors';
import type { Task, EscalationResult } from '../../types';

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = 1_700_000_000_000;
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

describe('computeEscalationTier', () => {
  it('returns NOMINAL for completed tasks regardless of overdue time', () => {
    const task = makeTask({ isCompleted: true });
    const now = task.scheduledAt + 10 * CYCLE_DURATION_MS.DAILY; // Very overdue
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('NOMINAL');
    expect(result.healthImpact).toBe(0);
  });

  it('returns NOMINAL for tasks within schedule (early in cycle)', () => {
    const task = makeTask();
    // 10% into the cycle
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY * 0.1;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('NOMINAL');
  });

  it('returns WARNING at 75% elapsed time', () => {
    const task = makeTask();
    // 80% into the cycle (past 75% threshold, but before deadline)
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY * 0.8;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('WARNING');
    expect(result.healthImpact).toBe(-5);
  });

  it('returns WARNING just past deadline but before 1 full cycle overdue', () => {
    const task = makeTask();
    const now = task.scheduledAt + 1000; // Just past deadline
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('WARNING');
  });

  it('returns INCIDENT at 1 cycle overdue', () => {
    const task = makeTask();
    const now = task.scheduledAt + CYCLE_DURATION_MS.DAILY;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('INCIDENT');
    expect(result.healthImpact).toBe(-15);
  });

  it('returns OUTAGE at 2 cycles overdue', () => {
    const task = makeTask();
    const now = task.scheduledAt + 2 * CYCLE_DURATION_MS.DAILY;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('OUTAGE');
    expect(result.healthImpact).toBe(-30);
  });

  it('returns CATASTROPHE at 3 cycles overdue with 2+ dependents', () => {
    const task = makeTask({ dependents: ['A', 'B'] });
    const now = task.scheduledAt + 3 * CYCLE_DURATION_MS.DAILY;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('CATASTROPHE');
    expect(result.healthImpact).toBe(-50);
  });

  it('does NOT return CATASTROPHE if dependent count < 2 (falls back to OUTAGE)', () => {
    const task = makeTask({ dependents: ['A'] }); // Only 1 dependent
    const now = task.scheduledAt + 3 * CYCLE_DURATION_MS.DAILY;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('OUTAGE');
  });

  it('handles missing frequency (defaults to DAILY)', () => {
    const task = makeTask({ frequency: undefined, isRoutine: false });
    const now = task.scheduledAt + CYCLE_DURATION_MS.DAILY;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('INCIDENT');
  });

  it('handles future scheduledAt (always NOMINAL or WARNING)', () => {
    const task = makeTask();
    const now = task.cycleStartedAt + CYCLE_DURATION_MS.DAILY * 0.5;
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('NOMINAL');
  });

  it('works correctly for WEEKLY tasks', () => {
    const task = makeTask({
      frequency: 'WEEKLY',
      scheduledAt: 1_700_000_000_000 + CYCLE_DURATION_MS.WEEKLY,
    });
    const now = task.scheduledAt + CYCLE_DURATION_MS.WEEKLY; // 1 cycle overdue
    const result = computeEscalationTier(task, DEFAULT_RULES, now);
    expect(result.tier).toBe('INCIDENT');
  });
});

describe('computeCascadingEffects', () => {
  it('auto-escalates dependent by +1 tier when blocker reaches OUTAGE', () => {
    const blocker = makeTask({ id: 'BLOCKER', dependents: ['DEP'] });
    const dependent = makeTask({
      id: 'DEP',
      dependencies: ['BLOCKER'],
    });

    const results = new Map<string, EscalationResult>([
      ['BLOCKER', { tier: 'OUTAGE', overdueMs: 200_000_000, healthImpact: -30 }],
      ['DEP', { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 }],
    ]);

    const updated = computeCascadingEffects([blocker, dependent], results);
    const depResult = updated.get('DEP');
    expect(depResult?.tier).toBe('WARNING');
  });

  it('does not escalate beyond CATASTROPHE', () => {
    const blocker = makeTask({ id: 'BLOCKER', dependents: ['DEP'] });
    const dependent = makeTask({
      id: 'DEP',
      dependencies: ['BLOCKER'],
    });

    const results = new Map<string, EscalationResult>([
      ['BLOCKER', { tier: 'CATASTROPHE', overdueMs: 500_000_000, healthImpact: -50 }],
      ['DEP', { tier: 'CATASTROPHE', overdueMs: 400_000_000, healthImpact: -50 }],
    ]);

    const updated = computeCascadingEffects([blocker, dependent], results);
    const depResult = updated.get('DEP');
    expect(depResult?.tier).toBe('CATASTROPHE');
  });

  it('does not cascade from blockers below OUTAGE', () => {
    const blocker = makeTask({ id: 'BLOCKER', dependents: ['DEP'] });
    const dependent = makeTask({
      id: 'DEP',
      dependencies: ['BLOCKER'],
    });

    const results = new Map<string, EscalationResult>([
      ['BLOCKER', { tier: 'INCIDENT', overdueMs: 100_000_000, healthImpact: -15 }],
      ['DEP', { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 }],
    ]);

    const updated = computeCascadingEffects([blocker, dependent], results);
    const depResult = updated.get('DEP');
    expect(depResult?.tier).toBe('NOMINAL');
  });

  it('skips completed dependent tasks', () => {
    const blocker = makeTask({ id: 'BLOCKER', dependents: ['DEP'] });
    const dependent = makeTask({
      id: 'DEP',
      dependencies: ['BLOCKER'],
      isCompleted: true,
    });

    const results = new Map<string, EscalationResult>([
      ['BLOCKER', { tier: 'OUTAGE', overdueMs: 200_000_000, healthImpact: -30 }],
      ['DEP', { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 }],
    ]);

    const updated = computeCascadingEffects([blocker, dependent], results);
    const depResult = updated.get('DEP');
    expect(depResult?.tier).toBe('NOMINAL');
  });
});

describe('detectCircularDependencies', () => {
  it('does not throw for acyclic graphs', () => {
    const tasks = [
      makeTask({ id: 'A', dependencies: ['B'] }),
      makeTask({ id: 'B', dependencies: ['C'] }),
      makeTask({ id: 'C', dependencies: [] }),
    ];
    expect(() => detectCircularDependencies(tasks)).not.toThrow();
  });

  it('throws CircularDependencyError for direct cycle (A → B → A)', () => {
    const tasks = [
      makeTask({ id: 'A', dependencies: ['B'] }),
      makeTask({ id: 'B', dependencies: ['A'] }),
    ];
    expect(() => detectCircularDependencies(tasks)).toThrow(CircularDependencyError);
  });

  it('throws CircularDependencyError for indirect cycle (A → B → C → A)', () => {
    const tasks = [
      makeTask({ id: 'A', dependencies: ['B'] }),
      makeTask({ id: 'B', dependencies: ['C'] }),
      makeTask({ id: 'C', dependencies: ['A'] }),
    ];
    expect(() => detectCircularDependencies(tasks)).toThrow(CircularDependencyError);
  });

  it('includes the cycle path in the error', () => {
    const tasks = [
      makeTask({ id: 'A', dependencies: ['B'] }),
      makeTask({ id: 'B', dependencies: ['A'] }),
    ];
    try {
      detectCircularDependencies(tasks);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CircularDependencyError);
      const err = e as CircularDependencyError;
      expect(err.cycle).toContain('A');
      expect(err.cycle).toContain('B');
    }
  });

  it('handles deep dependency chains (A → B → C → D)', () => {
    const tasks = [
      makeTask({ id: 'A', dependencies: ['B'] }),
      makeTask({ id: 'B', dependencies: ['C'] }),
      makeTask({ id: 'C', dependencies: ['D'] }),
      makeTask({ id: 'D', dependencies: [] }),
    ];
    expect(() => detectCircularDependencies(tasks)).not.toThrow();
  });

  it('handles isolated tasks with no dependencies', () => {
    const tasks = [
      makeTask({ id: 'A', dependencies: [] }),
      makeTask({ id: 'B', dependencies: [] }),
    ];
    expect(() => detectCircularDependencies(tasks)).not.toThrow();
  });
});
