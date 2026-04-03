# Functional Specification

**Application:** Pulse  
**Platform:** Desktop Progressive Web Application (PWA)  
**Storage:** Local-first (IndexedDB + localStorage)  
**Version:** 1.0 — Core Experience  
**Date:** 2026-04-03

---

## 1. Application Overview

Pulse is a personal productivity application where tasks are living entities with lifecycle, context, linked resources, and memory. The primary interaction surface is a **spatial canvas** rather than a linear list. Users interact via mouse, keyboard, and voice. Tasks integrate with Gmail and Google Calendar.

---

## 2. Core Entities

### 2.1 Task

The fundamental unit of the application.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | Immutable identifier |
| `title` | string | Required. The task's name. |
| `body` | string (rich text) | Optional longer description, supports markdown |
| `status` | enum | `seed`, `active`, `blocked`, `snoozed`, `done`, `archived` |
| `energy` | enum | `low`, `medium`, `high` — cognitive load required |
| `urgency` | computed | Derived from deadline, dependencies, user signal |
| `deadline` | datetime? | Optional. Drives urgency calculations. |
| `createdAt` | datetime | When the task was created |
| `updatedAt` | datetime | Last modification |
| `completedAt` | datetime? | When status became `done` |
| `snoozedUntil` | datetime? | Wake time if status is `snoozed` |
| `projectId` | UUID? | Optional project grouping |
| `tags` | string[] | User-defined labels |
| `resources` | Resource[] | Linked external resources |
| `voiceNotes` | VoiceNote[] | Attached audio recordings |
| `position` | {x, y} | Canvas position |
| `color` | string? | User-assigned accent color |
| `parentId` | UUID? | Parent task for subtask relationships |
| `blockedBy` | UUID[] | IDs of blocking tasks |
| `origin` | enum | `manual`, `voice`, `email`, `import` — how it was created |
| `memoryEchoIds` | UUID[] | Past tasks this task was echoed from |

### 2.2 Project

A named grouping that clusters related tasks on the canvas.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | |
| `name` | string | |
| `color` | string | Accent color for all member tasks |
| `icon` | emoji/string | Visual identifier |
| `isArchived` | boolean | |

### 2.3 Resource

An external item linked to a task.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | |
| `type` | enum | `url`, `file`, `folder`, `app`, `email`, `calendarEvent` |
| `uri` | string | URL, file path, app deep link, etc. |
| `title` | string | Display label (auto-fetched for URLs) |
| `favicon` | string? | For URL resources |
| `previewSnippet` | string? | Short extracted text for URLs |
| `addedAt` | datetime | |

### 2.4 VoiceNote

An audio recording attached to a task.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | |
| `audioBlob` | Blob (stored in IndexedDB) | Raw audio data |
| `transcript` | string? | Auto-transcribed text |
| `duration` | number | Seconds |
| `createdAt` | datetime | |

### 2.5 Memory

A completed or archived task promoted to the memory vault.

A Memory is identical in structure to a Task but lives in a separate `memories` store. It is immutable and searchable.

### 2.6 Pattern

A recognized behavioral pattern derived from the user's task history.

| Attribute | Type | Description |
|---|---|---|
| `id` | UUID | |
| `description` | string | Human-readable summary |
| `triggerSignal` | string | What condition triggers the suggestion |
| `suggestedTask` | Partial<Task> | Pre-filled task template |
| `occurrences` | number | How many times this pattern was observed |
| `lastSeen` | datetime | |

---

## 3. Feature Specifications

### 3.1 The Canvas

**Description:** The primary view. Tasks exist as cards in a two-dimensional space. Users can freely arrange, cluster, and navigate the canvas.

**Behaviors:**

- Canvas is infinite in all directions; panning via drag or two-finger scroll
- Zoom in/out (`Ctrl+scroll` or pinch)
- Tasks render as cards with visible title, status indicator, urgency glow, and resource count badge
- Cards animate subtly: active tasks have a very slow pulse; urgent tasks have a warm glow; snoozed tasks appear dimmed
- Double-click empty canvas space → create new task at that position
- Right-click task card → context menu (Edit, Snooze, Complete, Duplicate, Link Resource, Delete)
- Drag task card → reposition
- Hold `Shift` + drag → multi-select
- Multi-selected tasks can be grouped into a project, bulk completed, or bulk snoozed
- Canvas auto-arranges when a project is selected (force-directed layout within project boundary)
- **Minimap:** bottom-right corner shows a scaled-down overview of the full canvas with viewport indicator

