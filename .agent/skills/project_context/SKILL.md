---
name: Project Context
description: Core mechanics, entities, and mission statement for Routine Ops
---

# Routine Ops: The Escalation Matrix — Project Context

> **Classification:** INTERNAL — Source of Truth  
> **Last Revised:** 2026-04-25  
> **Maintainer:** Lead Architect / AI Agent  

---

## 1. Mission Statement

Routine Ops is a **daily routine management application** that treats the user's life like a production system. It does not merely list tasks — it models the *cascading impact* of neglecting them. Missed obligations don't disappear; they **escalate** through severity tiers, degrading the user's overall **System Health Score** in real time. The goal is to create visceral, visual urgency — turning procrastination into a visible incident report.

---

## 2. The Escalation Matrix — Core Mechanics

The Escalation Matrix is a **time-based degradation engine**. Every task has a deadline. When a deadline passes without completion, the task doesn't just become "overdue" — it enters an escalation pipeline modeled after real-world incident management (SRE / ITIL inspired).

### 2.1 Escalation Tiers

| Tier | Code | Label | Trigger Condition | Visual State | System Health Impact |
|------|------|-------|-------------------|--------------|----------------------|
| **L0** | `NOMINAL` | Nominal | Task is on schedule or completed | `--color-green-nominal` | +0 (baseline) |
| **L1** | `WARNING` | Warning | Task is **≤ 25%** of its time remaining OR missed by **< 1 cycle** | `--color-amber-warning` | −5 points per task |
| **L2** | `INCIDENT` | Incident | Task missed by **≥ 1 full cycle** (e.g., a daily task missed for 1 day) | `--color-orange-incident` | −15 points per task |
| **L3** | `OUTAGE` | Outage | Task missed by **≥ 2 full cycles** OR has **cascading blockers** | `--color-red-critical` | −30 points per task |
| **L4** | `CATASTROPHE` | Catastrophe | Task missed by **≥ 3 full cycles** AND blocks ≥ 2 other tasks | `--color-red-catastrophe` (pulsing) | −50 points per task |

### 2.2 Escalation Timing by Frequency

| Task Frequency | 1 Cycle Duration | L1 Trigger | L2 Trigger | L3 Trigger | L4 Trigger |
|----------------|-----------------|------------|------------|------------|------------|
| `DAILY` | 24 hours | 18h elapsed | +24h overdue | +48h overdue | +72h overdue |
| `WEEKLY` | 7 days | Day 6 | +7d overdue | +14d overdue | +21d overdue |
| `MONTHLY` | 30 days | Day 25 | +30d overdue | +60d overdue | +90d overdue |
| `ONE_TIME` | User-defined | 75% elapsed | Past deadline | +1 deadline | +2 deadlines |

### 2.3 De-escalation

- Completing a task at **any tier** immediately sets it to `NOMINAL` for the current cycle.
- The System Health impact is **removed** upon task completion, but a **recovery penalty** of 50% of the deducted points persists for 1 cycle (to model "we recovered, but there was damage").
- An `OUTAGE` or `CATASTROPHE` task that is completed generates a `POSTMORTEM` log entry.

---

## 3. Core Entities

### 3.1 Task

The fundamental unit of work. Extends the existing `Task` interface.

```typescript
interface Task {
  // Identity
  id: string;                          // Unique identifier (e.g., 'TSK_LNDRY_01')
  name: string;                        // Human-readable name
  description: string;                 // Detailed description

  // Scheduling
  isRoutine: boolean;                  // Repeating or one-time
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY'; // Repeat cadence
  scheduledAt: number;                 // Unix timestamp — when the task is due
  completedAt?: number;                // Unix timestamp — when last completed
  cycleStartedAt: number;             // Unix timestamp — start of current cycle

  // Classification (Cartesian Matrix axes)
  priority: number;                    // 0–100 (urgency axis)
  severity: number;                    // 0–100 (impact axis)

  // Escalation State (computed, but persisted for offline)
  escalationTier: EscalationTier;      // Current tier: L0 | L1 | L2 | L3 | L4
  escalatedAt?: number;                // When it entered the current tier

  // Dependencies
  dependencies: string[];              // IDs of tasks that block this one
  dependents: string[];                // IDs of tasks this one blocks (reverse map)

  // Lifecycle
  isCompleted: boolean;
  isArchived: boolean;                 // Soft-delete
  createdAt: number;
}

type EscalationTier = 'NOMINAL' | 'WARNING' | 'INCIDENT' | 'OUTAGE' | 'CATASTROPHE';
```

### 3.2 Escalation Rule

Defines the contract between a task's state and the engine's response.

```typescript
interface EscalationRule {
  id: string;                          // Rule identifier
  taskFrequency: Task['frequency'];    // Which frequency this rule applies to
  tier: EscalationTier;                // Target tier
  triggerCondition: {
    overdueByMs: number;               // Milliseconds past deadline
    cascadingBlockerCount?: number;    // Optional: tasks blocked by this one
  };
  healthImpact: number;               // Points deducted from System Health
  mitigationActions: MitigationAction[]; // What the system does at this tier
}
```

### 3.3 System Health Score

