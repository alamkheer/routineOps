---
name: Design System Rules
description: UI/UX guidelines, styling rules, typography, and component architecture
---

# Routine Ops — Design System Rules

> **Classification:** MANDATORY — All UI code MUST comply  
> **Last Revised:** 2026-04-25  
> **Enforced By:** AI Agent pre-generation checks, code review  

---

## 1. Design Philosophy

### 1.1 Visual Identity

Routine Ops uses a **"Mission Control Brutalism"** aesthetic — a hybrid of:

- **NOC Dashboard**: Dense information displays, system health gauges, real-time feeds
- **Brutalist Typography**: Oversized monospace labels, uppercase identifiers, aggressive tracking
- **Glassmorphism Panels**: Frosted glass cards over a dark void background with ambient mesh gradients

The interface must feel like you are operating a **critical infrastructure monitoring system**, not a to-do app. Every pixel should communicate urgency, status, and consequence.

### 1.2 Design Tenets (in priority order)

1. **Status is king**: Every element's visual state MUST reflect its escalation tier at all times.
2. **Information density over whitespace**: Maximize data per viewport. No decorative emptiness.
3. **Motion = meaning**: Animations indicate state changes, not decoration. Idle elements are static.
4. **Dark-first**: The UI is designed for dark environments. Light mode is NOT planned.

---

## 2. Color System

### 2.1 Semantic Color Tokens

All colors are defined as CSS custom properties inside the `@theme` block in `src/index.css`. **Never use raw hex/rgb values in component code.** Always reference the token.

#### Background & Surface

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background-void` | `#020617` (slate-950) | App root background |
| `--color-surface-lvl1` | `rgba(255,255,255,0.05)` | Primary card surfaces |
| `--color-surface-lvl2` | `rgba(255,255,255,0.08)` | Hover / elevated surfaces |
| `--color-surface-lvl3` | `rgba(255,255,255,0.12)` | Active / pressed surfaces |
| `--color-border-subtle` | `rgba(255,255,255,0.10)` | Default borders |
| `--color-border-strong` | `rgba(255,255,255,0.20)` | Emphasized borders |

#### Escalation State Colors (CRITICAL — must be used for all state-dependent rendering)

| Token | Tailwind Class | Hex | Escalation Tier | Usage |
|-------|---------------|-----|-----------------|-------|
| `--color-green-nominal` | `text-green-nominal` / `bg-green-nominal` | `#22c55e` (green-500) | L0 — NOMINAL | Completed, on-schedule, healthy |
| `--color-amber-warning` | `text-amber-warning` / `bg-amber-warning` | `#f97316` (orange-500) | L1 — WARNING | Time running out, approaching deadline |
| `--color-orange-incident` | `text-orange-incident` / `bg-orange-incident` | `#ea580c` (orange-600) | L2 — INCIDENT | Missed by 1 cycle, active incident |
| `--color-red-critical` | `text-red-critical` / `bg-red-critical` | `#ef4444` (red-500) | L3 — OUTAGE | Missed by 2+ cycles, system risk |
| `--color-red-catastrophe` | `text-red-catastrophe` / `bg-red-catastrophe` | `#dc2626` (red-600) | L4 — CATASTROPHE | Cascading failure, system collapse |

#### System / Accent Colors

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `--color-cyan-system` | `text-cyan-system` / `bg-cyan-system` | `#3b82f6` (blue-500) | System UI, active navigation, info states |
| `--color-on-surface` | `text-on-surface` | `#e2e8f0` (slate-200) | Primary text on dark surfaces |
| `--color-on-surface-muted` | `text-on-surface-muted` | `#64748b` (slate-500) | Secondary / label text |

### 2.2 Color Rules — STRICTLY ENFORCED

1. **NEVER hardcode colors.** Use Tailwind classes that reference `@theme` tokens (e.g., `text-red-critical`, not `text-red-500`).
2. **State colors are semantic.** The color of a task element is determined SOLELY by its `escalationTier`. No exceptions.
3. **Glow effects follow color.** Each state color has a corresponding glow class:
   - `.glow-green` → `box-shadow: 0 0 20px rgba(34, 197, 94, 0.5)`
   - `.glow-amber` → `box-shadow: 0 0 20px rgba(249, 115, 22, 0.5)`
   - `.glow-orange` → `box-shadow: 0 0 20px rgba(234, 88, 12, 0.5)`
   - `.glow-red` → `box-shadow: 0 0 20px rgba(239, 68, 68, 0.5)`
   - `.glow-blue` → `box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)`
4. **Pulsing animation** is reserved for `OUTAGE` and `CATASTROPHE` tiers ONLY. Using `animate-pulse` on nominal elements is a violation.

### 2.3 Color Mapping Helper

Every component that renders task state MUST use a centralized color resolver. This function is the single source of truth:

