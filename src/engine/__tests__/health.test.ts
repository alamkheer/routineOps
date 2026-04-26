// ============================================================
// Tests — System Health Calculator
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  calculateSystemHealth,
  calculateRecoveryPenalties,
  calculateCompletionBonuses,
  getStatusFromScore,
} from '../health';
import { CYCLE_DURATION_MS } from '../scheduler';
import type { EvaluatedTask } from '../../types';

function makeEvaluatedTask(overrides: Partial<EvaluatedTask> = {}): EvaluatedTask {
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
    computedTier: 'NOMINAL',
    healthImpact: 0,
    ...overrides,
  };
}

describe('getStatusFromScore', () => {
  it('returns OPTIMAL for scores 90–100', () => {
    expect(getStatusFromScore(100)).toBe('OPTIMAL');
    expect(getStatusFromScore(95)).toBe('OPTIMAL');
    expect(getStatusFromScore(90)).toBe('OPTIMAL');
  });

  it('returns NOMINAL for scores 70–89', () => {
    expect(getStatusFromScore(89)).toBe('NOMINAL');
    expect(getStatusFromScore(70)).toBe('NOMINAL');
  });

  it('returns DEGRADED for scores 50–69', () => {
    expect(getStatusFromScore(69)).toBe('DEGRADED');
    expect(getStatusFromScore(50)).toBe('DEGRADED');
  });

  it('returns AT_RISK for scores 30–49', () => {
    expect(getStatusFromScore(49)).toBe('AT_RISK');
    expect(getStatusFromScore(30)).toBe('AT_RISK');
  });

  it('returns CRITICAL for scores 10–29', () => {
    expect(getStatusFromScore(29)).toBe('CRITICAL');
    expect(getStatusFromScore(10)).toBe('CRITICAL');
  });

  it('returns SYSTEM_FAILURE for scores 0–9', () => {
    expect(getStatusFromScore(9)).toBe('SYSTEM_FAILURE');
    expect(getStatusFromScore(0)).toBe('SYSTEM_FAILURE');
  });
});

describe('calculateSystemHealth', () => {
  it('returns 100 when all tasks are NOMINAL', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', healthImpact: 0 }),
      makeEvaluatedTask({ id: 'B', healthImpact: 0 }),
    ];
    const health = calculateSystemHealth(tasks);
    // With 2 completed=false nominal tasks, bonus is 0 + milestone 0
    // score = 100 - 0 - 0 + 0 = 100
    // Actually there may be completion bonuses for nominal tier...
    // completedBeforeEscalation = tasks that are completed AND nominal
    // These tasks are not completed, so no bonus
    expect(health.score).toBe(100);
    expect(health.status).toBe('OPTIMAL');
  });

  it('correctly sums penalties across multiple escalated tasks', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', healthImpact: -15, computedTier: 'INCIDENT' }),
      makeEvaluatedTask({ id: 'B', healthImpact: -30, computedTier: 'OUTAGE' }),
    ];
    const health = calculateSystemHealth(tasks);
    // score = 100 - 45 - 0 + 0 = 55
    expect(health.score).toBe(55);
    expect(health.status).toBe('DEGRADED');
  });

  it('clamps score to 0 minimum', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', healthImpact: -50 }),
      makeEvaluatedTask({ id: 'B', healthImpact: -50 }),
      makeEvaluatedTask({ id: 'C', healthImpact: -50 }),
    ];
    const health = calculateSystemHealth(tasks);
    expect(health.score).toBe(0);
  });

  it('clamps score to 100 maximum', () => {
    const tasks = [
      makeEvaluatedTask({
        id: 'A',
        healthImpact: 0,
        computedTier: 'NOMINAL',
        isCompleted: true,
      }),
      makeEvaluatedTask({
        id: 'B',
        healthImpact: 0,
        computedTier: 'NOMINAL',
        isCompleted: true,
      }),
    ];
    const health = calculateSystemHealth(tasks);
    expect(health.score).toBeLessThanOrEqual(100);
  });

  it('includes breakdown in result', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', healthImpact: -15 }),
    ];
    const health = calculateSystemHealth(tasks);
    expect(health.breakdown.baseScore).toBe(100);
    expect(health.breakdown.escalationPenalties).toBe(15);
    expect(health.breakdown).toHaveProperty('recoveryPenalties');
    expect(health.breakdown).toHaveProperty('completionBonus');
  });
});

