# User Stories

**Application:** Pulse  
**Date:** 2026-04-03

Stories are organized by feature area. Each story follows the format:

> **Title**  
> *As a [role], I want [feature] so that [benefit].*  
> **Acceptance Criteria:** testable conditions

---

## Table of Contents

1. [Canvas & Navigation](#1-canvas--navigation)
2. [Task Creation & Editing](#2-task-creation--editing)
3. [Task Lifecycle](#3-task-lifecycle)
4. [External Resources](#4-external-resources)
5. [Memory Layer](#5-memory-layer)
6. [Voice Interface](#6-voice-interface)
7. [Focus Mode](#7-focus-mode)
8. [Email & Calendar Integration](#8-email--calendar-integration)
9. [Command Palette](#9-command-palette)
10. [PWA & Offline](#10-pwa--offline)
11. [Settings & Personalization](#11-settings--personalization)

---

## 1. Canvas & Navigation

---

### US-001: View tasks on a spatial canvas

**As a** user,  
**I want** to see all my active tasks arranged on a two-dimensional canvas  
**so that** I can perceive the full landscape of my commitments at a glance.

**Acceptance Criteria:**
- [ ] Tasks render as cards on a pannable, zoomable canvas
- [ ] Canvas is navigable by click-drag (pan) and scroll wheel (zoom)
- [ ] Each card shows at minimum: title, urgency indicator, and resource count
- [ ] Canvas state (pan position, zoom) is persisted across sessions
- [ ] On first launch, an onboarding canvas with example tasks is shown

---

### US-002: Identify task urgency at a glance

**As a** user,  
**I want** urgent tasks to look visually different from routine tasks  
**so that** I know where to direct my attention without reading every card.

**Acceptance Criteria:**
- [ ] Tasks with a deadline today or overdue display a warm glow effect
- [ ] Active tasks that are not urgent have a subtle pulse animation
- [ ] Blocked tasks appear visually dimmed with a chain icon
- [ ] Snoozed tasks are dimmed with a moon icon and show wake time on hover
- [ ] The visual treatment is understandable without a legend

---

### US-003: Switch between views

**As a** user,  
**I want** to switch between the Canvas, Timeline, and Memory Vault views  
**so that** I can work with my tasks from different perspectives.

**Acceptance Criteria:**
- [ ] View switcher is accessible in the top navigation bar
- [ ] Views are also accessible via keyboard shortcuts (`1`, `2`, `3`)
- [ ] Switching views preserves selection state when possible
- [ ] Each view has a distinct empty state when no tasks are present

---

### US-004: View a minimap of the canvas

**As a** user with many tasks,  
**I want** a minimap in the corner of the canvas  
**so that** I can understand the overall layout and navigate quickly to areas.

**Acceptance Criteria:**
- [ ] A minimap renders in the bottom-right corner
- [ ] The minimap shows a scaled representation of all task positions
- [ ] A viewport indicator shows the currently visible area
- [ ] Clicking the minimap navigates the canvas to that area
- [ ] Minimap can be collapsed/hidden

---

### US-005: Organize tasks into projects

**As a** user,  
**I want** to group related tasks into a named project  
**so that** I can see and work on a coherent body of work together.

**Acceptance Criteria:**
- [ ] I can create a project with a name, color, and emoji icon
- [ ] I can assign tasks to a project from the task editor or by multi-selecting and grouping
- [ ] Tasks in the same project cluster together on the canvas with a shared visual boundary
- [ ] Filtering by project shows only that project's tasks
- [ ] A project can be archived, hiding all its tasks from the canvas

---

## 2. Task Creation & Editing

---

### US-006: Create a task quickly from anywhere

**As a** user,  
**I want** to capture a new task in under 3 seconds without leaving what I'm doing  
**so that** I never lose a thought because capture was too slow.

**Acceptance Criteria:**
- [ ] Pressing `N` anywhere on the canvas opens the quick capture bar
- [ ] The capture bar is also openable via a `+` button in the toolbar
- [ ] Pressing `Enter` creates the task and closes the bar
- [ ] The newly created task appears on the canvas at the last cursor position or canvas center
- [ ] The entire flow from keypress to task created takes ≤ 3 user interactions

---

### US-007: Parse natural language when creating a task

**As a** user,  
**I want** to type "Review the contract #legal tomorrow @high"  
**so that** Pulse automatically sets the deadline, project, and energy level for me.

**Acceptance Criteria:**
- [ ] Date expressions (tomorrow, next Friday, in 3 days) are parsed as deadlines
- [ ] `#tag` syntax assigns the task to a matching project or creates a new tag
- [ ] `@low`, `@medium`, `@high` set the energy level
- [ ] `!urgent` sets a manual urgency signal
- [ ] Parsed fields are shown as chips below the title before confirmation
- [ ] Unrecognized tokens remain in the title; no silent data loss

---

### US-008: Edit a task in a side panel

**As a** user,  
**I want** to open a task and edit all its details in a side panel  
**so that** I can update context without losing sight of the canvas.

**Acceptance Criteria:**
- [ ] Clicking a task card opens the task editor as a side panel (not a modal)
- [ ] The canvas remains visible and interactive behind the panel
- [ ] Changes auto-save (no explicit save button required)
- [ ] The panel can be closed with `Esc` or clicking outside

---

### US-009: Add subtasks to a task

**As a** user,  
**I want** to break a task into smaller steps  
**so that** I can track progress within a complex task.

**Acceptance Criteria:**
- [ ] I can add a checklist of subtasks inside the task body
- [ ] Each subtask can be individually checked off
- [ ] The task card on the canvas shows a progress bar when subtasks are present
- [ ] Completing all subtasks does not auto-complete the parent task (prompts the user)

---

### US-010: Create a recurring task

**As a** user,  
**I want** to mark a task as recurring on a schedule  
**so that** I don't have to re-create routine commitments manually.

**Acceptance Criteria:**
- [ ] Recurrence can be set to: daily, weekly (with day selection), monthly, or custom interval
- [ ] Completing a recurring task immediately creates the next instance
- [ ] The next instance inherits all attributes (body, resources, energy, project) except status
- [ ] A toast notification confirms: "Next occurrence created for [date]"
- [ ] I can skip a single occurrence without affecting future ones

---

### US-011: Undo the last action

**As a** user,  
**I want** to undo my last action  
**so that** I can recover from mistakes without anxiety.

**Acceptance Criteria:**
- [ ] `Ctrl+Z` undoes the last action
- [ ] Undoable actions include: create, complete, archive, snooze, resource add/remove
- [ ] At least 10 levels of undo are supported within a session
- [ ] A toast notification confirms the undo: "Undid: [action description]"

---

## 3. Task Lifecycle

---

### US-012: Complete a task with a satisfying animation

**As a** user,  
**I want** completing a task to feel rewarding  
**so that** I get positive reinforcement for finishing work.

**Acceptance Criteria:**
- [ ] Clicking the status ring on a card and selecting "Done" triggers an animation on the card
- [ ] The animation is a "bloom" effect (card brightens, particles emit, then fades)
- [ ] High-energy or large tasks (has significant body content) trigger an enhanced "victory lap" animation
- [ ] The completed task fades from the canvas within 1.5 seconds
- [ ] The task is immediately accessible in the Memory Vault

---

### US-013: Snooze a task to deal with it later

**As a** user,  
**I want** to snooze a task to a specific time  
**so that** it disappears from my current attention without being lost.

**Acceptance Criteria:**
- [ ] Right-clicking a task offers snooze options: Later today, Tomorrow morning, Next week, Custom date
- [ ] Snoozed tasks leave a ghost card on the canvas showing the wake time
- [ ] At wake time, the card reappears with a slide-in animation
- [ ] An optional notification fires when a snoozed task wakes (system notification if permission granted)
- [ ] Snoozed tasks are excluded from urgency calculations

---

### US-014: Mark a task as blocked

**As a** user,  
**I want** to mark a task as blocked by another task  
**so that** I understand dependencies and don't waste time on tasks I can't act on.

**Acceptance Criteria:**
- [ ] In the task editor, I can select one or more blocking tasks from a search field
- [ ] A blocked task shows a chain icon on the canvas card
- [ ] When all blocking tasks are completed, the blocked task automatically transitions to `active`
- [ ] A notification fires when a blocked task is unblocked: "Ready: [task title]"

---

## 4. External Resources

---

### US-015: Link a web page to a task

**As a** user,  
**I want** to drag a URL onto a task card  
**so that** the task is directly linked to the reference material I need.

**Acceptance Criteria:**
- [ ] Dragging a URL from the browser address bar onto a task card adds it as a resource
- [ ] The resource shows the page title and favicon (fetched at link time)
- [ ] A short text snippet from the page is stored as a preview
- [ ] Clicking the resource opens the URL in the default browser
- [ ] The task card shows a resource count badge when resources are present

---

### US-016: Link a local file or folder to a task

**As a** user,  
**I want** to attach a file or folder path to a task  
**so that** I can open the relevant document directly from the task.

**Acceptance Criteria:**
- [ ] Dragging a file/folder from the OS file explorer onto a task card adds a resource
- [ ] The resource shows the file name, type icon, and last-modified date
- [ ] Clicking the resource opens the file with the default OS application
- [ ] File path is stored as a local URI; no file copy is made

---

### US-017: See a "context match" when working on a related resource

**As a** user,  
**I want** Pulse to highlight tasks related to what I'm currently working on  
**so that** I remember to do things that are relevant to what's in front of me.

**Acceptance Criteria:**
- [ ] When a URL linked to a task matches a URL in my browser's active tab (detected via user manually entering the URL in a Pulse field), a "context match" badge appears on that task card
- [ ] The badge is subtle and non-intrusive
- [ ] Context matching does not require browser integration; it is based on URIs already stored in the app

---

## 5. Memory Layer

---

### US-018: Browse completed tasks in the Memory Vault

**As a** user,  
**I want** to search and browse everything I've ever completed  
**so that** my past work is a resource, not a deletion.

**Acceptance Criteria:**
- [ ] Memory Vault is a dedicated view accessible from the top navigation
- [ ] All completed and archived tasks appear here, newest first
- [ ] Full-text search works across title, body, tags, and voice note transcripts
- [ ] Filters allow narrowing by: date range, project, tag, energy level
- [ ] Memory cards are read-only but show all original task data

---

### US-019: Revive a memory as a new active task

**As a** user,  
**I want** to "rebirth" a completed task  
**so that** I can reuse the full context of past work without starting from scratch.

**Acceptance Criteria:**
- [ ] Each memory card has a "Rebirth" action
- [ ] Rebirthing creates a new active task with all attributes copied (title, body, resources, tags, project) except status, completedAt, and position
- [ ] The new task appears on the canvas and the editor opens automatically
- [ ] The new task's `memoryEchoIds` field references the source memory

---

### US-020: See echoes of similar past tasks when creating a new one

**As a** user,  
**I want** to be shown similar tasks I've completed before while I'm typing a new task  
**so that** I don't re-do research or re-think approaches I've already worked through.

**Acceptance Criteria:**
- [ ] While typing a task title (≥3 words), up to 3 matching past tasks appear as "Echoes" below the input
- [ ] Matching is based on: word overlap in title, same tags, same project, or same linked domain
- [ ] Each echo shows: original title, completion date, and a 1-line body preview
- [ ] Clicking an echo expands it to show full details and offers "Copy body + resources to new task"
- [ ] Echoes can be dismissed per session; they don't block task creation

---

### US-021: See a daily Flashback of past accomplishments

**As a** user,  
**I want** to occasionally be reminded of something I completed in the past  
**so that** I feel the weight of my work history and stay motivated.

**Acceptance Criteria:**
- [ ] Once per day, on first app open, a Flashback card appears at the bottom of the canvas
- [ ] The Flashback references a task completed ≥30 days ago on or near the same calendar date
- [ ] The card shows: task title, completion date, and a short excerpt
- [ ] It is dismissible with one click
- [ ] If no matching past task exists, no Flashback is shown
- [ ] Flashbacks can be disabled in Settings

---

### US-022: Recognize behavioral patterns and get task suggestions

**As a** user,  
**I want** the app to notice when I tend to do the same kind of task repeatedly  
**so that** I'm prompted to create those tasks before I forget.

**Acceptance Criteria:**
- [ ] The system detects when a task type has been created ≥3 times on the same day of the week
- [ ] A suggestion card appears: "You often do [task pattern] on [day]. Create one now?"
- [ ] I can accept (creates the task), dismiss for today, or "Don't suggest this again"
- [ ] Suggestion cards appear at most once per day and are non-blocking
- [ ] Patterns can be disabled globally in Settings

---

### US-023: Track my productivity streak and momentum score

**As a** user,  
**I want** to see my current streak and momentum score  
**so that** I have lightweight positive reinforcement without it feeling like a game.

**Acceptance Criteria:**
- [ ] A streak counter (flame icon + number) is visible in the top bar
- [ ] Streak increments for each calendar day where at least one task was completed
- [ ] A momentum score (0–100) is shown adjacent to the streak
- [ ] The formula factors in: tasks completed today, this week, overdue count, and streak length
- [ ] Score is only compared to the user's own history, never external benchmarks
- [ ] If the streak breaks, the UI shows: "Streak paused. Start fresh today." — no shame, no drama
- [ ] Both metrics can be hidden in Settings

---

## 6. Voice Interface

---

### US-024: Capture a task by speaking

**As a** user,  
**I want** to create a task by speaking naturally  
**so that** I can capture ideas without breaking my flow to type.

**Acceptance Criteria:**
- [ ] Pressing `V` or clicking the microphone opens a full-screen voice capture overlay
- [ ] Real-time transcript appears on screen as I speak
- [ ] After a 1.5-second pause, capture ends automatically (or user presses `Esc`)
- [ ] Parsed task (title, deadline, project, energy) is shown as a preview with chips
- [ ] I can confirm with `Enter` or edit inline before confirming
- [ ] If recognition fails (no speech, API error), a clear error message appears with fallback to typed input

---

### US-025: Activate voice capture with a wake word (opt-in)

**As a** user who wants hands-free input,  
**I want** to say "Hey Pulse" to start capturing  
**so that** I can add tasks without touching the keyboard at all.

**Acceptance Criteria:**
- [ ] Ambient listening is off by default and must be explicitly enabled in Settings
- [ ] When enabled, the microphone icon in the toolbar shows an "active listening" state
- [ ] Saying "Hey Pulse" triggers the voice capture overlay
- [ ] The app shows a clear indicator when ambient listening is active
- [ ] Disabling the setting immediately stops all ambient listening

---

### US-026: Record a voice note on a task

**As a** user,  
**I want** to attach a voice note to a task  
**so that** I can quickly capture context, nuance, or rambling thoughts without typing.

**Acceptance Criteria:**
- [ ] Inside the task editor, a Voice Notes panel has a record button
- [ ] Recording captures audio and shows duration in real time
- [ ] After recording, a waveform player and auto-generated transcript appear
- [ ] I can record multiple voice notes per task
- [ ] Voice notes are stored locally (IndexedDB) — no uploads
- [ ] Transcripts are searchable in the Memory Vault

---

### US-027: Speak to query my task list

**As a** user,  
**I want** to ask "What do I have today?" out loud  
**so that** Pulse reads me my current tasks without me having to look at the screen.

**Acceptance Criteria:**
- [ ] Saying "What do I have today?" (or typing it in the command palette) triggers a readback
- [ ] The app uses speech synthesis to read all active tasks with today's deadline, then high-energy tasks without deadlines
- [ ] A visual list is shown simultaneously
- [ ] Readback can be interrupted with `Esc` or clicking "Stop"
- [ ] "What's my momentum?" reads out the current score and streak

---

### US-028: Extract tasks from free-form voice journaling

**As a** user who thinks out loud,  
**I want** to speak freely and have Pulse pull out action items  
**so that** I can do a brain dump and not lose any commitments buried in my thoughts.

**Acceptance Criteria:**
- [ ] If I speak for more than 3 continuous sentences, the app enters "journal mode"
- [ ] After capture, extracted candidate tasks are shown as a confirmation list
- [ ] Each candidate task can be accepted or dismissed individually
- [ ] Accepted tasks are created on the canvas with origin: `voice`
- [ ] The original transcript is stored as a Voice Note on the first created task
- [ ] If no actionable items are detected, the transcript is offered as a standalone note

---

## 7. Focus Mode

---

### US-029: Enter Focus Mode on a single task

**As a** user who needs to do deep work,  
**I want** to enter a full-screen Focus Mode on one task  
**so that** I can eliminate distractions and concentrate completely.

**Acceptance Criteria:**
- [ ] Double-clicking a task card enters Focus Mode
- [ ] Focus Mode takes over the full screen; all other UI elements are hidden
- [ ] The task title, body, and subtask checklist are displayed in a calm, high-contrast layout
- [ ] Pressing `Esc` exits Focus Mode
- [ ] On exit, a prompt appears: "Did you make progress?" with options: Yes (keep active), Done (mark complete), Need more time (snooze)

---

### US-030: Use a timer in Focus Mode

**As a** user,  
**I want** an optional timer in Focus Mode  
**so that** I can work in structured intervals (e.g., Pomodoro).

**Acceptance Criteria:**
- [ ] A timer appears in the corner of Focus Mode; it starts paused
- [ ] Default duration is 25 minutes (Pomodoro); configurable in Settings
- [ ] Timer can be started, paused, and reset
- [ ] When timer ends, a gentle audio/visual alert fires
- [ ] Timer is fully optional — I can use Focus Mode without it

---

### US-031: Play ambient sound in Focus Mode

**As a** user,  
**I want** to play ambient sound while in Focus Mode  
**so that** I can create an auditory focus environment.

**Acceptance Criteria:**
- [ ] A sound selector in Focus Mode offers: Silence, White Noise, Rain, Lo-fi (all local audio files)
- [ ] Selected sound plays on loop while Focus Mode is active
- [ ] Volume is independently controllable from the system volume
- [ ] Sound selection persists as a preference

---

### US-032: View linked resources during Focus Mode

**As a** user,  
**I want** access to my task's linked resources while in Focus Mode  
**so that** I don't have to exit to find my reference materials.

**Acceptance Criteria:**
- [ ] A collapsible "Resources" panel exists in Focus Mode
- [ ] Each resource can be opened (browser/app) directly from the panel
- [ ] The panel does not overlap the task content when collapsed
- [ ] Resource URLs can be previewed inline without leaving the app

---

## 8. Email & Calendar Integration

---

### US-033: Email a task summary to someone

**As a** user,  
**I want** to email a task's details to someone  
**so that** I can delegate work or share context without copy-pasting.

**Acceptance Criteria:**
- [ ] A "Share → Email" action is available in the task editor
- [ ] Clicking it opens Gmail (or default mail client) in a new tab
- [ ] The email is pre-filled with: subject `[Pulse Task] {title}`, body with description, deadline, and resource links
- [ ] The action does not require Gmail API authorization

---

### US-034: Create a task by forwarding an email

**As a** user,  
**I want** to forward an email to my Pulse inbox label  
**so that** emails I need to act on automatically become tasks.

**Acceptance Criteria:**
- [ ] In Settings, I can connect my Gmail account via OAuth (read + label management scopes)
- [ ] The app creates (or detects) a Gmail label named `pulse-inbox`
- [ ] The app polls this label every 5 minutes while open
- [ ] Any email in the label becomes a task: subject → title, body snippet → description, sender → email resource
- [ ] Processed emails are moved to a `pulse-processed` label
- [ ] The created task has origin: `email` and links to the original Gmail thread
- [ ] If Gmail is not connected, this feature is hidden

---

### US-035: Add a task to Google Calendar

**As a** user,  
**I want** to add a task with a deadline to my Google Calendar  
**so that** it appears on my calendar alongside meetings and events.

**Acceptance Criteria:**
- [ ] Any task with a deadline has an "Add to Calendar" button in the editor
- [ ] Clicking the button opens Google Calendar event creation pre-filled with task data
- [ ] Pre-fill includes: event title, date/time (1-hour block at deadline or all-day), and description
- [ ] This works without any OAuth (uses Google Calendar URL parameters)
- [ ] If Gmail OAuth is already connected, the event can be created in-app without opening a new tab, with an in-app confirmation shown

---

## 9. Command Palette

---

### US-036: Access any action via the command palette

**As a** user,  
**I want** a command palette that reaches any app action  
**so that** I never have to hunt through menus.

**Acceptance Criteria:**
- [ ] `Ctrl+K` opens the command palette from anywhere in the app
- [ ] The palette offers fuzzy search across: tasks, projects, actions, and Settings items
- [ ] Results include: matching active tasks, recent memories, and app commands
- [ ] Arrow keys navigate results; `Enter` executes; `Esc` closes
- [ ] Recently used commands appear at the top when the input is empty
- [ ] Voice capture can be triggered from the palette ("voice")

---

## 10. PWA & Offline

---

### US-037: Install Pulse as a desktop app

**As a** user,  
**I want** to install Pulse on my desktop  
**so that** it behaves like a native app with its own icon and window.

**Acceptance Criteria:**
- [ ] The browser shows an install prompt for the PWA
- [ ] After installation, Pulse appears in the OS taskbar/dock with a distinct icon
- [ ] Launching from the icon opens Pulse in a standalone window (no browser chrome)
- [ ] The installed app has a custom splash screen

---

### US-038: Use Pulse fully offline

**As a** user without internet access,  
**I want** all core features to work when I'm offline  
**so that** I can capture and manage tasks anywhere.

**Acceptance Criteria:**
- [ ] Creating, editing, completing, and snoozeing tasks works fully offline
- [ ] The canvas, Focus Mode, and Memory Vault are available offline
- [ ] Voice capture works offline (Web Speech API may degrade; fallback to typed input if unavailable)
- [ ] Features that require network (Gmail polling, URL preview fetching, Calendar link) are gracefully disabled with a clear "offline" indicator
- [ ] All data persists across browser/app restarts

---

## 11. Settings & Personalization

---

### US-039: Switch between light and dark themes

**As a** user,  
**I want** to choose between light, dark, and system-default themes  
**so that** the app matches my environment and preferences.

**Acceptance Criteria:**
- [ ] Settings → Theme offers: Light, Dark, System
- [ ] Theme changes apply immediately without a reload
- [ ] System theme automatically follows the OS dark/light mode setting

---

### US-040: Enable seasonal canvas themes

**As a** user,  
**I want** the canvas to subtly change with the seasons  
**so that** the app feels alive and connected to the real world.

**Acceptance Criteria:**
- [ ] In auto mode, the canvas theme shifts based on the current calendar month:
  - Dec–Feb: Winter (cool tones, sparse)
  - Mar–May: Spring (fresh, blooming accents)
  - Jun–Aug: Summer (bright, high contrast)
  - Sep–Nov: Autumn (warm amber/orange accents)
- [ ] Manual mode lets me pin a specific season regardless of date
- [ ] The seasonal theme affects: background texture, card accent colors, and subtle ambient particles (e.g., drifting leaves in autumn)
- [ ] Seasonal themes do not affect readability or accessibility

---

### US-041: Export and import all my data

**As a** user,  
**I want** to export all my tasks and memories as JSON  
**so that** my data is always portable and I'm never locked in.

**Acceptance Criteria:**
- [ ] Settings → Data Export downloads a JSON file of all tasks, memories, projects, and settings
- [ ] The JSON format is documented in an inline schema reference
- [ ] Settings → Data Import accepts a previously exported JSON file and restores all data
- [ ] Import shows a preview of what will be imported before confirming
- [ ] A conflict resolution option is offered: "Merge" or "Replace all"
