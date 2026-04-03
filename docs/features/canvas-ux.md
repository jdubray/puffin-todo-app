# Feature: Canvas UX & Delight Mechanics

The canvas is the heart of Pulse. This document covers the spatial interface design, interaction model, visual language, and the moments of delight that make Pulse feel unlike any other productivity app.

---

## The Canvas vs. The List

Every existing to-do app is a list. Lists have a fundamental problem: they imply that the task at the top is most important, the one at the bottom is least. They collapse context into a single dimension. They make all tasks look alike.

The Pulse canvas is two-dimensional, infinite, and spatial. Tasks have position. Proximity implies relationship. Visual weight implies importance. The canvas lets you feel the shape of your work.

---

## Task Card Anatomy

```
┌──────────────────────────────────────┐
│ ○  •••                         [📎2] │  ← status ring, menu, resource badge
│                                      │
│  Review Q2 proposal                  │  ← title
│                                      │
│  ████████████░░░░░  4/7 steps        │  ← subtask progress bar (if any)
│                                      │
│  #board-prep   @high   Apr 7         │  ← project tag, energy, deadline
└──────────────────────────────────────┘
  ↑ urgency glow (warm amber if due soon)
```

### Card sizes
Cards have three visual sizes based on content density:
- **Compact:** title only, no body/subtasks — smaller card
- **Standard:** title + one or two metadata chips
- **Rich:** title + body excerpt + subtasks + resource badge — larger card

Size is determined automatically; users can pin a preferred size per card.

### Status ring
A circular indicator in the top-left of each card:
- Empty circle (`○`) → seed or active
- Filled quarter → snoozed
- Filled half → blocked (shows chain icon inside)
- Animated fill → click to complete
- Checkmark → briefly visible during completion animation before card fades

### Urgency glow
A CSS box-shadow + background haze on the card, color and intensity based on urgency score:
- 0–30: No glow
- 31–60: Subtle warm amber glow
- 61–80: Stronger amber/orange
- 81–100: Intense red-orange pulsing glow

The glow pulses slowly (2s cycle) at urgency > 60 to draw attention without being alarming.

---

## Canvas Interactions

### Navigation
| Gesture / Key | Action |
|---|---|
| Click + drag (empty canvas) | Pan |
| Scroll wheel | Zoom in/out centered on cursor |
| `Ctrl+0` | Reset zoom to 100% |
| `Ctrl+Shift+F` | Fit all tasks in viewport |
| Double-click empty canvas | Create new task at cursor position |

### Task manipulation
| Gesture / Key | Action |
|---|---|
| Click card | Select card |
| Double-click card | Open task editor |
| Click + drag card | Reposition on canvas |
| `Shift` + click | Multi-select |
| `Shift` + drag | Rubber-band multi-select |
| `Space` on selected | Toggle completion |
| `Enter` on selected | Open editor |
| `F` on selected | Enter Focus Mode |
| `Delete` on selected | Archive (with confirmation) |
| Right-click card | Context menu |

### Context menu
```
  Open
  Focus Mode
  ──────────
  Snooze ►  [Later today / Tomorrow / Next week / Custom]
  Mark as blocked by...
  ──────────
  Add Resource
  Add Voice Note
  ──────────
  Assign to Project ►
  Change Color ►
  Duplicate
  ──────────
  Archive
```

### Multi-select actions
When ≥2 cards are selected, a floating action bar appears above the selection:
```
  [Complete all]  [Snooze all ▼]  [Move to project ▼]  [Archive all]
```

---

## Project Boundaries

When a project has ≥3 tasks on the canvas, a soft visual boundary appears around the cluster — a translucent rounded rectangle with the project name as a label in its header.

The boundary:
- Is non-interactive (tasks can be dragged in/out freely)
- Scales with the task cluster
- Uses the project's color at 15% opacity
- Disappears when a project has <3 tasks (not worth showing)

Force-directed layout can be triggered per project: select project in the sidebar → "Auto-arrange project" → tasks animate to an evenly-spaced grid within the boundary.

---

## Seasonal Canvas Themes

The canvas background and accent palette shifts with the real-world season:

### Spring (March – May)
- Background: soft warm black with a subtle upward-drifting particle (pollen/seeds effect)
- Task card accents: green-tinted cream
- Completion animation: small flower petals burst

### Summer (June – August)
- Background: crisp dark with subtle high-contrast brightness
- Task card accents: clear white and gold
- Canvas feels open and bright — maximum clarity mode

### Autumn (September – November)
- Background: deep warm charcoal
- Task card accents: amber, rust, and muted orange
- Ambient particles: slow-falling leaves (subtle, not distracting)
- Completion animation: leaf-fall burst

