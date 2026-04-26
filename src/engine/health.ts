// ============================================================
// Routine Ops — System Health Calculator
// PURE FUNCTIONS — no side effects, no DB access, no framework deps.
// ============================================================

import type { Task, EvaluatedTask, SystemHealth, SystemStatus } from '../types';

/**
 * Calculates the aggregate system health score from evaluated tasks.
 *
 * Formula: score = clamp(0, 100,
 *   100 - Σ(escalation_penalties) - Σ(recovery_penalties) + Σ(completion_bonuses)
 * )
 */
export function calculateSystemHealth(
  tasks: EvaluatedTask[],
  now: number = Date.now(),
): SystemHealth {
  const penalties = tasks.reduce((sum, t) => sum + Math.abs(t.healthImpact), 0);
  const recoveryPenalties = calculateRecoveryPenalties(tasks, now);
  const bonuses = calculateCompletionBonuses(tasks);

  const score = Math.max(0, Math.min(100, 100 - penalties - recoveryPenalties + bonuses));

  return {
    score,
    status: getStatusFromScore(score),
    lastCalculatedAt: now,
    breakdown: {
      baseScore: 100,
      escalationPenalties: penalties,
      recoveryPenalties,
      completionBonus: bonuses,
    },
  };
}

/**
 * Calculates lingering recovery penalties for recently completed tasks
 * that were escalated beyond WARNING.
 *
 * A completed task that was at tier L2+ before completion carries a
 * recovery penalty of 50% of the original deduction for 1 cycle.
 */
export function calculateRecoveryPenalties(
  tasks: EvaluatedTask[],
  now: number = Date.now(),
): number {
  let penalty = 0;

  for (const task of tasks) {
    if (!task.isCompleted || !task.completedAt || !task.escalatedAt) continue;

    // Only apply recovery penalty if task was escalated (INCIDENT+) before completion
    const wasEscalated =
      task.escalationTier === 'INCIDENT' ||
      task.escalationTier === 'OUTAGE' ||
      task.escalationTier === 'CATASTROPHE';

    if (!wasEscalated) continue;

    // Recovery penalty lasts for 1 cycle from completion
    const cycleDurationMs = getCycleDurationForTask(task);
    const penaltyExpiry = task.completedAt + cycleDurationMs;

    if (now < penaltyExpiry) {
      // 50% of the original impact
      const originalImpact = getImpactForTier(task.escalationTier);
      penalty += Math.abs(originalImpact) * 0.5;
    }
  }

  return penalty;
}

/**
 * Calculates completion bonuses from streaks.
 *
 * Bonus rules:
 * - All tasks completed before L1: +3 per task
 * - 50%+ tasks completed: +2
 * - 80%+ tasks completed: +5
 */
export function calculateCompletionBonuses(tasks: EvaluatedTask[]): number {
  if (tasks.length === 0) return 0;

  let bonus = 0;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const completionRate = completedCount / tasks.length;

  // Bonus for completing tasks while they're still NOMINAL
  const completedBeforeEscalation = tasks.filter(
    t => t.isCompleted && t.computedTier === 'NOMINAL',
  ).length;
  bonus += completedBeforeEscalation * 3;

  // Milestone bonuses
  if (completionRate >= 0.8) {
    bonus += 5;
  } else if (completionRate >= 0.5) {
    bonus += 2;
  }

  return bonus;
}

/**
 * Maps a numeric score (0–100) to a SystemStatus label.
 */
export function getStatusFromScore(score: number): SystemStatus {
  if (score >= 90) return 'OPTIMAL';
  if (score >= 70) return 'NOMINAL';
  if (score >= 50) return 'DEGRADED';
  if (score >= 30) return 'AT_RISK';
  if (score >= 10) return 'CRITICAL';
  return 'SYSTEM_FAILURE';
}

// --- Internal helpers ---

function getCycleDurationForTask(task: Task): number {
  const DAILY = 24 * 60 * 60 * 1000;
  const durations: Record<string, number> = {
    DAILY: DAILY,
    WEEKLY: 7 * DAILY,
    MONTHLY: 30 * DAILY,
  };
  return durations[task.frequency ?? 'DAILY'] ?? DAILY;
}

function getImpactForTier(tier: string): number {
  const impacts: Record<string, number> = {
    NOMINAL: 0,
    WARNING: -5,
    INCIDENT: -15,
    OUTAGE: -30,
    CATASTROPHE: -50,
  };
  return impacts[tier] ?? 0;
}