**Views (toggled via top nav):**

| View | Description |
|---|---|
| Canvas | Default spatial view |
| Focus | One task, full screen (see §3.7) |
| Timeline | Tasks on a horizontal time axis by deadline |
| Memory Vault | Completed/archived tasks and recall tools (see §3.5) |

---

### 3.2 Task Creation

**Quick capture (primary flow):**

1. Press `N` (anywhere) or click `+` in the toolbar
2. A capture bar slides in from the top
3. User types a title in natural language
4. Press `Enter` → task created with defaults at canvas center (or last cursor position)
5. Press `Tab` after title → expand to full editor inline

**Natural language parsing on title:**

The capture bar parses natural language cues automatically:

| Input fragment | Parsed as |
|---|---|
| `tomorrow`, `next Friday`, `in 3 days` | Deadline |
| `#project-name` | Project assignment |
| `@high`, `@low` | Energy level |
| `!urgent` | Manual urgency signal |
| `every Monday` | Recurring task |

Examples:
- `"Review Q1 report #board-prep tomorrow @high"` → Title: "Review Q1 report", Project: board-prep, Deadline: tomorrow, Energy: high
- `"Call dentist every Thursday"` → Recurring task, weekly

**Full task editor:**

Accessed by clicking a task card or pressing `Enter` on a selected card. Opens as a side panel (not a modal, so the canvas remains visible).

Sections:
- Title (editable inline)
- Body (rich text editor with markdown shortcuts)
- Deadline picker (calendar + time)
- Energy selector (Low / Medium / High chips)
- Project picker
- Tags input
- Resources panel (see §3.4)
- Voice notes panel (see §3.6)
- Subtasks (inline checklist within the body)
- Metadata (created date, origin, echo history)

---

### 3.3 Task Lifecycle & Status

Tasks follow a lifecycle with distinct visual treatments:

```
seed ──► active ──► done ──► [memory vault]
          │
          ├──► snoozed ──► active (on wake)
          │
          └──► blocked ──► active (when dependency resolves)
                │
                └──► archived ──► [memory vault]
```

| Status | Visual | Description |
|---|---|---|
| `seed` | Pale, small card | Just created; not yet actionable |
| `active` | Normal card, subtle pulse animation | In progress or ready |
| `blocked` | Greyed card with chain icon | Waiting on another task |
| `snoozed` | Dimmed card with moon icon | Hidden until wake time |
| `done` | Brief bloom animation → fades out | Completed |
| `archived` | Immediately moves to Memory Vault | Explicitly discarded |

**Completion mechanics:**

- Click the status ring on a card → cycle to `done`
- Or: open task editor → click "Complete" button
- On `done`: play a brief "bloom" particle animation on the canvas card
- If it was a "heavy" task (energy: high, or body has significant content): play the "victory lap" animation (card expands, sparkle effect, subtle sound if audio is on)
- Task fades from canvas over 1.5 seconds and moves to Memory Vault
- Canvas gently rebalances to fill the void

**Recurring tasks:**

- Completing a recurring task immediately creates the next instance
- The new instance inherits all attributes except status and completedAt
- The user sees: "Next occurrence created for [date]" toast notification

**Snooze:**

- Snooze options: Later today (evening), Tomorrow morning, Next week, Pick a date
- Snoozed tasks leave a "ghost" on the canvas that shows the wake time on hover
- At wake time: card reappears with a gentle slide-in animation and an optional notification

---

### 3.4 External Resources

**Description:** Any task can be linked to one or more external resources — URLs, files, folders, or applications.

**Adding a resource:**

| Method | Behavior |
|---|---|
| Drag a URL from browser → task card | Resource added; title and favicon auto-fetched |
| Drag a file/folder from OS file explorer → task card | File path resource added |
| Paste a URL into the task editor | Prompt appears: "Add as resource?" |
| Type or paste in Resources panel | Manual URI entry with type selector |
| Right-click task → "Add Resource" | Opens resource picker |