### Winter (December – February)
- Background: deep cool gray-black
- Task card accents: cool white and ice blue
- Ambient particles: very occasional slow-falling snowflakes
- Canvas feels quiet and still — good for reflective work

### Implementation
- Particle effects are CSS-only or minimal Canvas API (≤50 particles at once)
- Particles are paused if `prefers-reduced-motion: reduce` is set in the OS
- Season can be manually pinned in Settings

---

## Delight Mechanics

### Victory lap animation (task completion)
See detailed spec in [task-lifecycle.md](./task-lifecycle.md).

Key principle: the animation should feel like something you *earned*, not like a video game reward. It should be warm and physical, not flashy and cheap.

### "Flow state" canvas dimming
When the user has been working with no distractions for 15 consecutive minutes (no new tasks created, no settings changes, just editing or focusing):
- The canvas background dims very slightly
- A small indicator appears: *"In flow ✦"*
- This persists until the user switches away from the window or performs a meta-action
- No sound, no celebration — just a quiet acknowledgment

### Empty canvas delight
When all active tasks are completed, the canvas shows a special empty state:

```
                    ✦

          Everything is done.

     The canvas is clear. Breathe.

                 ─────

         ( start something new )
```

Subtle ambient particles drift across the canvas. The moment is held gently — not rushed.

### First-run onboarding
The canvas opens with 3 pre-populated sample tasks arranged on the canvas, each with voice notes and resources that explain Pulse features through experiencing them, not reading a tutorial. Sample tasks:
1. "Try completing this task →" (demonstrates completion animation)
2. "Open me to see what a rich task looks like" (demonstrates editor, voice note, resource)
3. "Create your first real task →" (demonstrates quick capture with `N`)

---

## Focus Mode Visual Specification

Focus Mode is a full-screen takeover. It should feel like a dedicated writing environment, not a pop-up.

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Canvas                               ○ 24:55  🎵       │
│                                                                    │
│                                                                    │
│    Review Q2 proposal                                              │
│    ─────────────────────────────────────────────────────           │
│                                                                    │
│    The proposal covers three main areas: market positioning,       │
│    pricing strategy, and the revised go-to-market timeline.        │
│    Notes from last review are attached below.                      │
│                                                                    │
│    □  Check competitive landscape section                          │
│    ■  Verify pricing against April forecasts                       │
│    □  Review executive summary                                     │
│    □  Cross-reference with legal feedback                          │
│                                                                    │
│    ████████░░░  2/4                                                │
│                                                                    │
│                                                                    │
│                                              [ Resources ▸ ]      │
│                                                                    │
│  ─────────────────────────────────────────────────────────────────│
│   [Done]      [Need more time ▾]      [Exit without action]       │
└────────────────────────────────────────────────────────────────────┘
```

### Typography
- Title: 2rem, weight 600, letter-spacing -0.02em
- Body: 1rem, line-height 1.75, max-width 680px (centered reading column)
- Subtasks: 0.9rem

### Focus Mode exit prompt
On pressing `Esc` or "← Back to Canvas":
```
  How did it go?

  [✓ Done — mark complete]
  [→ Keep going — stay active]
  [⏳ Snooze — come back later]
```

This makes every exit from Focus Mode a moment of intentional reflection, not just a button press.

---

## Timeline View

An alternative view (top nav, shortcut `2`) showing tasks on a horizontal timeline.

### Layout
- Horizontal axis: time (days)
- Tasks appear as cards positioned at their deadline
- Tasks without deadlines are in a "No date" lane at the top
- Today's position is highlighted with a vertical line
- Scroll horizontally to move through time

### Interactions
- Drag a task card horizontally to change its deadline
- Click card to open editor
- Hover shows task preview

### Visual density
The timeline can be toggled between:
- **Compact:** card = dot + title, useful for many tasks
- **Expanded:** full card with metadata

---

## Minimap

A 180×120px thumbnail of the full canvas in the bottom-right corner.

- Background matches canvas theme (slightly darkened)
- Task positions shown as colored dots (project color or default)
- Viewport shown as a semi-transparent white rectangle
- Drag the viewport rectangle to pan the canvas
- Click anywhere in the minimap to jump to that area
- Collapse button (→) hides it; last state persists

---

## Accessibility

- All interactive elements have visible focus rings
- Color is never the sole indicator of state (icons/text always accompany)
- `prefers-reduced-motion` disables all animations (completion animations replaced with a static checkmark flash)
- Screen reader labels on all cards and controls
- Voice interface is an additional input modality, not a replacement for keyboard/mouse
- Minimum tap target size: 44×44px (for trackpad and touch users)
- High-contrast mode: Settings → Accessibility → High Contrast (increases card borders and text contrast)
