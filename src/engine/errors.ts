// ============================================================
// Routine Ops — Custom Error Hierarchy
// ============================================================

import type { EscalationTier } from '../types';

export class RoutineOpsError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'RoutineOpsError';
    this.code = code;
  }
}

export class EscalationEngineError extends RoutineOpsError {
  constructor(message: string) {
    super(message, 'ESCALATION_ENGINE_ERROR');
    this.name = 'EscalationEngineError';
  }
}

export class UnreachableTierError extends EscalationEngineError {
  constructor(tier: never) {
    super(`Unreachable escalation tier encountered: ${String(tier)}`);
    this.name = 'UnreachableTierError';
  }
}

export class CircularDependencyError extends RoutineOpsError {
  public readonly cycle: string[];

  constructor(cycle: string[]) {
    super(
      `Circular dependency detected: ${cycle.join(' → ')}`,
      'CIRCULAR_DEPENDENCY',
    );
    this.name = 'CircularDependencyError';
    this.cycle = cycle;
  }
}

export class InvalidTransitionError extends RoutineOpsError {
  constructor(from: EscalationTier, to: EscalationTier) {
    super(
      `Invalid tier transition: ${from} → ${to}`,
      'INVALID_TRANSITION',
    );
    this.name = 'InvalidTransitionError';
  }
}