**Resource types and behaviors:**

| Type | Icon | Open behavior | Preview |
|---|---|---|---|
| `url` | Favicon or globe | Opens in default browser | Page title + snippet + favicon |
| `file` | File type icon | Opens with default OS app | File name, size, last modified |
| `folder` | Folder icon | Opens in OS file explorer | Folder name and path |
| `app` | App icon | Deep link or opens app | App name |
| `email` | Envelope icon | Opens in Gmail | Email subject + sender |
| `calendarEvent` | Calendar icon | Opens in Google Calendar | Event title + time |

**Resource preview:**

Each linked resource shows a compact preview chip on the task card (icon + title). In the task editor, resources have a full preview card with a short snippet or metadata.

**Smart resource detection:**

When the user opens Pulse, the app checks if any currently open browser tabs or recently opened files match resources linked to active tasks. If they do, the matching tasks are visually highlighted on the canvas with a "context match" indicator. This is purely local (no browser access needed — matching is done against the resource URI list the user has already saved).

---

### 3.5 Memory Layer

**Description:** Completed and archived tasks become memories — immutable, searchable records of past work. The memory layer transforms your task history into a living knowledge base.

#### 3.5.1 Memory Vault

- Accessible via the "Memory Vault" view (top nav)
- Full-text search across all memories: title, body, tags, resource titles, transcripts
- Filters: date range, project, tags, energy level, origin
- Sort by: completion date, creation date, relevance (search)
- Each memory card is read-only but can be "reborn" (cloned as a new active task)

#### 3.5.2 Echoes (Recall at Creation)

When a user creates a new task, the system searches the Memory Vault for semantically similar past tasks and surfaces up to 3 "echoes" in the task editor.

**Echo matching criteria (local heuristics, no external AI):**

- Exact or partial title word overlap
- Matching tags
- Same project
- Same linked domain (for URL resources)

**Echo display:**

A subtle panel below the title field reads:  
*"You've done something like this before:"*  
→ [Echo 1: title, completed date, click to expand]  
→ [Echo 2: ...]  

The user can:
- Dismiss echoes
- Copy a past task's body/resources into the new task
- Open a past task in the Memory Vault for reference

#### 3.5.3 Patterns

The app tracks behavioral patterns in the background and surfaces them as suggestions.

**Pattern detection (local, rule-based):**

| Pattern type | Detection logic | Suggestion |
|---|---|---|
| Time-of-week | Same task type created ≥3× on same weekday | "You often do X on [day]. Create one?" |
| Project rhythm | Project tasks created/completed in cycles | "Looks like it's time for your [project] review." |
| Recurring intent | User manually marks similar tasks complete N times | Offer to make it a recurring task |

Patterns surface as a subtle suggestion card in the top-right of the canvas. The user can accept (create suggested task), dismiss, or "never suggest this."

#### 3.5.4 Flashbacks

Once per day, when the app is opened, a "Flashback" may appear in the bottom bar:

> *"One year ago today, you completed: 'Launch the beta site' — nice work."*

Flashbacks are:
- Only shown if the memory is ≥30 days old
- Limited to 1 per app open
- Dismissible
- Clickable to open the full memory

#### 3.5.5 Momentum Score

A personal score (0–100) visible in the top bar that reflects recent productivity.

**Calculation (local, daily):**

```
momentumScore = (
  completedThisWeek × 3 +
  completedToday × 5 +
  currentStreak × 2 -
  overdueCount × 2
) normalized to 0-100
```

The score is shown as a subtle number + a small spark glyph. It does not rank you against others — it is only ever compared to your own history.

**Streak:**

- Streak = consecutive calendar days with at least one completed task
- Displayed as a flame icon + count
- Breaking a streak shows a gentle, non-shaming message: *"Streak paused. Start fresh today."*

---

### 3.6 Voice Interface

**Description:** Voice is a first-class input method for creating tasks, adding notes, and querying your list.

#### 3.6.1 Voice Capture

**Activation:**

