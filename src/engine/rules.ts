// ============================================================
// Routine Ops — Escalation Rule Definitions (Data)
// ============================================================

import type { EscalationRule } from '../types';
import { CYCLE_DURATION_MS } from './scheduler';

/**
 * Default escalation rules for each task frequency.
 * Ordered highest-tier-first within each frequency so the engine
 * can short-circuit on the first matching rule.
 *
 * Health impact values are NEGATIVE (penalties).
 */
export const DEFAULT_RULES: EscalationRule[] = [
  // ─── DAILY ────────────────────────────────────────────────
  {
    id: 'DAILY_L4',
    taskFrequency: 'DAILY',
    tier: 'CATASTROPHE',
    triggerCondition: {
      overdueByMs: 3 * CYCLE_DURATION_MS.DAILY,   // +72h overdue
      cascadingBlockerCount: 2,
    },
    healthImpact: -50,
  },
  {
    id: 'DAILY_L3',
    taskFrequency: 'DAILY',
    tier: 'OUTAGE',
    triggerCondition: {
      overdueByMs: 2 * CYCLE_DURATION_MS.DAILY,   // +48h overdue
    },
    healthImpact: -30,
  },
  {
    id: 'DAILY_L2',
    taskFrequency: 'DAILY',
    tier: 'INCIDENT',
    triggerCondition: {
      overdueByMs: 1 * CYCLE_DURATION_MS.DAILY,   // +24h overdue
    },
    healthImpact: -15,
  },

  // ─── WEEKLY ───────────────────────────────────────────────
  {
    id: 'WEEKLY_L4',
    taskFrequency: 'WEEKLY',
    tier: 'CATASTROPHE',
    triggerCondition: {
      overdueByMs: 3 * CYCLE_DURATION_MS.WEEKLY,   // +21d overdue
      cascadingBlockerCount: 2,
    },
    healthImpact: -50,
  },
  {
    id: 'WEEKLY_L3',
    taskFrequency: 'WEEKLY',
    tier: 'OUTAGE',
    triggerCondition: {
      overdueByMs: 2 * CYCLE_DURATION_MS.WEEKLY,   // +14d overdue
    },
    healthImpact: -30,
  },
  {
    id: 'WEEKLY_L2',
    taskFrequency: 'WEEKLY',
    tier: 'INCIDENT',
    triggerCondition: {
      overdueByMs: 1 * CYCLE_DURATION_MS.WEEKLY,   // +7d overdue
    },
    healthImpact: -15,
  },

  // ─── MONTHLY ──────────────────────────────────────────────
  {
    id: 'MONTHLY_L4',
    taskFrequency: 'MONTHLY',
    tier: 'CATASTROPHE',
    triggerCondition: {
      overdueByMs: 3 * CYCLE_DURATION_MS.MONTHLY,  // +90d overdue
      cascadingBlockerCount: 2,
    },
    healthImpact: -50,
  },
  {
    id: 'MONTHLY_L3',
    taskFrequency: 'MONTHLY',
    tier: 'OUTAGE',
    triggerCondition: {
      overdueByMs: 2 * CYCLE_DURATION_MS.MONTHLY,  // +60d overdue
    },
    healthImpact: -30,
  },
  {
    id: 'MONTHLY_L2',
    taskFrequency: 'MONTHLY',
    tier: 'INCIDENT',
    triggerCondition: {
      overdueByMs: 1 * CYCLE_DURATION_MS.MONTHLY,  // +30d overdue
    },
    healthImpact: -15,
  },
];
