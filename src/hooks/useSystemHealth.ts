// ============================================================
// useSystemHealth — Derives the aggregate System Health Score
// from evaluated task data. Composes with useEscalation output.
// ============================================================

import { useMemo } from 'react';
import { calculateSystemHealth } from '../engine/health';
import type { EvaluatedTask, SystemHealth } from '../types';

/**
 * Hook that computes the System Health Score from evaluated tasks.
 * Designed to consume the output of `useEscalation().tasks`.
 */
export function useSystemHealth(tasks: EvaluatedTask[]): SystemHealth {
  return useMemo(() => {
    return calculateSystemHealth(tasks);
  }, [tasks]);
}