- Click the microphone button in the toolbar
- Press `V` (when not typing)
- Say "Hey Pulse" if ambient listening is enabled (user opt-in, enabled in Settings)

**Behavior:**

1. A voice capture overlay appears (full-screen dark overlay with a pulsing waveform)
2. User speaks freely
3. On silence (1.5s pause) or pressing `Esc`: capture ends
4. Transcript appears in real time using the Web Speech API
5. The system parses the transcript to determine intent:

**Intent parsing:**

| Spoken input | Parsed intent |
|---|---|
| "Add [title] due [date]" | Create task |
| "Note on [task title]: [note]" | Add body note to matching task |
| "Complete [task title]" | Mark task done |
| "What do I have today?" | Read out today's tasks |
| "What's my momentum?" | Read out momentum score and streak |
| "Snooze [task title] until tomorrow" | Snooze task |
| Free-form journaling (> 3 sentences) | Extract tasks from speech (see §3.6.2) |

6. Parsed result shown as a preview card: *"I'll create: 'Review proposal' due Friday."*
7. User confirms with `Enter` or a second tap; edits inline if needed

#### 3.6.2 Voice Journaling

If the user speaks more than 3 sentences without a clear imperative structure, Pulse enters "journal mode":

- The full transcript is saved as a voice note
- The system extracts candidate tasks (sentences containing action verbs + subjects)
- Candidate tasks are shown as a list: *"I found 3 possible tasks in what you said:"*
  - [x] "Call Marcus about the contract" — Accept / Dismiss
  - [x] "Look up the new zoning regulations" — Accept / Dismiss
  - [x] "Book flights for the conference" — Accept / Dismiss
- Accepted tasks are created on the canvas
- The original transcript is saved as a Voice Note attached to the first created task

#### 3.6.3 Voice Notes on Tasks

Inside the task editor:

- Press the microphone icon in the Voice Notes panel
- Record a note of any length
- Transcript is generated and shown alongside the audio player
- Voice notes are searchable via their transcript in the Memory Vault

#### 3.6.4 Voice Readback

When the user asks "What do I have today?" (voice or typed in command palette):

- The app reads aloud all `active` tasks with deadlines today, plus any with no deadline that are high-energy
- Uses the Web Speech Synthesis API with a warm, calm voice
- Shows a visual list simultaneously

---

### 3.7 Focus Mode

**Description:** Single-task deep work mode. Removes all distractions.

**Activation:**

- Double-click a task card
- Press `F` on a selected task
- Click "Focus" in the task editor

**Behavior:**

- Full-screen takeover
- Task title in large, calm typography
- Body / notes in a clean reading/editing area
- Resource links accessible in a collapsible panel on the right
- Timer (optional): Pomodoro-style or free-running
- Ambient sound selector: silence / white noise / rain / lo-fi (local audio files)
- Canvas completely hidden — zero distraction
- Progress bar: if the task has subtasks, shows completion ratio
- On exit: prompt "Did you make progress?" → Yes (task stays active) / Done (mark complete) / Need more time (snooze)

---

### 3.8 Email & Calendar Integration

#### 3.8.1 Email a Task (Outbound)

From any task:

- Click "Share → Email" in the task editor
- Opens Gmail compose (new tab) pre-filled with:
  - **Subject:** `[Pulse Task] {task title}`
  - **Body:** Task body, deadline, resource links, any assigned subtasks
- The email is composed in the user's browser; no server-side email access required

#### 3.8.2 Create Task from Email (Inbound)

The user forwards an email to a **magic address** that triggers task creation.

**Implementation approach (PWA-safe, local-first):**

Since the app is local-only in v1.0, inbound email is handled via a **Gmail polling mechanism**:

1. User authorizes Gmail read access (OAuth, read-only scope) in Settings
2. App polls a designated Gmail label (user creates label e.g. "pulse-inbox") every 5 minutes when the app is open
3. Any email found in that label is parsed:
   - Email subject → task title
   - Email body snippet → task body
   - Sender → resource of type `email` (with link to the thread)
   - Date → task creation date
4. Created task appears on canvas with origin: `email`
5. Email is marked as processed (label moved to "pulse-processed")

