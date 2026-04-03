# Data Model

**Application:** Pulse  
**Storage:** IndexedDB (primary) + localStorage (settings/UI state)

---

## Entity Relationship Overview

```
User (implicit, single-user)
  │
  ├── Project (1:many Tasks)
  │
  ├── Task
  │     ├── Resource[] (embedded)
  │     ├── VoiceNote[] (stored in IndexedDB object store, referenced by ID)
  │     ├── subtasks (embedded checklist in body)
  │     ├── parentId → Task (optional)
  │     └── blockedBy → Task[] (IDs)
  │
  ├── Memory (mirrored from completed/archived Tasks, immutable)
  │     └── all Task attributes, frozen at completion time
  │
  └── Pattern (derived, auto-generated)
```

---

## IndexedDB Stores

| Store name | Primary key | Description |
|---|---|---|
| `tasks` | `id` (UUID) | All active tasks (seed, active, blocked, snoozed) |
| `memories` | `id` (UUID) | Completed and archived tasks |
| `projects` | `id` (UUID) | Project definitions |
| `voiceNotes` | `id` (UUID) | Audio blobs + transcripts |
| `patterns` | `id` (UUID) | Detected behavioral patterns |
| `undoHistory` | `seq` (auto-increment) | Action log for undo/redo |

---

## Task Schema

```typescript
interface Task {
  id: string;                      // UUID v4
  title: string;                   // Required, max 280 chars
  body: string;                    // Markdown rich text, optional
  status: TaskStatus;
  energy: EnergyLevel;
  urgency: number;                 // 0-100, computed on read
  deadline: string | null;         // ISO 8601 datetime or date
  createdAt: string;               // ISO 8601
  updatedAt: string;               // ISO 8601
  completedAt: string | null;      // ISO 8601
  snoozedUntil: string | null;     // ISO 8601
  projectId: string | null;        // References projects store
  tags: string[];
  resources: Resource[];
  voiceNoteIds: string[];          // References voiceNotes store
  position: { x: number; y: number };
  color: string | null;            // CSS color string
  parentId: string | null;
  blockedBy: string[];             // Task IDs
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  origin: TaskOrigin;
  memoryEchoIds: string[];         // Memory IDs this task was rebirthed from
}

type TaskStatus = 'seed' | 'active' | 'blocked' | 'snoozed' | 'done' | 'archived';
type EnergyLevel = 'low' | 'medium' | 'high';
type TaskOrigin = 'manual' | 'voice' | 'email' | 'import' | 'rebirth';
```

---

## Resource Schema

```typescript
interface Resource {
  id: string;                      // UUID v4
  type: ResourceType;
  uri: string;                     // URL, file:// path, app deep link
  title: string;
  favicon: string | null;          // Data URL for URL resources
  previewSnippet: string | null;   // Short extracted text
  addedAt: string;                 // ISO 8601
}

type ResourceType = 'url' | 'file' | 'folder' | 'app' | 'email' | 'calendarEvent';
```

---

## VoiceNote Schema

```typescript
interface VoiceNote {
  id: string;                      // UUID v4
  taskId: string;                  // Parent task (may be memory after completion)
  audioBlobKey: string;            // Key in a separate IndexedDB blob store
  transcript: string | null;
  duration: number;                // Seconds
  createdAt: string;               // ISO 8601
}
```

---

## Project Schema

```typescript
interface Project {
  id: string;                      // UUID v4
  name: string;
  color: string;                   // CSS color string
  icon: string;                    // Emoji or named icon string
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## RecurrenceRule Schema

```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;                // Every N days/weeks/months
  daysOfWeek: number[] | null;     // 0=Sun...6=Sat, for weekly
  dayOfMonth: number | null;       // 1-31, for monthly
  endsOn: string | null;           // ISO 8601 date, null = never
  nextOccurrence: string;          // ISO 8601, computed
}
```

---

## Memory Schema

```typescript
// Memory is identical to Task but stored in a separate store and immutable.
// After task completion or archival, the task is serialized and written here.
interface Memory extends Task {
  // All Task fields, plus:
  originalTaskId: string;          // The task ID before promotion to memory
}
```

---

## Pattern Schema

```typescript
interface Pattern {
  id: string;                      // UUID v4
  description: string;             // Human-readable: "You often create X on Mondays"
  patternType: 'time-of-week' | 'project-rhythm' | 'recurring-intent';
  triggerCondition: PatternTrigger;
  suggestedTaskTemplate: Partial<Task>;
  occurrences: number;
  lastSeen: string;                // ISO 8601
  userAction: 'pending' | 'accepted' | 'dismissed' | 'suppressed';
}

interface PatternTrigger {
  dayOfWeek?: number;              // 0-6
  projectId?: string;
  titlePattern?: string;           // Simplified regex/keyword
}
```

---

## localStorage Keys

| Key | Type | Description |
|---|---|---|
| `pulse_settings` | JSON object | All user settings |
| `pulse_canvasState` | JSON object | Pan position, zoom level, active view |
| `pulse_lastFlashback` | ISO 8601 string | Date of last shown Flashback |
| `pulse_streakState` | JSON object | `{ count, lastCompletionDate }` |
| `pulse_momentumCache` | JSON object | `{ score, calculatedAt }` |
| `pulse_gmailToken` | JSON object | Encrypted OAuth token (access + refresh) |

---

## Urgency Computation

Urgency is a derived value (not stored). Computed on read for each task:

```
urgency = 0

if deadline exists:
  hoursUntilDeadline = (deadline - now) / 3600000
  if hoursUntilDeadline < 0:     urgency += 60  // overdue
  elif hoursUntilDeadline < 24:  urgency += 45  // due today
  elif hoursUntilDeadline < 72:  urgency += 25  // due this week

if energy == 'high':  urgency += 15
if energy == 'medium': urgency += 5

if manualUrgencySignal: urgency += 20  // user set !urgent

urgency = min(100, urgency)
```

Urgency drives the visual glow intensity on the canvas card.

---

## Data Export Format

The export JSON structure:

```json
{
  "version": "1.0",
  "exportedAt": "<ISO 8601>",
  "tasks": [ ...Task[] ],
  "memories": [ ...Memory[] ],
  "projects": [ ...Project[] ],
  "voiceNotes": [ ...VoiceNote[] (without audio blobs) ],
  "settings": { ...Settings }
}
```

Audio blobs are excluded from the JSON export (too large). A future export format may include them as base64, controlled by a "Include audio" checkbox.
