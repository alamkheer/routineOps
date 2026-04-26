// ============================================================
// useEscalation — Bridges the pure escalation engine with the
// reactive UI layer. Runs on a 60-second tick to catch
// time-based tier transitions.
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { computeEscalationTier, computeCascadingEffects } from '../engine/escalation';
import { shouldResetCycle, getNextCycleStart, getNextScheduledAt } from '../engine/scheduler';
import { DEFAULT_RULES } from '../engine/rules';
import type { EvaluatedTask, EscalationResult } from '../types';

const TICK_INTERVAL_MS = 60_000; // Re-evaluate every 60 seconds

/**
 * Hook that computes escalation tiers for all tasks and syncs
 * tier changes back to the database.
 */
export function useEscalation() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const [tick, setTick] = useState(0);

  // Re-evaluate every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Compute tiers for all tasks
  const evaluatedTasks: EvaluatedTask[] = useMemo(() => {
    const now = Date.now();

    // Step 1: Compute individual tiers
    const baseResults = new Map<string, EscalationResult>();
    for (const task of tasks) {
      baseResults.set(task.id, computeEscalationTier(task, DEFAULT_RULES, now));
    }

    // Step 2: Apply cascading effects
    const cascaded = computeCascadingEffects(tasks, baseResults);

    // Step 3: Merge results into evaluated tasks
    return tasks.map(task => {
      const result = cascaded.get(task.id) ?? {
        tier: 'NOMINAL' as const,
        overdueMs: 0,
        healthImpact: 0,
      };
      return {
        ...task,
        computedTier: result.tier,
        healthImpact: result.healthImpact,
      };
    });
  }, [tasks, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tier changes back to DB + generate log entries
  useEffect(() => {
    const syncTierChanges = async () => {
      for (const task of evaluatedTasks) {
        // Check for cycle resets first
        if (shouldResetCycle(task)) {
          const newCycleStart = getNextCycleStart(
            task.cycleStartedAt,
            task.frequency,
          );
          await db.tasks.update(task.id, {
            isCompleted: false,
            completedAt: undefined,
            cycleStartedAt: newCycleStart,
            scheduledAt: getNextScheduledAt(newCycleStart, task.frequency),
            escalationTier: 'NOMINAL',
            escalatedAt: undefined,
          });
          await db.logs.add({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            message: `CYCLE_RESET: ${task.id} (${task.name})`,
            type: 'INFO',
            relatedTaskId: task.id,
          });
          continue;
        }

        // Sync escalation tier changes
        if (task.computedTier !== task.escalationTier && !task.isCompleted) {
          await db.tasks.update(task.id, {
            escalationTier: task.computedTier,
            escalatedAt: Date.now(),
          });

          // Only log upward escalations (not de-escalations from completion)
          const tierIndex = (tier: string) =>
            ['NOMINAL', 'WARNING', 'INCIDENT', 'OUTAGE', 'CATASTROPHE'].indexOf(tier);
          if (tierIndex(task.computedTier) > tierIndex(task.escalationTier)) {
            await db.logs.add({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              message: `ESCALATION_${task.computedTier}: ${task.id} (${task.name})`,
              type: 'ESCALATION',
              relatedTaskId: task.id,
              escalationTier: task.computedTier,
            });
          }
        }
      }
    };

    if (evaluatedTasks.length > 0) {
      syncTierChanges().catch(console.error);
    }
  }, [evaluatedTasks]);

  return { tasks: evaluatedTasks };
}
