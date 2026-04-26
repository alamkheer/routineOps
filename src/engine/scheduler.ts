// ============================================================
// Routine Ops — Cycle Duration Constants & Scheduler
// Pure functions — no side effects, no framework deps.
// ============================================================

import type { Task } from '../types';

/**
 * Duration of one cycle in milliseconds, per task frequency.
 */
export const CYCLE_DURATION_MS = {
  DAILY:   24 * 60 * 60 * 1000,         // 86,400,000 ms
  WEEKLY:  7 * 24 * 60 * 60 * 1000,     // 604,800,000 ms
  MONTHLY: 30 * 24 * 60 * 60 * 1000,    // 2,592,000,000 ms
} as const;

/**
 * Returns the cycle duration for a given frequency.
 * One-time tasks (no frequency) default to DAILY urgency.
 */
export function getCycleDurationMs(frequency?: Task['frequency']): number {
  if (!frequency) return CYCLE_DURATION_MS.DAILY;
  return CYCLE_DURATION_MS[frequency];
}

/**
 * Determines if a routine task's cycle should be reset.
 *
 * A cycle resets when:
 * 1. The task IS a routine task
 * 2. The task IS completed
 * 3. The current time is past the end of the current cycle
 *
 * @returns true if the cycle should reset
 */
export function shouldResetCycle(
  task: Task,
  now: number = Date.now(),
): boolean {
  if (!task.isRoutine) return false;
  if (!task.isCompleted) return false;

  const cycleDuration = getCycleDurationMs(task.frequency);
  const cycleEnd = task.cycleStartedAt + cycleDuration;
  return now >= cycleEnd;
}

/**
 * Calculates the next `scheduledAt` timestamp for a task
 * based on when its current cycle started and its frequency.
 */
export function getNextScheduledAt(
  cycleStartedAt: number,
  frequency?: Task['frequency'],
): number {
  return cycleStartedAt + getCycleDurationMs(frequency);
}

/**
 * Returns the start of the next cycle for a routine task.
 */
export function getNextCycleStart(
  currentCycleStart: number,
  frequency?: Task['frequency'],
): number {
  return currentCycleStart + getCycleDurationMs(frequency);
}