**User setup flow:**

1. Settings → Integrations → Gmail
2. "Connect Gmail" → OAuth flow
3. User told: "Forward emails to your [pulse-inbox] Gmail label to create tasks"
4. App creates the Gmail label automatically if it doesn't exist (requires Gmail write scope for label management only)

#### 3.8.3 Add Task to Google Calendar

From any task with a deadline:

- Click "Add to Calendar" in the task editor
- Opens Google Calendar event creation in a new tab, pre-filled with:
  - **Title:** Task title
  - **Date/Time:** Task deadline (default 1-hour block at deadline time, or all-day if no time set)
  - **Description:** Task body + resource links
- No OAuth required — uses the standard Google Calendar URL parameter API

**Shortcut:** If Gmail OAuth is already connected (§3.8.2), the app can create the event directly via the Calendar API without leaving the app, showing an in-app confirmation instead of opening a new tab.

---

### 3.9 Command Palette

Accessible via `⌘K` / `Ctrl+K` or clicking the search icon.

**Capabilities:**

- Search tasks by title, body text, tag, or project name
- Execute any app action: New Task, Switch View, Open Memory Vault, Toggle Focus Mode, etc.
- Navigate to any project
- Trigger voice capture
- Open Settings

**Behavior:**

- Fuzzy search across all active tasks and recent memories
- Results ranked by recency and relevance
- Arrow keys + `Enter` to select
- `Esc` to close

---

### 3.10 Settings

| Setting | Type | Description |
|---|---|---|
| Theme | light / dark / system | Visual theme |
| Season mode | auto / manual | Canvas seasonal theme |
| Ambient listening | boolean | "Hey Pulse" wake word |
| Voice language | locale string | For speech recognition |
| Ambient sound (Focus) | string | Default Focus Mode audio |
| Momentum score | show/hide | Toggle visibility |
| Flashbacks | enabled/disabled | Toggle daily memory recall |
| Gmail integration | connected/disconnected | OAuth status + disconnect |
| Pattern suggestions | enabled/disabled | Toggle pattern cards |
| Keyboard shortcuts | reference panel | Full shortcut list |
| Data export | button | Export all tasks + memories as JSON |
| Data import | button | Import from JSON or supported apps |
| Reset app | button | Clear all local data (with confirmation) |

---

## 4. PWA Requirements

- **Installable:** Valid Web App Manifest with custom icons, name "Pulse", theme color
- **Offline-first:** All core features work with zero network connection
- **Storage:** IndexedDB for task data, voice blobs, memory vault; localStorage for settings and UI state
- **Service Worker:** Caches app shell; background sync for Gmail polling when online
- **Responsive:** Optimized for desktop (1024px+); functional but not optimized for mobile (v1.0)
- **Keyboard-first:** All actions reachable without a mouse

---

## 5. Keyboard Shortcuts Reference

| Shortcut | Action |
|---|---|
| `N` | New task (quick capture) |
| `Enter` | Open selected task |
| `F` | Focus Mode on selected task |
| `V` | Voice capture |
| `Esc` | Close panel / cancel / exit Focus |
| `Ctrl+K` | Command palette |
| `Delete` / `Backspace` | Archive selected task (with confirmation) |
| `Space` | Toggle task completion on selected card |
| `1` / `2` / `3` | Switch view (Canvas / Timeline / Memory Vault) |
| `Ctrl+Z` | Undo last action |
| `Ctrl+Shift+F` | Toggle full-canvas Focus |
| Arrow keys | Navigate between task cards |
| `Tab` | Expand quick capture to full editor |
| `?` | Show keyboard shortcut reference |

---

## 6. Constraints & Out of Scope (v1.0)

| Item | Status |
|---|---|
| Mobile layout | Out of scope (v2.0) |
| Cross-device sync | Out of scope (v2.0) |
| Collaboration / sharing tasks with others | Out of scope |
| AI/LLM-powered smart features | Out of scope (local heuristics only in v1.0) |
| Native desktop app (Electron) | Out of scope |
| Integration with apps other than Gmail/Calendar | Out of scope |
| Push notifications when app is closed | Not possible for PWA without a server; deferred |
