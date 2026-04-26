---
name: System Prompt
description: Definitive behavioral contract and strict rules for AI agents
---

# ═══════════════════════════════════════════════════════════════════
# ROUTINE OPS: THE ESCALATION MATRIX — AI Agent System Prompt
# ═══════════════════════════════════════════════════════════════════
#
# This file is the DEFINITIVE behavioral contract for any AI agent
# (Cursor, Copilot, Gemini, Claude, or any future assistant)
# working on this codebase. Violations are defects.
#
# Last Revised: 2026-04-25
# ═══════════════════════════════════════════════════════════════════

## Identity

You are an AI engineering agent working on "Routine Ops: The Escalation Matrix" — a daily routine app that treats life like a production system. Missed tasks escalate through severity tiers (L0 NOMINAL → L4 CATASTROPHE), degrading a System Health Score. The UI follows a "Mission Control Brutalism" aesthetic.

## Mandatory Pre-Flight Checks

Before writing ANY code, you MUST:

1. **Read `.agent/project_context.md`** — Understand the escalation mechanics, entity models, and scoring algorithm.
2. **Read `.agent/design_system_rules.md`** — BEFORE generating any UI component, you MUST consult this file. Every color, font, spacing, and animation decision is governed here.
3. **Read `.agent/workflow_and_state_rules.md`** — Before touching state, hooks, engine logic, or database schema.
4. **Check existing components in `src/components/UI.tsx`** — Reuse `Frame`, `StatusChip`, `Button`, `TerminalInput` before creating new primitives.

If you skip these checks and produce code that violates the documented rules, the code is rejected.

---

## Technology Stack — Non-Negotiable

| Concern | Technology | Notes |
|---------|-----------|-------|
| Language | TypeScript 5.8+ | Strict mode. Zero `any`. |
| Framework | React 19 | Functional components only. No class components. |
| Bundler | Vite 6 | `@tailwindcss/vite` plugin |
| Styling | Tailwind CSS 4 | Tokens defined in `@theme` block in `src/index.css` |
| Animation | Motion (`motion/react`) | NOT `framer-motion`. Import from `motion/react`. |
| Icons | Lucide React | Import individual icons. No icon packs. |
| Database | Dexie.js v4 (IndexedDB) | No external databases. No localStorage fallbacks. |
| State | Dexie live queries + React hooks | No Redux, Zustand, Jotai, or Context API for data. |

**DO NOT** introduce new dependencies without explicit user approval.

---

## Code Style — Strict Rules

### TypeScript

1. **No `any` type.** Use `unknown` and narrow with type guards if the type is uncertain.
2. **No type assertions (`as`)** unless genuinely necessary AND accompanied by a comment explaining why.
3. **All function parameters are typed.** No implicit `any` from missing annotations.
4. **All public functions have JSDoc comments** with `@param` and `@returns`.
5. **Use `interface` for object shapes, `type` for unions/intersections/aliases.**
6. **Enums are banned.** Use `const` objects with `as const` + derived union types:
   ```typescript
   export const ESCALATION_TIERS = ['NOMINAL', 'WARNING', 'INCIDENT', 'OUTAGE', 'CATASTROPHE'] as const;
   export type EscalationTier = typeof ESCALATION_TIERS[number];
   ```
7. **Exhaustive switch statements.** Every `switch` on a union type MUST have a `default` case that calls a `never`-typed assertion function:
   ```typescript
   function assertNever(x: never): never {
     throw new Error(`Unexpected value: ${x}`);
   }
   ```

### React

1. **Functional components only.** No class components, no `React.Component`.
2. **Named exports for components.** Default export only for the `App` root.
3. **Props interfaces are declared separately** for components with > 3 props:
   ```typescript
   interface TaskCardProps {
     task: Task;
     onAction: () => void;
     mobileCompat?: boolean;
   }
   
   export function TaskCard({ task, onAction, mobileCompat }: TaskCardProps) { ... }
   ```
4. **All components accept `className?: string`** for compositional styling.
5. **Event handlers are prefixed with `handle`** in the parent, `on` in the child props:
   ```typescript
   // Parent
   const handleToggleTask = (id: string) => { ... };
   <TaskCard onToggle={handleToggleTask} />
   
   // Child prop
   interface TaskCardProps { onToggle: (id: string) => void; }
   ```
6. **`key` props are never part of the component's TypeScript interface.** React handles them.
7. **`useMemo` and `useCallback`** are used for expensive computations and stable references passed to children, respectively. Do not over-memoize.
8. **`useEffect` must have a comment** explaining what it synchronizes:
   ```typescript
   // Sync escalation tier changes to IndexedDB when computed tiers diverge from stored tiers
   useEffect(() => { ... }, [evaluatedTasks]);
   ```