```typescript
// src/utils/escalation-colors.ts
export function getEscalationClasses(tier: EscalationTier): {
  text: string;
  bg: string;
  border: string;
  glow: string;
  pulse: boolean;
} {
  const map: Record<EscalationTier, ReturnType<typeof getEscalationClasses>> = {
    NOMINAL:     { text: 'text-green-nominal',     bg: 'bg-green-nominal',     border: 'border-green-nominal/30',     glow: 'glow-green', pulse: false },
    WARNING:     { text: 'text-amber-warning',     bg: 'bg-amber-warning',     border: 'border-amber-warning/30',     glow: 'glow-amber', pulse: false },
    INCIDENT:    { text: 'text-orange-incident',   bg: 'bg-orange-incident',   border: 'border-orange-incident/30',   glow: 'glow-orange', pulse: false },
    OUTAGE:      { text: 'text-red-critical',      bg: 'bg-red-critical',      border: 'border-red-critical/30',      glow: 'glow-red',   pulse: true },
    CATASTROPHE: { text: 'text-red-catastrophe',   bg: 'bg-red-catastrophe',   border: 'border-red-catastrophe/30',   glow: 'glow-red',   pulse: true },
  };
  return map[tier];
}
```

---

## 3. Typography

### 3.1 Font Stack

| Role | Font Family | Tailwind Class | Weight Range |
|------|------------|---------------|-------------|
| **System / Data / Labels** | Space Grotesk | `font-mono` | 400–900 |
| **Body / UI Text** | Inter | `font-sans` | 400–700 |

Both fonts are loaded via Google Fonts in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
```

### 3.2 Type Scale

| Token | Size | Usage | Class Pattern |
|-------|------|-------|--------------|
| `headline-xl` | 48px | System Health score, hero numbers | `text-5xl font-mono font-black` |
| `headline-md` | 24px | Section headers | `text-2xl font-mono font-bold` |
| `body-lg` | 16px | Task names, descriptions | `text-base font-sans` |
| `body-sm` | 14px | Secondary content | `text-sm font-sans` |
| `data-mono` | 14px | Data values, IDs | `text-sm font-mono` |
| `label-caps` | 10–12px | Metadata labels, status indicators | `text-[10px] font-mono uppercase tracking-widest` |
| `micro` | 9px | Tertiary metadata, chip text | `text-[9px] font-mono uppercase` |

### 3.3 Typography Rules

1. **All labels are uppercase.** Any text that acts as a label, heading, or status indicator MUST use `uppercase tracking-widest` (or `tracking-tight` for dense headings).
2. **Data values use monospace.** Numbers, IDs, timestamps, percentages — always `font-mono`.
3. **Underscores replace spaces in system text.** Labels read like code: `SYSTEM_HEALTH`, `TASK_INITIALIZED`, `PRIORITY_LEVEL`.
4. **No default browser fonts.** Every text element must explicitly declare `font-sans` or `font-mono`.

---

## 4. Component Architecture

### 4.1 Component Library — Existing Primitives

These components exist in `src/components/UI.tsx` and MUST be used instead of creating ad-hoc alternatives:

| Component | Purpose | Props |
|-----------|---------|-------|
| `<Frame>` | Frosted glass container with title tab | `title: string`, `children`, `className?` |
| `<StatusChip>` | Colored status indicator pill | `status: string`, `type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'` |
| `<Button>` | Action button with variants | `variant: 'primary' | 'secondary' | 'critical' | 'ghost'`, `onClick`, `className?` |
| `<TerminalInput>` | Styled text input with label | `label: string`, `placeholder?`, `value`, `onChange` |

### 4.2 Component Rules — STRICTLY ENFORCED

1. **No inline styles.** All styling is via Tailwind classes. The only exception is computed `style` props for dynamic positioning (e.g., matrix node coordinates).
2. **One component per concern.** If a component exceeds ~100 JSX lines, extract sub-components.
3. **Props over internal state.** Components should be controlled whenever possible. Lift state up.
4. **Every new component MUST**:
   - Accept a `className?: string` prop for composition
   - Use semantic HTML elements (`<button>`, `<nav>`, `<article>`, etc.)
   - Have a TypeScript interface for its props (no inline object types for complex components)
   - Use `motion.*` wrappers for any enter/exit animations
5. **Frosted Card Pattern**: All card-like containers use the `.frosted-card` class:
   ```
   backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
   ```
6. **StatusChip must be extended** to support escalation tiers. Add a new `type` value: `'ESCALATION'` that accepts the tier as input and resolves its own colors.

### 4.3 Planned Components (must follow these specs when built)

#### `<EscalationBadge tier={EscalationTier} />`
- Compact inline badge showing the escalation tier code (e.g., "L2 INCIDENT")
- Color and glow determined by `getEscalationClasses(tier)`
- `OUTAGE` and `CATASTROPHE` badges pulse

#### `<SystemHealthGauge score={number} status={SystemStatus} />`
- Circular or arc gauge displaying 0–100
- Color transitions through the `SystemStatus` spectrum
- Smooth `motion.animate` transitions on score changes
- Displays numeric score in `headline-xl` monospace