A single aggregate metric representing the user's overall operational integrity.

```typescript
interface SystemHealth {
  score: number;                       // 0–100 (100 = perfect)
  status: SystemStatus;                // Derived from score
  lastCalculatedAt: number;            // Timestamp
  breakdown: {
    baseScore: number;                 // Starts at 100
    escalationPenalties: number;       // Sum of active escalation impacts
    recoveryPenalties: number;         // Lingering penalties from recent recoveries
    completionBonus: number;           // Bonus for streaks / on-time completions
  };
}

type SystemStatus =
  | 'OPTIMAL'        // 90–100
  | 'NOMINAL'        // 70–89
  | 'DEGRADED'       // 50–69
  | 'AT_RISK'        // 30–49
  | 'CRITICAL'       // 10–29
  | 'SYSTEM_FAILURE'; // 0–9
```

### 3.4 Mitigation Action

What the system does (or recommends) when an escalation occurs.

```typescript
interface MitigationAction {
  id: string;
  type: 'NOTIFICATION' | 'UI_ALERT' | 'DEPENDENCY_HIGHLIGHT' | 'AUTO_REPRIORITIZE' | 'POSTMORTEM_PROMPT';
  description: string;                // Human-readable description
  triggerTier: EscalationTier;        // Minimum tier to activate
  payload?: Record<string, unknown>;  // Action-specific data
}
```

### 3.5 System Log (existing, extended)

```typescript
interface SystemLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'ESCALATION' | 'POSTMORTEM';
  relatedTaskId?: string;             // Optional link to the task
  escalationTier?: EscalationTier;    // If this log was generated by an escalation
}
```

---

## 4. Dependency Graph & Cascading Failures

Tasks can declare **blockers** (`dependencies: string[]`). The escalation engine must:

1. **Propagate severity**: If Task A blocks Task B and Task A escalates to `INCIDENT`, Task B's effective severity is bumped by +20 points (capped at 100).
2. **Cascade escalation**: If Task A reaches `OUTAGE`, any task it blocks automatically escalates by +1 tier (minimum `WARNING`).
3. **Detect circular dependencies**: The engine MUST reject circular dependency chains at creation time. Use a topological sort or DFS cycle-detection.

---

## 5. Scoring Algorithm — System Health

```
SystemHealth.score = clamp(0, 100,
    100
  - Σ(active_escalation_penalties)
  - Σ(recovery_penalties)
  + Σ(completion_bonuses)
)
```

**Completion Bonuses:**
| Streak Type | Bonus |
|-------------|-------|
| 3-day completion streak | +2 |
| 7-day completion streak | +5 |
| All tasks completed before L1 | +3 per cycle |

---

## 6. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 19 + TypeScript 5.8 | Strict mode, no `any` |
| **Bundler** | Vite 6 | `@tailwindcss/vite` plugin |
| **Styling** | Tailwind CSS 4 | Design tokens in `@theme` block in `index.css` |
| **Animations** | Motion (Framer Motion) | `motion/react` import path |
| **Icons** | Lucide React | Tree-shakeable |
| **Database** | Dexie.js (IndexedDB) | Persistent browser storage |
| **State** | React hooks + Dexie live queries | `useLiveQuery` for reactive DB reads |

---

## 7. File Structure (Current → Target)

```
routineOps/
├── .agent/                          # ← THIS FOLDER (AI context)
│   ├── project_context.md           # Core mechanics & entities
│   ├── design_system_rules.md       # Visual language & component rules
│   ├── workflow_and_state_rules.md  # State machine & engine architecture
│   └── system_prompt.txt            # AI agent behavioral rules
├── src/
│   ├── components/
│   │   ├── UI.tsx                   # Primitive UI components (Frame, Button, etc.)
│   │   ├── TaskCard.tsx             # [PLANNED] Extracted task card component
│   │   ├── EscalationBadge.tsx      # [PLANNED] Tier visualization
│   │   └── SystemHealthGauge.tsx    # [PLANNED] Health score display
│   ├── engine/
│   │   ├── escalation.ts            # [PLANNED] Core escalation logic
│   │   ├── health.ts                # [PLANNED] System health calculator
│   │   ├── scheduler.ts             # [PLANNED] Cycle management
│   │   └── rules.ts                 # [PLANNED] Escalation rule definitions
│   ├── hooks/
│   │   ├── useDatabase.ts           # DB access layer
│   │   ├── useEscalation.ts         # [PLANNED] Escalation state hook
│   │   └── useSystemHealth.ts       # [PLANNED] Health score hook
│   ├── types.ts                     # Type definitions
│   ├── db.ts                        # Dexie database schema
│   ├── App.tsx                      # Main application shell
│   ├── index.css                    # Design tokens + global styles
│   └── main.tsx                     # React entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 8. Non-Functional Requirements

1. **Offline-First**: All data lives in IndexedDB. The app must function without network access.
2. **Performance**: Escalation recalculation must complete in < 16ms (one frame) for up to 100 tasks.
3. **Accessibility**: All interactive elements must be keyboard-navigable. Color is never the sole indicator of state.
4. **Mobile-First**: The Cartesian Matrix must adapt to touch interaction on viewports ≥ 320px.
