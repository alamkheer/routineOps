---
name: Workflow and State Rules
description: Rules for state architecture, task lifecycle, escalation engine, database, and error handling
---

# Routine Ops — Workflow & State Management Rules

> **Classification:** MANDATORY — All state logic MUST comply  
> **Last Revised:** 2026-04-25  
> **Enforced By:** AI Agent, type system, unit tests  

---

## 1. State Architecture Overview

Routine Ops uses a **hybrid state architecture**:

| State Type | Technology | Scope | Persistence |
|-----------|-----------|-------|-------------|
| **Persistent Data** | Dexie.js (IndexedDB) | Tasks, Logs, Health History | Survives refresh & close |
| **Reactive Queries** | `useLiveQuery` (Dexie React Hooks) | Read-only views of DB data | Auto-syncs with DB |
| **Computed / Derived** | Pure functions + `useMemo` | Escalation tiers, health score | Recomputed on dependency change |
| **Ephemeral UI** | `useState` / `useReducer` | Active screen, selections, form state | Lost on refresh |

### 1.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          IndexedDB                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌───────────┐ │
│  │  tasks   │  │   logs   │  │ healthHistory │  │   rules   │ │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  └─────┬─────┘ │
└───────┼──────────────┼───────────────┼─────────────────┼───────┘
        │              │               │                 │
        ▼              ▼               ▼                 ▼
   useLiveQuery   useLiveQuery    useLiveQuery      useLiveQuery
        │              │               │                 │
        ▼              ▼               ▼                 ▼
┌───────────────────────────────────────────────────────────────┐
│                    React Component Tree                       │
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐    │
│  │   useEscalation()    │    │    useSystemHealth()     │    │
│  │                      │    │                          │    │
│  │  • Reads tasks       │    │  • Reads escalation      │    │
│  │  • Reads rules       │    │    state                 │    │
│  │  • Computes tiers    │───▶│  • Computes score        │    │
│  │  • Writes back to DB │    │  • Writes history to DB  │    │
│  └──────────────────────┘    └──────────────────────────┘    │
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐    │
│  │   useDatabase()      │    │    useState / UI          │    │
│  │   (existing)         │    │    (ephemeral)            │    │
│  │                      │    │                          │    │
│  │  • addTask           │    │  • activeScreen          │    │
│  │  • toggleTask        │    │  • selectedTaskId        │    │
│  │  • deleteTask        │    │  • formData              │    │
│  │  • addLog            │    │  • modalState            │    │
│  └──────────────────────┘    └──────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 State Rules — STRICTLY ENFORCED

1. **No global state stores** (no Redux, Zustand, Jotai, etc.). Dexie IS the store.
2. **All persistent mutations go through `db.*` methods.** Never modify tasks in React state directly.
3. **Derived state is NEVER persisted** unless it needs to survive a page close (e.g., `escalationTier` is persisted for offline accuracy, but `SystemHealth.score` is recomputed on load).
4. **Hooks are the API boundary.** Components never import `db` directly — they use `useDatabase()`, `useEscalation()`, or `useSystemHealth()`.
5. **Mutations are async.** All DB writes return `Promise<void>`. UI must handle loading and error states.

---

## 2. Task Lifecycle State Machine

### 2.1 State Diagram

```
                                ┌───────────────┐
                                │   CREATED     │
                                │ (initialized) │
                                └───────┬───────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │       PENDING          │
                           │ (awaiting execution)   │
                           │ escalationTier: NOMINAL│
                           └────────┬───────────────┘
                                    │
                         ┌──────────┼──────────┐
                         ▼          │          ▼
                    ┌─────────┐     │    ┌───────────┐
                    │COMPLETED│     │    │ ESCALATING │
                    │         │     │    │            │
                    │ ✓ Done  │     │    │  L1 → L2   │
                    └─────────┘     │    │  L2 → L3   │
                         ▲          │    │  L3 → L4   │
                         │          │    └──────┬─────┘
                         │          │           │
                         └──────────┴───────────┘
                           (can complete at any tier)
                                    │
                                    ▼
                           ┌────────────────────┐
                           │    CYCLE_RESET     │
                           │  (routine tasks)   │
                           │  Back to PENDING   │
                           └────────────────────┘
```

### 2.2 State Transitions

