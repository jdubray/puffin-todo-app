# Feature: Voice Interface

Voice is not a convenience feature in Pulse — it is a primary input mode. The app is designed to be fully operable by voice for users who prefer it.

---

## Technology

| Component | Technology |
|---|---|
| Speech-to-text | Web Speech API (`SpeechRecognition`) |
| Text-to-speech | Web Speech Synthesis API (`SpeechSynthesisUtterance`) |
| Wake word detection | MediaRecorder + keyword matching (opt-in, local) |
| Audio storage | IndexedDB (Blob storage) |

The Web Speech API uses the browser's built-in speech recognition (Chrome/Edge connect to Google's servers; this is disclosed to users in settings). Voice notes audio is stored locally and never leaves the device.

**Fallback:** When the Web Speech API is unavailable (Firefox, offline), voice capture degrades gracefully to a text input with a warning: *"Voice recognition is unavailable in this browser. Type your note instead."*

---

## Voice Capture Overlay

The primary voice input UI. Activated by `V`, the toolbar mic button, or the wake word.

### Visual specification

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      ● Listening...                        │
│                                                             │
│           ████████████████████████████████                  │
│            (animated waveform visualization)               │
│                                                             │
│   "Review the proposal and send feedback to Ma..."         │
│    (real-time transcript in large, calm type)              │
│                                                             │
│   ┌──────────────┐                                         │
│   │  Confirming: │                                         │
│   │  Title: "Review the proposal and send feedback..."    │
│   │  Deadline: none detected                              │
│   │  Project: none detected                               │
│   └──────────────┘                                         │
│                                                             │
│              [Enter to confirm]  [Esc to cancel]           │
└─────────────────────────────────────────────────────────────┘
```

- Dark full-screen overlay (rgba 0,0,0,0.85)
- Waveform animation reflects actual audio amplitude in real time
- Transcript appears in real time, word by word, as recognized
- After 1.5s of silence: capture ends automatically, parsing begins
- Parse results show as a preview card with chips for detected fields
- User can edit any parsed field inline before confirming

---

## Natural Language Parsing

After voice capture, the transcript is parsed locally using rule-based pattern matching.

### Intent detection

The first pass determines what the user intended to do:

| Pattern | Intent | Example |
|---|---|---|
| Starts with imperative verb (add, create, make, remember, remind) | Create task | "Add: review the proposal by Thursday" |
| "Note on [keyword]:" | Add note to existing task | "Note on proposal: the client wants serif fonts" |
| "Complete [keyword]" | Mark task done | "Complete the proposal task" |
| "What do I have [today/this week]" | Readback query | "What do I have today?" |
| "What's my [momentum/streak/score]" | Stats query | "What's my streak?" |
| "Snooze [keyword] until [time]" | Snooze task | "Snooze the report until tomorrow morning" |
| > 3 continuous sentences, no clear imperative | Journal mode | Free-form thinking |

### Date/time extraction

Natural language date parsing (local, no external service):

| Expression | Parsed as |
|---|---|
| "today", "tonight" | today's date |
| "tomorrow" | tomorrow's date |
| "next [weekday]" | upcoming occurrence of that weekday |
| "this [weekday]" | nearest occurrence of that weekday |
| "in [N] days/weeks" | relative offset |
| "by Friday" | next Friday |
| "[month] [day]" | specific date in current/next year |
| "end of [week/month]" | last day of period |

If a time is specified ("at 3pm", "before noon"), it is added to the deadline datetime.

### Keyword extraction for task matching

For intents that reference existing tasks (note, complete, snooze), the spoken keyword is matched against:
1. Exact title match
2. Partial title match (contains ≥2 consecutive words)
3. Tag match
4. Project name match

If multiple tasks match, a selection list is shown: *"Which task? I found 3 matches:"*

---

## Journal Mode

Triggered when the transcript exceeds 3 sentences without a clear imperative structure.

### Candidate task extraction

Action candidate detection uses simple local heuristics:
1. Split transcript into sentences
2. For each sentence, check if it contains:
   - An action verb (call, email, review, check, send, write, fix, schedule, book, prepare, follow up, update, create, look into, find, research...)
   - AND a clear object (what the action is on)
3. Sentences that meet both criteria are candidate tasks

Example transcript:
> "So I've been thinking about the conference coming up. I still need to book the hotel. Also, Marcus mentioned I should send him the updated slides before the end of the week. And I want to look into that new scheduling tool we talked about."

Extracted candidates:
- "Book the hotel" ✓
- "Send Marcus the updated slides" (deadline: end of week) ✓
- "Look into the new scheduling tool" ✓

### Journal mode UI

```
┌────────────────────────────────────────────────────────────┐
│ ◎ I found 3 possible tasks in what you said               │
│                                                            │
│  ☑  Book the hotel                            [Accept ✓]  │
│  ☑  Send Marcus the updated slides — Fri      [Accept ✓]  │
│  ☑  Look into the new scheduling tool         [Accept ✓]  │
│                                                            │
│  [Accept all]                         [Dismiss all]        │
│                                                            │
│  Original note saved ↓                                     │
└────────────────────────────────────────────────────────────┘
```

- All candidates are pre-selected; user deselects unwanted ones
- "Accept all" creates all selected tasks; "Dismiss all" creates none
- The original transcript is always saved as a Voice Note on the first created task, regardless of accepted candidates
- If no candidates are found: transcript is offered as a standalone note attached to a new "unsorted" task

---

## Voice Notes on Tasks

Every task can have zero or more voice notes attached.

### Recording flow
1. Open task editor → Voice Notes section → click record button
2. A compact waveform recorder appears inline
3. Stop recording via stop button or `Esc`
4. Audio is stored locally; transcription begins immediately
5. Once transcribed, the voice note shows: duration, waveform player, transcript

### Voice note player UI (inline in editor)
```
  ▶  ──────────────────────── 0:34
  "The client specifically mentioned they want..."
  [Show full transcript ▼]                [Delete]
