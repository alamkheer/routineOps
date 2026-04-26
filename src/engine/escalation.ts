// ============================================================
// Routine Ops — Core Escalation Engine
// PURE FUNCTIONS — no side effects, no DB access, no framework deps.
// All timestamps are injectable for deterministic testing.
// ============================================================

import type { Task, EscalationRule, EscalationResult, EscalationTier } from '../types';
import { ESCALATION_ORDER } from '../types';
import { getCycleDurationMs } from './scheduler';
import { CircularDependencyError } from './errors';

/**
 * Computes the escalation tier for a single task based on the current time.
 *
 * PURE FUNCTION — no side effects.
 *
 * @param task - The task to evaluate
 * @param rules - The escalation rules for this task's frequency
 * @param now - Current timestamp (injectable for testing)
 * @returns The computed escalation tier and metadata
 */
export function computeEscalationTier(
  task: Task,
  rules: EscalationRule[],
  now: number = Date.now(),
): EscalationResult {
  // Completed tasks are always NOMINAL
  if (task.isCompleted) {
    return { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 };
  }

  const overdueMs = now - task.scheduledAt;

  if (overdueMs <= 0) {
    // Not overdue yet — check if approaching deadline (L1 warning zone)
    const cycleDuration = getCycleDurationMs(task.frequency);
    const elapsed = now - task.cycleStartedAt;
    const percentElapsed = elapsed / cycleDuration;

    if (percentElapsed >= 0.75) {
      return { tier: 'WARNING', overdueMs: 0, healthImpact: -5 };
    }
    return { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 };
  }

  // Task is overdue — find the highest matching tier from rules
  const frequencyRules = rules
    .filter(r => r.taskFrequency === (task.frequency ?? 'DAILY'))
    .sort((a, b) => b.triggerCondition.overdueByMs - a.triggerCondition.overdueByMs);

  for (const rule of frequencyRules) {
    if (overdueMs >= rule.triggerCondition.overdueByMs) {
      // Check cascading blocker requirement for CATASTROPHE
      if (
        rule.tier === 'CATASTROPHE' &&
        rule.triggerCondition.cascadingBlockerCount != null
      ) {
        const dependentCount = task.dependents?.length ?? 0;
        if (dependentCount < rule.triggerCondition.cascadingBlockerCount) {
          continue; // Skip L4 if cascading requirement not met
        }
      }
      return {
        tier: rule.tier,
        overdueMs,
        healthImpact: rule.healthImpact,
      };
    }
  }

  // Overdue but below L2 threshold — WARNING
  return { tier: 'WARNING', overdueMs, healthImpact: -5 };
}

/**
 * Computes cascading effects from blocker tasks to their dependents.
 *
 * Rules:
 * 1. If a blocker is INCIDENT, dependent's effective severity bumps +20 (cap 100)
 * 2. If a blocker reaches OUTAGE+, dependent auto-escalates by +1 tier (min WARNING)
 *
 * @param tasks - All tasks
 * @param results - Map of taskId → computed EscalationResult
 * @returns Updated results map with cascaded effects applied
 */
export function computeCascadingEffects(
  tasks: Task[],
  results: Map<string, EscalationResult>,
): Map<string, EscalationResult> {
  const updated = new Map(results);
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  for (const task of tasks) {
    if (task.isCompleted) continue;

    // Check each dependency (blocker)
    for (const blockerId of task.dependencies) {
      const blockerResult = updated.get(blockerId);
      if (!blockerResult) continue;

      const currentResult = updated.get(task.id);
      if (!currentResult) continue;

      // Rule 1: Blocker at INCIDENT → bump dependent severity (metadata only, doesn't change result)
      // Rule 2: Blocker at OUTAGE+ → auto-escalate dependent by +1 tier
      const blockerTierIndex = ESCALATION_ORDER.indexOf(blockerResult.tier);

      if (blockerTierIndex >= ESCALATION_ORDER.indexOf('OUTAGE')) {
        const currentTierIndex = ESCALATION_ORDER.indexOf(currentResult.tier);
        const newTierIndex = Math.min(
          currentTierIndex + 1,
          ESCALATION_ORDER.length - 1,
        );
        const newTier = ESCALATION_ORDER[newTierIndex];

        if (newTier && newTierIndex > currentTierIndex) {
          // Get the health impact for the escalated tier
          const healthImpacts: Record<EscalationTier, number> = {
            NOMINAL: 0,
            WARNING: -5,
            INCIDENT: -15,
            OUTAGE: -30,
            CATASTROPHE: -50,
          };

          updated.set(task.id, {
            tier: newTier,
            overdueMs: currentResult.overdueMs,
            healthImpact: healthImpacts[newTier],
          });
        }
      }
    }
  }

  return updated;
}

/**
 * Detects circular dependencies in the task graph using DFS.
 *
 * @param tasks - All tasks
 * @throws CircularDependencyError if a cycle is found
 */
export function detectCircularDependencies(tasks: Task[]): void {
  const adjacency = new Map<string, string[]>();
  for (const task of tasks) {
    adjacency.set(task.id, task.dependencies);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): void {
    if (inStack.has(nodeId)) {
      // Found a cycle — extract it
      const cycleStart = path.indexOf(nodeId);
      const cycle = [...path.slice(cycleStart), nodeId];
      throw new CircularDependencyError(cycle);
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    path.pop();
    inStack.delete(nodeId);
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  }
}
