// ============================================================
// Routine Ops — Core Type Definitions
// ============================================================

// --- Escalation Tiers ---

export type EscalationTier =
  | 'NOMINAL'       // L0 — On schedule or completed
  | 'WARNING'       // L1 — ≤ 25% time remaining
  | 'INCIDENT'      // L2 — Missed by ≥ 1 cycle
  | 'OUTAGE'        // L3 — Missed by ≥ 2 cycles or cascading blockers
  | 'CATASTROPHE';  // L4 — Missed by ≥ 3 cycles AND blocks ≥ 2 tasks

export const ESCALATION_ORDER: readonly EscalationTier[] = [
  'NOMINAL', 'WARNING', 'INCIDENT', 'OUTAGE', 'CATASTROPHE',
] as const;

// --- System Status (derived from health score) ---

export type SystemStatus =
  | 'OPTIMAL'         // 90–100
  | 'NOMINAL'         // 70–89
  | 'DEGRADED'        // 50–69
  | 'AT_RISK'         // 30–49
  | 'CRITICAL'        // 10–29
  | 'SYSTEM_FAILURE'; // 0–9

// --- Task ---

export interface Task {
  // Identity
  id: string;
  name: string;
  description: string;

  // Scheduling
  isRoutine: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  scheduledAt: number;       // Unix ms — when the task is due
  completedAt?: number;      // Unix ms — when last completed
  cycleStartedAt: number;    // Unix ms — start of current cycle

  // Classification (Cartesian Matrix axes)
  priority: number;   // 0–100 (urgency axis)
  severity: number;   // 0–100 (impact axis)

  // Escalation State
  escalationTier: EscalationTier;
  escalatedAt?: number;      // When it entered the current tier

  // Dependencies
  dependencies: string[];    // IDs of tasks that block this one
  dependents: string[];      // IDs of tasks this one blocks (reverse map)

  // Lifecycle
  isCompleted: boolean;
  isArchived: boolean;
  createdAt: number;
}

// --- System Log ---

export type LogType = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'ESCALATION' | 'POSTMORTEM';

export interface SystemLog {
  id: string;
  timestamp: number;
  message: string;
  type: LogType;
  relatedTaskId?: string;
  escalationTier?: EscalationTier;
}

// --- System Health ---

export interface SystemHealth {
  score: number;             // 0–100
  status: SystemStatus;
  lastCalculatedAt: number;
  breakdown: {
    baseScore: number;
    escalationPenalties: number;
    recoveryPenalties: number;
    completionBonus: number;
  };
}

// --- Health History (for persistence) ---

export interface HealthSnapshot {
  id: string;
  timestamp: number;
  score: number;
  status: SystemStatus;
}

// --- Escalation Rule ---

export interface EscalationRule {
  id: string;
  taskFrequency: Task['frequency'];
  tier: EscalationTier;
  triggerCondition: {
    overdueByMs: number;
    cascadingBlockerCount?: number;
  };
  healthImpact: number;
}

// --- Escalation Result (return from engine) ---

export interface EscalationResult {
  tier: EscalationTier;
  overdueMs: number;
  healthImpact: number;
}

// --- Evaluated Task (task + computed escalation data) ---

export interface EvaluatedTask extends Task {
  computedTier: EscalationTier;
  healthImpact: number;
}

// --- Screen Navigation ---

export type Screen = 'MATRIX' | 'LISTS' | 'ANALYTICS' | 'NEW_TASK' | 'WEEK_VIEW' | 'MONTH_VIEW';