```

### Storage
- Audio stored as Blob in IndexedDB `voiceNotes` blob store
- Transcript stored as text in the VoiceNote record
- Voice notes are preserved when a task becomes a memory

---

## Voice Readback

The app can read back tasks using the Web Speech Synthesis API.

### Trigger phrases
- "What do I have today?" → reads today's active tasks
- "What do I have this week?" → reads all tasks with deadlines this week
- "What's my momentum?" → reads score + streak
- "Read my tasks" → same as "What do I have today?"

### Readback voice
- Default: English (US), "calm" feminine voice (when available via OS)
- Language follows the voice recognition language setting
- Speaking rate: 0.9× (slightly slower than natural for clarity)

### Readback format (spoken)
> *"You have 3 tasks for today. First: Review the Q2 proposal, high energy. Second: Call Marcus, no specific deadline. Third: Send invoice to Acme Corp, due at 5pm. That's everything for today. Your momentum score is 72, streak: 4 days."*

A visual list of items being read is shown simultaneously, with each item highlighted as it is spoken.

---

## Ambient Listening (Wake Word)

An opt-in feature that keeps the microphone active in the background so the user can trigger voice capture without interacting with the app.

### Implementation
- Uses `SpeechRecognition` in continuous mode
- Searches the transcript for the phrase "hey pulse" (case-insensitive, with tolerance for variations: "a pulse", "hey pulse", "ok pulse")
- On detection: triggers the voice capture overlay and plays a subtle audio chime
- Only the transcript scanning is active; no audio is stored during ambient listening

### Privacy disclosures (shown in Settings)
> "Ambient listening uses your browser's built-in speech recognition. In Chrome and Edge, audio may be processed by Google. No audio data is stored by Pulse during ambient listening. Voice capture recordings are stored only on your device."

### Settings controls
- Toggle: enabled / disabled
- Status indicator: visible in the toolbar (animated dot when active)
- Automatic disable when battery level falls below 20% (if Battery Status API is available)