| From | To | Trigger | Side Effects |
|------|----|---------|-------------|
| `CREATED` | `PENDING` | Task is saved to DB | Log: `TASK_INITIALIZED`, set `cycleStartedAt = now` |
| `PENDING` | `COMPLETED` | User marks task done | Log: `TASK_COMPLETED`, clear escalation, apply health bonus |
| `PENDING` | `L1_WARNING` | Time threshold crossed | Log: `ESCALATION_L1`, update `escalationTier`, deduct health |
| `L1_WARNING` | `L2_INCIDENT` | Deadline passed by 1 cycle | Log: `ESCALATION_L2`, update tier, increase health penalty |
| `L2_INCIDENT` | `L3_OUTAGE` | Deadline passed by 2 cycles | Log: `ESCALATION_L3`, cascade to dependents, trigger alert |
| `L3_OUTAGE` | `L4_CATASTROPHE` | Deadline passed by 3 cycles + cascading | Log: `ESCALATION_L4`, maximum penalty |
| `L*` (any) | `COMPLETED` | User marks task done | Log: `TASK_RECOVERED`, generate `POSTMORTEM` if ≥ L2, recovery penalty |
| `COMPLETED` | `PENDING` | Cycle resets (routine tasks only) | Log: `CYCLE_RESET`, clear `completedAt`, advance `cycleStartedAt` |

### 2.3 Transition Invariants (MUST hold true at all times)

```typescript
// 1. Escalation is monotonically increasing within a cycle
assert(newTier >= currentTier || transition === 'COMPLETED' || transition === 'CYCLE_RESET');

// 2. Completed tasks cannot escalate
assert(!(task.isCompleted && task.escalationTier !== 'NOMINAL'));

// 3. Non-routine tasks never cycle-reset
assert(!(task.isRoutine === false && transition === 'CYCLE_RESET'));

// 4. L4 requires cascading blockers
assert(!(task.escalationTier === 'CATASTROPHE' && task.dependents.length < 2));
// Exception: L4 is also triggered by 3 full missed cycles regardless of dependents
```

---

## 3. Escalation Engine Architecture

### 3.1 Engine Location

```
src/engine/
├── escalation.ts        # Core escalation calculation logic
├── health.ts            # System health score calculator
├── scheduler.ts         # Cycle management & reset logic
├── rules.ts             # Escalation rule definitions (data)
└── __tests__/
    ├── escalation.test.ts
    ├── health.test.ts
    └── scheduler.test.ts
```

### 3.2 Core Function: `computeEscalationTier`

This is the heart of the engine. It is a **pure function** — no side effects, no DB access.

```typescript
// src/engine/escalation.ts

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
  now: number = Date.now()
): EscalationResult {
  if (task.isCompleted) {
    return { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 };
  }

  const overdueMs = now - task.scheduledAt;
  
  if (overdueMs <= 0) {
    // Check if approaching deadline (L1 warning zone)
    const cycleDuration = getCycleDurationMs(task.frequency);
    const elapsed = now - task.cycleStartedAt;
    const percentElapsed = elapsed / cycleDuration;
    
    if (percentElapsed >= 0.75) {
      return { tier: 'WARNING', overdueMs: 0, healthImpact: -5 };
    }
    return { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 };
  }

  // Task is overdue — find the highest matching tier
  const sortedRules = rules
    .filter(r => r.taskFrequency === task.frequency)
    .sort((a, b) => b.triggerCondition.overdueByMs - a.triggerCondition.overdueByMs);

  for (const rule of sortedRules) {
    if (overdueMs >= rule.triggerCondition.overdueByMs) {
      // Check cascading requirement for L4
      if (rule.tier === 'CATASTROPHE' && rule.triggerCondition.cascadingBlockerCount) {
        if ((task.dependents?.length ?? 0) < rule.triggerCondition.cascadingBlockerCount) {
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

  return { tier: 'NOMINAL', overdueMs: 0, healthImpact: 0 };
}

interface EscalationResult {
  tier: EscalationTier;
  overdueMs: number;
  healthImpact: number;
}
```

### 3.3 Engine Rules — STRICTLY ENFORCED

1. **All engine functions are PURE.** No database access, no `Date.now()` calls (timestamp is always injected). This enables deterministic testing.
2. **The engine never mutates its inputs.** Always return new objects.
3. **Error handling is exhaustive.** Every switch on `EscalationTier` MUST have a `default` case that throws `UnreachableTierError`.
4. **Time is always in milliseconds (Unix timestamps).** No `Date` objects in the engine layer.
5. **The engine is framework-agnostic.** It imports nothing from React, Dexie, or any UI library. It is pure TypeScript business logic.

### 3.4 Cycle Duration Constants