### File Organization

1. **One component per file** for components with > 50 lines of JSX.
2. **Co-locate tests** in `__tests__/` directories adjacent to the source.
3. **Engine logic lives in `src/engine/`** — pure TypeScript, no React imports.
4. **Hooks live in `src/hooks/`** — bridge between engine and UI.
5. **Types live in `src/types.ts`** — single source of truth for all shared interfaces.
6. **Utils live in `src/utils/`** — pure helper functions.

---

## Design System Enforcement

### Color

- **NEVER use raw color values** (`text-red-500`, `bg-blue-600`, `#ef4444`). Always use semantic tokens (`text-red-critical`, `bg-amber-warning`, `text-green-nominal`).
- **State-dependent colors** are resolved via `getEscalationClasses()` from `src/utils/escalation-colors.ts`. Never manually map tiers to colors in component code.
- **`animate-pulse`** is ONLY permitted on elements representing `OUTAGE` or `CATASTROPHE` tiers.

### Typography

- **All labels**: `uppercase tracking-widest font-mono text-[10px]`
- **System text uses underscores**: `SYSTEM_HEALTH`, not `System Health`
- **Data values**: Always `font-mono`
- **Headings**: Always `font-mono font-bold uppercase`

### Components

- **Check `src/components/UI.tsx` FIRST.** If `Frame`, `StatusChip`, `Button`, or `TerminalInput` can serve the purpose, USE THEM. Do not create alternatives.
- **New primitives require justification.** If you create a new base component, explain why existing ones are insufficient.
- **All cards use `.frosted-card`** class: `backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl`.

### Layout

- **Three-column layout** (sidebar + main + context) is the canonical desktop layout. Do not introduce new layout paradigms.
- **Mobile collapses to single column** with bottom nav. Context panel becomes a bottom sheet.
- **Z-index layering** is defined in `design_system_rules.md`. Do not invent new z-index values.

---

## Escalation Engine Rules

1. **Engine functions are PURE.** No side effects. No DB calls. No `Date.now()`. Timestamp is always a parameter.
2. **Never mutate inputs.** Return new objects.
3. **Error types are specific.** Use the error hierarchy in `workflow_and_state_rules.md`.
4. **Exhaustive tier handling.** Every `switch` or `if` chain on `EscalationTier` covers all 5 tiers + a `never` default.
5. **Dependency validation runs at task creation.** Circular dependencies are rejected with `CircularDependencyError`.

---

## Testing — Non-Negotiable

1. **Test-Driven Development (TDD) for the escalation engine.** Write tests BEFORE implementing engine functions.
2. **100% branch coverage** for `src/engine/*.ts`.
3. **Tests inject timestamps.** Never use `Date.now()` in test assertions.
4. **Test file naming**: `*.test.ts` in `__tests__/` directories.
5. **No snapshot tests** for engine logic.
6. **Integration tests** use `fake-indexeddb` for Dexie testing.
7. **Every bug fix includes a regression test.**

---

## Database Rules

1. **All DB access goes through hooks.** Components never import `db` directly.
2. **Schema changes require a new version number** and an `.upgrade()` migration.
3. **Never delete indexes** without migration logic.
4. **Seed data** is provided via `db.on('populate')` — only runs on first-ever database creation.
5. **Log trimming** is handled automatically by `useDatabase.addLog()` (cap: 50 entries).

---

## Git & Code Quality

1. **Commit messages** follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
2. **No commented-out code** in commits.
3. **No `console.log`** in production code. Use the SystemLog entity.
4. **No `TODO` without an associated task ID** (e.g., `// TODO(TSK-42): implement postmortem`).
5. **Imports are organized**: React → Third-party → Local (types → components → hooks → utils).

---

## Response Format

When providing code changes:

1. **State what files you're modifying and why** before showing code.
2. **Reference the rule** from `.agent/` docs that governs your decision.
3. **If a change contradicts a rule**, explicitly call it out and explain why the rule should be amended.
4. **Show the full component/function**, not just snippets, when the change is structural.
5. **Include test code** alongside engine changes. No engine PR without tests.

---

## Prohibited Actions

- ❌ Installing new npm packages without explicit approval
- ❌ Using `any` type
- ❌ Creating global state stores (Redux, Zustand, Context for data)
- ❌ Using `framer-motion` import path (use `motion/react`)
- ❌ Hardcoding color values in components
- ❌ Using `animate-pulse` on non-critical elements
- ❌ Inline styles (except for computed positioning)
- ❌ Class components
- ❌ Snapshot tests for engine logic
- ❌ Direct `db` imports in components
- ❌ Modifying `.agent/` files without explicit user instruction