#### `<TaskCard task={Task} />`
- Must render: task name, ID chip, priority/severity, escalation badge, dependency warnings
- Action buttons adapt to escalation tier (e.g., `OVERRIDE` at `OUTAGE`, `ACKNOWLEDGE` at `WARNING`)
- Border color reflects escalation state

#### `<EscalationTimeline task={Task} />`
- Vertical timeline showing the task's escalation history
- Each node shows tier, timestamp, and health impact
- Connected by a vertical line with color gradient

### 4.4 Layout Patterns

- **Sidebar + Main + Context**: The existing 3-column layout is canonical. Do not change the layout paradigm.
- **Mobile**: Collapses to single column + bottom nav. Context sidebar becomes a bottom sheet or modal.
- **Z-index layers**:
  | Layer | Z-Index | Content |
  |-------|---------|---------|
  | Background mesh | 0 | Gradient blobs |
  | Main content | 10 | Cards, lists, matrix |
  | Terminal overlay | 40 | Command log |
  | Header / Nav | 50 | Top bar, bottom nav |
  | Modals / Sheets | 60 | Overlays |
  | Scanning line | 50 | Decorative scan effect |

---

## 5. Animation Rules

### 5.1 Motion Library

All animations use the `motion` library (imported from `motion/react`). Do NOT use raw CSS animations except for:
- `@keyframes scan` (scanning line — existing)
- `@keyframes blink` (terminal cursor — existing)
- Glow effects (CSS `box-shadow` only)

### 5.2 Animation Tokens

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Page transitions | 200ms | `ease-out` | `AnimatePresence mode="wait"` screen swaps |
| Card enter | 300ms | `spring(1, 80, 10)` | New task cards appearing |
| Value change | 500ms | `ease-in-out` | Score updates, progress bars |
| Pulse (critical) | 1000ms | `linear` | `OUTAGE`/`CATASTROPHE` elements |
| Micro-interaction | 150ms | `ease-out` | Button press (`active:scale-95`), hover |

### 5.3 Animation Rules

1. **No animation on idle elements** unless they represent an active escalation (`OUTAGE`+).
2. **Enter animations only** for elements entering the viewport. No looping animations except for critical state indicators.
3. **`AnimatePresence`** is required for any conditionally rendered content block.
4. **Reduced motion**: Respect `prefers-reduced-motion`. Wrap pulse/glow in a media query.

---

## 6. Iconography

### 6.1 Icon Library

Lucide React is the sole icon library. Import individual icons:
```typescript
import { AlertTriangle, ShieldAlert, Radio } from 'lucide-react';
```

### 6.2 Icon Sizing

| Context | Size | Class |
|---------|------|-------|
| Navigation | 16–20px | `w-4 h-4` or `w-5 h-5` |
| Inline with text | 12–14px | `w-3 h-3` or `w-3.5 h-3.5` |
| Hero / Feature | 24px | `w-6 h-6` |
| Button icon | 14–16px | `w-3.5 h-3.5` or `w-4 h-4` |

### 6.3 Icon Rules

1. **Icons always accompany labels** in navigation. Never icon-only on desktop.
2. **Icon color inherits from parent** text color via `currentColor`. Do not set explicit color on icons unless overriding for emphasis.
3. **Escalation tier icons**:
   - `NOMINAL`: `CheckCircle` (green)
   - `WARNING`: `AlertTriangle` (amber)
   - `INCIDENT`: `AlertOctagon` (orange)
   - `OUTAGE`: `ShieldAlert` (red)
   - `CATASTROPHE`: `Skull` or `RadioTower` (red, pulsing)

---

## 7. Responsive Design

### 7.1 Breakpoints (Tailwind defaults)

| Prefix | Min Width | Layout |
|--------|-----------|--------|
| (none) | 0px | Single column, bottom nav |
| `sm` | 640px | Minor adjustments |
| `md` | 768px | Sidebar nav appears, terminal overlay |
| `lg` | 1024px | Full 2-column layout |
| `xl` | 1280px | Context sidebar (right) appears |

### 7.2 Mobile Rules

1. **Bottom navigation** replaces sidebar on `< md`.
2. **Context sidebar** becomes a slide-up sheet on `< xl`.
3. **Matrix nodes** increase tap target size to 44×44px on touch.
4. **Font sizes** never go below `9px` (`text-[9px]`).
5. **Scrolling**: Only main content area scrolls. Header and nav are fixed.

---

## 8. Accessibility Requirements

1. **Focus indicators**: All interactive elements MUST have a visible focus ring (`:focus-visible`).
2. **ARIA labels**: Buttons with icon-only content require `aria-label`.
3. **Color + icon/text**: Never use color as the sole differentiator. Always pair with text labels or icons.
4. **Contrast ratios**: All text must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large).
5. **Screen reader**: Escalation tier changes should announce via `aria-live="polite"` regions.