```typescript
// src/engine/scheduler.ts

export const CYCLE_DURATION_MS = {
  DAILY:   24 * 60 * 60 * 1000,   // 86,400,000 ms
  WEEKLY:  7 * 24 * 60 * 60 * 1000, // 604,800,000 ms
  MONTHLY: 30 * 24 * 60 * 60 * 1000, // 2,592,000,000 ms
} as const;

export function getCycleDurationMs(frequency?: Task['frequency']): number {
  if (!frequency) return CYCLE_DURATION_MS.DAILY; // One-time tasks default to daily urgency
  return CYCLE_DURATION_MS[frequency];
}
```

---

## 4. Hook Architecture

### 4.1 `useEscalation` Hook

Bridges the pure engine with the reactive UI layer.

```typescript
// src/hooks/useEscalation.ts

/**
 * Hook that computes escalation tiers for all tasks and syncs
 * tier changes back to the database.
 * 
 * Runs on a 60-second interval to catch time-based transitions.
 */
export function useEscalation() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const [tick, setTick] = useState(0);

  // Re-evaluate every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Compute tiers
  const evaluatedTasks = useMemo(() => {
    const now = Date.now();
    return tasks.map(task => {
      const result = computeEscalationTier(task, DEFAULT_RULES, now);
      return { ...task, computedTier: result.tier, healthImpact: result.healthImpact };
    });
  }, [tasks, tick]);

  // Sync tier changes to DB (only when tier actually changes)
  useEffect(() => {
    for (const task of evaluatedTasks) {
      if (task.computedTier !== task.escalationTier) {
        db.tasks.update(task.id, {
          escalationTier: task.computedTier,
          escalatedAt: Date.now(),
        });
        db.logs.add({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: `ESCALATION_${task.computedTier}: ${task.id} (${task.name})`,
          type: 'ESCALATION',
          relatedTaskId: task.id,
          escalationTier: task.computedTier,
        });
      }
    }
  }, [evaluatedTasks]);

  return { tasks: evaluatedTasks };
}
```

### 4.2 `useSystemHealth` Hook

```typescript
// src/hooks/useSystemHealth.ts

export function useSystemHealth(tasks: EvaluatedTask[]): SystemHealth {
  return useMemo(() => {
    const penalties = tasks.reduce((sum, t) => sum + (t.healthImpact ?? 0), 0);
    const recoveryPenalties = calculateRecoveryPenalties(tasks);
    const bonuses = calculateCompletionBonuses(tasks);

    const score = Math.max(0, Math.min(100, 100 + penalties - recoveryPenalties + bonuses));
    
    return {
      score,
      status: getStatusFromScore(score),
      lastCalculatedAt: Date.now(),
      breakdown: {
        baseScore: 100,
        escalationPenalties: Math.abs(penalties),
        recoveryPenalties,
        completionBonus: bonuses,
      },
    };
  }, [tasks]);
}
```

### 4.3 Hook Rules

1. **Hooks never throw.** They return loading/error states instead.
2. **Hooks that write to DB must debounce** to avoid write storms during rapid re-renders.
3. **The tick interval (60s) is the escalation polling rate.** It is NOT real-time. This is intentional — sub-second escalation precision is unnecessary and wasteful.
4. **Hooks compose upward.** `useSystemHealth` takes the output of `useEscalation` as input. They do not independently query the database for the same data.

---

## 5. Database Schema Evolution

### 5.1 Current Schema (v1)

```typescript
db.version(1).stores({
  tasks: 'id, priority, severity, isCompleted, createdAt',
  logs: 'id, timestamp',
});
```

### 5.2 Target Schema (v2) — For Escalation Support

```typescript
db.version(2).stores({
  tasks: 'id, priority, severity, isCompleted, escalationTier, scheduledAt, createdAt',
  logs: 'id, timestamp, type, relatedTaskId',
  healthHistory: 'id, timestamp', // New table for health score snapshots
}).upgrade(tx => {
  // Migrate existing tasks: add new fields with defaults
  return tx.table('tasks').toCollection().modify(task => {
    task.escalationTier = task.isCompleted ? 'NOMINAL' : 'NOMINAL';
    task.scheduledAt = task.createdAt + CYCLE_DURATION_MS[task.frequency ?? 'DAILY'];
    task.cycleStartedAt = task.createdAt;
    task.escalatedAt = undefined;
    task.dependents = [];
    task.isArchived = false;
  });
});
```

### 5.3 Migration Rules

1. **Never delete or rename an existing index** without a versioned upgrade.
2. **Always provide a `.upgrade()` function** when adding required fields to existing tables.
3. **Test migrations** against a database populated with v1 seed data before shipping.
4. **Schema version numbers are monotonically increasing.** Never reuse a version number.

