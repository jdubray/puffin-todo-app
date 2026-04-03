# Feature: Memory Layer

The memory layer is what separates Pulse from every other to-do app. Completed tasks are not deleted — they become a searchable, resurfaceable knowledge base that grows more valuable over time.

---

## Philosophy

Most productivity apps treat task completion as a garbage collection event. The task is done; it disappears. Your history is invisible.

Pulse inverts this. Every task you complete is a data point about how you work, what you care about, and what you know how to do. The memory layer makes that history usable.

---

## The Four Memory Mechanisms

### 1. Memory Vault (Direct Access)
### 2. Echoes (Contextual Recall at Creation)
### 3. Patterns (Behavioral Prediction)
### 4. Flashbacks (Time-based Resurfacing)

---

## 1. Memory Vault

The Memory Vault is a view (accessible from the top nav) containing every completed and archived task.

### Layout
- Cards in a two-column masonry grid (different from the spatial canvas)
- Sorted by completedAt descending by default
- Search bar with real-time filtering
- Filter sidebar: date range, project, tags, energy, origin

### Memory Card
Each card shows:
- Title (larger, bolder than on canvas cards)
- Completion date ("Completed 3 months ago" — human-friendly)
- Body excerpt (first 2 lines)
- Resource chips (icons only for compactness)
- Tags
- Energy badge
- Voice note indicator (if any)

### Interactions
- Click card → expands in-place to show full body, all resources, voice notes
- "Rebirth" button → creates a new active task from this memory (see §Rebirth)
- "Delete permanently" → confirmation modal → hard delete from storage

### Search
Full-text search across:
- Task title
- Task body
- Tag names
- Resource titles and snippet previews
- Voice note transcripts

Search is executed locally using a simple inverted index maintained in localStorage.

---

## 2. Echoes

Echoes surface relevant past tasks at the moment of task creation — when the user is most likely to benefit from prior context.

### When echoes appear
After the user has typed ≥3 words in the quick capture bar or task editor title field, the system performs a local search of the Memory Vault and returns up to 3 matches.

### Matching algorithm (local, no external service)

```
score(memory, query) =
  titleWordOverlapScore(memory.title, query) × 40
  + tagMatchScore(memory.tags, parsedTags) × 30
  + projectMatchScore(memory.projectId, parsedProject) × 20
  + domainMatchScore(memory.resources, query) × 10

titleWordOverlapScore = (sharedWords / queryWords) clamped 0-1
```

The top 3 memories by score are shown if score > 0.

### Echo UI
A subtle panel slides in below the title input:

```
┌──────────────────────────────────────────────────────┐
│  You've done something like this before:              │
│                                                       │
│  ○ Review Q4 proposal — completed Jan 12             │
│    "Cross-checked against the legal framework..."    │
│    [Copy body & resources] [Open in vault]           │
│                                                       │
│  ○ Review vendor contract — completed Aug 3, 2025    │
│    [Copy body & resources] [Open in vault]           │
│                                              [✕ Dismiss] │
└──────────────────────────────────────────────────────┘
```

### Behavior
- Echoes appear 400ms after the user stops typing (debounced)
- Dismissing hides them for the current capture session only
- "Copy body & resources" copies the memory's body into the new task's body and adds all resources
- "Open in vault" opens the Memory Vault with that memory expanded, without closing the capture bar
- The new task's `memoryEchoIds` stores the IDs of any echoes that were copied from

---

## 3. Patterns

The pattern engine observes the user's task creation and completion behavior and generates proactive suggestions.

### Pattern types

#### Time-of-week pattern
**Detection:** The same tag, project, or title keyword appears ≥3 times on the same day of the week within the last 8 weeks.

**Suggestion card:**
> *"You often create tasks like 'Weekly report' on Mondays. Create one now?"*
> [Create] [Not today] [Don't suggest this]

#### Project rhythm
**Detection:** A project has tasks completed at a consistent interval (e.g., every 2 weeks), and the interval has elapsed.

**Suggestion card:**
> *"It's been 2 weeks since you worked on 'Brand Refresh'. Time to pick it up again?"*
> [Show project] [Dismiss]

#### Recurring intent
**Detection:** The same task title (>70% word overlap) has been created and completed ≥4 times without being set as recurring.

**Suggestion card:**
> *"You've done 'Update team status doc' 5 times. Want to make it recurring?"*
> [Make recurring] [No thanks]

### Suggestion card display
- Appears in the top-right corner of the canvas as a floating card
- At most one pattern suggestion is shown at a time
- Dismissed suggestions do not reappear for 7 days
- "Don't suggest this" suppresses that pattern permanently
- Only shown when the canvas is in the default (non-Focus) view

---

## 4. Flashbacks

Once per day, on the first app open, the system may show a Flashback — a memory from the same calendar period in a past year.

### Selection algorithm
```
candidates = memories where:
  - completedAt.month == today.month
  - completedAt.day is within ±3 days of today.day
  - completedAt.year < today.year
  - (completedAt - today) >= 30 days

selected = random choice from candidates, weighted toward older memories
```

### Flashback display
A card in the bottom status bar:
```
┌─────────────────────────────────────────────────────┐
│ ◎ 1 year ago today: "Launched the beta site" ✓     │
│   April 3, 2025                             [✕]   │
└─────────────────────────────────────────────────────┘
```

- Clicking the card opens the full memory in the Memory Vault
- Dismissing it removes it for the day
- If no candidates exist, nothing is shown
- Flashbacks can be disabled in Settings

### Intent
Flashbacks are not productivity tools. They are existential acknowledgment: *you have built things, you have done things, and it is worth remembering.* They should feel warm, not gamified.

---

## Memory Vault Search Index

To enable fast full-text search without a backend, the app maintains a local search index in localStorage.

### Index structure (simplified inverted index)
```
{
  "word": ["memoryId1", "memoryId2"],
  ...
}
```

The index is updated:
- When a task is completed or archived (memory added)
- When a memory is permanently deleted (entries removed)
- On app startup, if the index is missing or corrupted (full rebuild from IndexedDB)

### Performance constraints
- Index is stored in localStorage (5MB limit per origin)
- For users with >2,000 memories, the index uses a compressed bloom-filter approach and falls back to linear scan for rare terms
- Search results return within 100ms for typical vault sizes

---

## Rebirth

"Rebirthing" a memory creates a new active task from it.

### Rebirth behavior
1. User clicks "Rebirth" on a memory card
2. New Task created with:
   - All attributes copied from the memory
   - `status` → `seed`
   - `completedAt` → null
   - `createdAt` → now
   - `origin` → `rebirth`
   - `memoryEchoIds` → [source memory ID]
   - `position` → canvas center (or last cursor position)
3. Canvas switches to active view, new task selected
4. Task editor opens automatically
5. Toast: *"Task rebirthed from memory. Edit and activate when ready."*

The original memory is **not affected** — it remains in the vault as a historical record.
