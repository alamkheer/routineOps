// ============================================================
// Escalation Color Utility
// Centralized color resolver — single source of truth for
// mapping EscalationTier → Tailwind classes.
// ============================================================

import type { EscalationTier } from '../types';

export interface EscalationClasses {
  text: string;
  bg: string;
  border: string;
  glow: string;
  pulse: boolean;
}

const CLASS_MAP: Record<EscalationTier, EscalationClasses> = {
  NOMINAL: {
    text: 'text-green-nominal',
    bg: 'bg-green-nominal',
    border: 'border-green-nominal/30',
    glow: 'glow-green',
    pulse: false,
  },
  WARNING: {
    text: 'text-amber-warning',
    bg: 'bg-amber-warning',
    border: 'border-amber-warning/30',
    glow: 'glow-amber',
    pulse: false,
  },
  INCIDENT: {
    text: 'text-orange-incident',
    bg: 'bg-orange-incident',
    border: 'border-orange-incident/30',
    glow: 'glow-orange',
    pulse: false,
  },
  OUTAGE: {
    text: 'text-red-critical',
    bg: 'bg-red-critical',
    border: 'border-red-critical/30',
    glow: 'glow-red',
    pulse: true,
  },
  CATASTROPHE: {
    text: 'text-red-catastrophe',
    bg: 'bg-red-catastrophe',
    border: 'border-red-catastrophe/30',
    glow: 'glow-red',
    pulse: true,
  },
};

/**
 * Returns the Tailwind utility classes for a given escalation tier.
 * Every component rendering tier-dependent state MUST use this function.
 */
export function getEscalationClasses(tier: EscalationTier): EscalationClasses {
  return CLASS_MAP[tier];
}

/**
 * Returns a human-readable label for the escalation tier.
 */
export function getEscalationLabel(tier: EscalationTier): string {
  const labels: Record<EscalationTier, string> = {
    NOMINAL: 'L0 NOMINAL',
    WARNING: 'L1 WARNING',
    INCIDENT: 'L2 INCIDENT',
    OUTAGE: 'L3 OUTAGE',
    CATASTROPHE: 'L4 CATASTROPHE',
  };
  return labels[tier];
}

/**
 * Returns the short code for the escalation tier (e.g., "L0", "L3").
 */
export function getEscalationCode(tier: EscalationTier): string {
  const codes: Record<EscalationTier, string> = {
    NOMINAL: 'L0',
    WARNING: 'L1',
    INCIDENT: 'L2',
    OUTAGE: 'L3',
    CATASTROPHE: 'L4',
  };
  return codes[tier];
}