describe('calculateCompletionBonuses', () => {
  it('returns 0 for empty task list', () => {
    expect(calculateCompletionBonuses([])).toBe(0);
  });

  it('gives +3 per task completed before escalation', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', isCompleted: true, computedTier: 'NOMINAL' }),
      makeEvaluatedTask({ id: 'B', isCompleted: true, computedTier: 'NOMINAL' }),
    ];
    // 2 tasks completed as NOMINAL = +6
    // 100% completion rate = +5
    expect(calculateCompletionBonuses(tasks)).toBe(11);
  });

  it('gives +5 bonus at 80%+ completion rate', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', isCompleted: true, computedTier: 'WARNING' }),
      makeEvaluatedTask({ id: 'B', isCompleted: true, computedTier: 'WARNING' }),
      makeEvaluatedTask({ id: 'C', isCompleted: true, computedTier: 'WARNING' }),
      makeEvaluatedTask({ id: 'D', isCompleted: true, computedTier: 'WARNING' }),
      makeEvaluatedTask({ id: 'E', isCompleted: false, computedTier: 'WARNING' }),
    ];
    // 4/5 = 80% → +5
    // No NOMINAL completions → +0
    expect(calculateCompletionBonuses(tasks)).toBe(5);
  });

  it('gives +2 bonus at 50%+ completion rate (below 80%)', () => {
    const tasks = [
      makeEvaluatedTask({ id: 'A', isCompleted: true, computedTier: 'WARNING' }),
      makeEvaluatedTask({ id: 'B', isCompleted: false }),
    ];
    // 1/2 = 50% → +2
    expect(calculateCompletionBonuses(tasks)).toBe(2);
  });
});

describe('calculateRecoveryPenalties', () => {
  it('returns 0 when no tasks are recovering', () => {
    const tasks = [makeEvaluatedTask()];
    expect(calculateRecoveryPenalties(tasks)).toBe(0);
  });

  it('applies 50% penalty for recently recovered INCIDENT task', () => {
    const now = 1_700_000_000_000;
    const tasks = [
      makeEvaluatedTask({
        id: 'A',
        isCompleted: true,
        completedAt: now - 1000, // Just completed
        escalationTier: 'INCIDENT',
        escalatedAt: now - 100_000,
      }),
    ];
    const penalty = calculateRecoveryPenalties(tasks, now);
    // INCIDENT impact = -15, 50% = 7.5
    expect(penalty).toBe(7.5);
  });

  it('does not apply penalty for WARNING-level recoveries', () => {
    const now = 1_700_000_000_000;
    const tasks = [
      makeEvaluatedTask({
        id: 'A',
        isCompleted: true,
        completedAt: now - 1000,
        escalationTier: 'WARNING',
        escalatedAt: now - 100_000,
      }),
    ];
    const penalty = calculateRecoveryPenalties(tasks, now);
    expect(penalty).toBe(0);
  });

  it('penalty expires after 1 cycle', () => {
    const now = 1_700_000_000_000;
    const tasks = [
      makeEvaluatedTask({
        id: 'A',
        isCompleted: true,
        completedAt: now - CYCLE_DURATION_MS.DAILY - 1, // Completed over 1 cycle ago
        escalationTier: 'INCIDENT',
        escalatedAt: now - CYCLE_DURATION_MS.DAILY - 100_000,
        frequency: 'DAILY',
      }),
    ];
    const penalty = calculateRecoveryPenalties(tasks, now);
    expect(penalty).toBe(0);
  });
});