---

## 6. Error Handling

### 6.1 Error Hierarchy

```typescript
// src/engine/errors.ts

export class RoutineOpsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RoutineOpsError';
  }
}

export class EscalationEngineError extends RoutineOpsError {
  constructor(message: string) {
    super(message, 'ESCALATION_ENGINE_ERROR');
  }
}

export class UnreachableTierError extends EscalationEngineError {
  constructor(tier: never) {
    super(`Unreachable escalation tier encountered: ${tier}`);
  }
}

export class CircularDependencyError extends RoutineOpsError {
  constructor(public cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' → ')}`, 'CIRCULAR_DEPENDENCY');
  }
}

export class InvalidTransitionError extends RoutineOpsError {
  constructor(from: EscalationTier, to: EscalationTier) {
    super(`Invalid tier transition: ${from} → ${to}`, 'INVALID_TRANSITION');
  }
}
```

### 6.2 Error Handling Rules

1. **Engine errors are thrown, never swallowed.** The hook layer catches and logs them.
2. **DB errors are caught in hooks** and surfaced via return values (`{ error: Error | null }`).
3. **UI never shows raw error messages.** Errors are mapped to system-log-style messages.
4. **All async operations use try/catch.** No unhandled promise rejections.

---

## 7. Testing Strategy

### 7.1 Test Organization

```
src/engine/__tests__/
├── escalation.test.ts    # Unit tests for tier computation
├── health.test.ts        # Unit tests for health score
├── scheduler.test.ts     # Unit tests for cycle logic
└── integration.test.ts   # Integration tests with Dexie (fake-indexeddb)
```

### 7.2 Testing Rules

1. **Engine functions have 100% branch coverage.** Every tier transition, every edge case.
2. **Tests inject timestamps.** Never rely on `Date.now()` in tests. Use deterministic values.
3. **Test naming convention:** `describe('computeEscalationTier')` → `it('returns WARNING when 75% of cycle has elapsed')`.
4. **Snapshot tests are prohibited** for engine logic. Use explicit assertions.
5. **Integration tests** use `fake-indexeddb` to simulate the Dexie layer without a browser.

### 7.3 Critical Test Cases (must exist before shipping)

```typescript
// Escalation tier computation
- [ ] Returns NOMINAL for completed tasks regardless of overdue time
- [ ] Returns NOMINAL for tasks within schedule
- [ ] Returns WARNING at 75% elapsed time
- [ ] Returns INCIDENT at 1 cycle overdue
- [ ] Returns OUTAGE at 2 cycles overdue
- [ ] Returns CATASTROPHE at 3 cycles overdue with 2+ dependents
- [ ] Does NOT return CATASTROPHE if dependent count < 2 (falls back to OUTAGE)
- [ ] Handles missing frequency (defaults to DAILY)
- [ ] Handles future scheduledAt (always NOMINAL)

// Health score
- [ ] Returns 100 when all tasks are NOMINAL
- [ ] Correctly sums penalties across multiple escalated tasks
- [ ] Clamps score to 0–100 range
- [ ] Applies recovery penalty at 50% for recently completed tasks
- [ ] Calculates streak bonuses correctly

// Dependency cascade
- [ ] Bumps dependent severity by +20 when blocker is INCIDENT
- [ ] Auto-escalates dependent by +1 tier when blocker reaches OUTAGE
- [ ] Detects circular dependencies and throws CircularDependencyError
- [ ] Handles deep dependency chains (A → B → C → D)

// Cycle management
- [ ] Resets routine tasks to PENDING at cycle boundary
- [ ] Does NOT reset one-time tasks
- [ ] Preserves completion history across resets
```

---

## 8. Performance Constraints

| Operation | Target | Strategy |
|-----------|--------|----------|
| Full escalation recalc (100 tasks) | < 16ms | Pure function, no allocations in hot path |
| DB write (single task update) | < 50ms | Dexie's built-in transaction batching |
| Live query re-render | < 100ms | `useMemo` on derived computations |
| Tick interval | 60 seconds | Prevents excessive recalculations |
| Log trimming | < 100ms | Batched delete of oldest logs beyond cap |

---

## 9. Future Considerations

1. **Web Worker offloading**: If task count exceeds 500, move `computeEscalationTier` to a Web Worker.
2. **Service Worker sync**: Background sync for escalation checks even when app is closed (PWA).
3. **Notification API**: Browser notifications for L2+ escalations.
4. **Undo/Redo**: Use Dexie's transaction log to implement undo for task mutations.
