# Feature: Task Lifecycle

Tasks in Pulse are not static records. They move through a life — from the moment of capture to the moment they become a memory.

---

## Status State Machine

```
           ┌─────────────────────┐
           │                     ▼
[create] → seed → active → snoozed → active
                   │   ↑              
                   │   └── (wake timer fires)
                   │
                   ├── blocked ──► (unblocked when deps complete) ──► active
                   │
                   └──► done ──────────────────────────────► Memory Vault
                   │
                   └──► archived ──────────────────────────► Memory Vault
```

---

## Status Definitions

### `seed`
The task exists but has not been acted upon. Newly created tasks start here if the user hasn't added details. Visually smaller and paler than active tasks on the canvas.

A task transitions from `seed` → `active` when:
- User opens the task editor
- User adds a resource, deadline, or body
- 24 hours pass (auto-promotes to active to prevent seeds rotting unnoticed)

### `active`
The task is ready to be worked on. Default state after creation with content. Has the standard card appearance with a subtle pulse animation.

### `snoozed`
The task has been deliberately set aside until a future time. It leaves a "ghost" on the canvas — a dimmed outline with a moon icon showing the wake time.

On wake (snoozedUntil ≤ now):
- Status resets to `active`
- Card re-materializes with a slide-in animation
- Optional system notification fires

### `blocked`
The task is waiting on one or more other tasks. Cannot be worked on meaningfully yet. Card shows a chain icon and a count of blocking tasks.

Auto-unblocks when all tasks in `blockedBy` reach `done` status.

### `done`
The task has been completed. Triggers a completion animation and then fades from the canvas. Immediately promoted to the Memory Vault (it never truly disappears).

### `archived`
The task is explicitly discarded — the user decided it is no longer relevant without completing it. No animation. Moves immediately to Memory Vault.

---

## Completion Animation Specification

### Standard completion ("bloom")
1. The status ring on the card fills with color (clockwise, 300ms)
2. A brief light burst emanates from the card center (4 radial particles, 200ms)
3. Card brightens slightly (brightness 110%, 100ms)
4. Card fades out with a gentle scale-down (opacity 0, scale 0.85, 500ms)
5. Canvas smoothly reflows to fill the void (200ms)

### Victory lap (high-effort tasks)
Triggered when: `energy == 'high'` OR body is > 200 characters OR task has ≥5 subtasks

1. The card expands briefly (scale 1.2, 200ms, with ease-out-back)
2. A sparkle burst of 12+ particles radiates outward
3. A small "✓" icon floats up and fades (300ms)
4. Optional subtle audio chime plays (if sounds are enabled)
5. The card fades as in standard bloom (500ms)

The victory lap should feel genuinely satisfying — like landing something difficult.

---

## Snooze Options

| Option | Wake time |
|---|---|
| Later today | 6:00 PM if before 3 PM; 9:00 PM if after 3 PM |
| Tomorrow morning | 8:00 AM next day |
| Next week | 8:00 AM on the same day of next week |
| Custom | User-selected date and time via date picker |

Snooze preserves the task's exact canvas position. The ghost card holds the position.

---

## Recurring Task Mechanics

When a recurring task is completed:

1. The completion animation plays normally
2. A new task is created immediately in the `seed` state
3. The new task inherits: title, body, resources, tags, project, energy, recurrence rule
4. `deadline` is set to the next occurrence per the recurrence rule
5. A toast fires: *"Next occurrence created for [date]"*
6. The new task appears on the canvas at the same position as the completed one

**Skipping an occurrence:**
Right-click a recurring task → "Skip this occurrence" → creates the next instance without completing the current one. The current instance is archived.

---

## Subtask Completion Behavior

Completing all subtasks within a task body does **not** auto-complete the parent task.  
Instead, a prompt appears: *"All steps done — ready to mark this task complete?"*

This prevents accidental completions when the user checks off prep work but still has remaining effort.

---

## Task Deletion vs. Archival

There is no hard delete in v1.0.

"Deleting" a task archives it, moving it to the Memory Vault. This is a deliberate choice: tasks you thought were irrelevant may resurface as useful context later.

A "Permanently delete from Memory Vault" action exists in the Memory Vault view for users who want to purge sensitive or truly irrelevant items.
