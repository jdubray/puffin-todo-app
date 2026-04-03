# Feature: Email & Calendar Integration

Pulse integrates with Gmail and Google Calendar to let tasks flow bidirectionally between your inbox, your schedule, and your task canvas.

---

## Integration Overview

| Direction | Feature | Requires OAuth? |
|---|---|---|
| Task → Email | Share task summary as a Gmail draft | No (opens Gmail in browser) |
| Email → Task | Forward email to create a task | Yes (Gmail read + label scope) |
| Task → Calendar | Add task as a calendar event | No (uses URL params) |
| Task → Calendar (direct) | Create event in-app | Yes (Calendar write scope, if Gmail is connected) |

OAuth is entirely optional. The first two features (no OAuth) work out of the box.

---

## Feature 1: Share a Task as Email (Outbound, No Auth)

Any task can be shared as an email with one click.

### User flow
1. Open task editor
2. Click "Share" → "Email"
3. A new Gmail compose window opens in the browser with fields pre-filled

### Pre-filled fields

**Subject:**
```
[Pulse Task] {task.title}
```

**Body:**
```
Task: {task.title}
Deadline: {task.deadline formatted as "Monday, April 7, 2026 at 3:00 PM"} | None
Energy: {task.energy}
Project: {project.name} | —

---
{task.body (markdown rendered as plain text)}

Resources:
• {resource.title}: {resource.uri}
• ...

---
Sent from Pulse
```

### Implementation
Uses the Gmail compose URL:
```
https://mail.google.com/mail/?view=cm&fs=1&su={subject}&body={body}
```

No authentication, no API calls, no data leaves the app. The user's browser handles the rest.

---

## Feature 2: Create Task from Forwarded Email (Inbound, OAuth Required)

The most powerful integration: forward any email to a Gmail label and it becomes a Pulse task automatically.

### Setup flow

1. User navigates to Settings → Integrations → Gmail
2. Clicks "Connect Gmail"
3. Standard Google OAuth consent screen (scopes: `gmail.readonly`, `gmail.labels`)
4. On success: access token and refresh token stored encrypted in localStorage
5. App automatically creates (or identifies) a Gmail label named `pulse-inbox`
6. User instruction shown:
   > *"To create a task from an email, apply the 'pulse-inbox' label to it in Gmail, or forward it to any address and add the label manually. Pulse checks for new tasks every 5 minutes."*

### Polling mechanism

- Polling runs every 5 minutes **only while the app is open**
- Uses the Gmail API: `messages.list` with `labelIds=["pulse-inbox"]`
- New messages (not in `pulse-processed`) are fetched and parsed

### Email-to-task parsing

| Email field | Maps to |
|---|---|
| Subject | `task.title` |
| Body (first 500 chars, plain text) | `task.body` |
| From address + name | Resource of type `email` |
| Message-ID → Gmail thread URL | Resource URI |
| Date received | `task.createdAt` |

**Subject cleaning:**
- Strips common prefixes: `Re:`, `Fwd:`, `[Pulse Task]` (to avoid looping on shared tasks)
- Strips leading/trailing whitespace

### Post-processing
- Label `pulse-inbox` removed from message
- Label `pulse-processed` added to message (created if not present)
- The created task shows `origin: 'email'`

### Error handling
- OAuth token expired → silent refresh attempt; if fails, show "Gmail disconnected" banner
- API rate limit hit → skip this poll cycle; retry on next
- Email with no subject → task title becomes "(No subject)"
- Parsing failure → task created with title = email subject, body = "[Could not parse email body]"

### Disconnect
Settings → Integrations → Gmail → "Disconnect"
- Revokes OAuth token via Google's revoke endpoint
- Clears stored token from localStorage
- Polling stops immediately
- Gmail labels created by Pulse are NOT deleted (user may want to keep them)

---

## Feature 3: Add Task to Google Calendar (No Auth)

A task with a deadline can be added to Google Calendar via a URL launch — no API key or login required.

### User flow
1. Open task editor for a task with a deadline
2. Click "Add to Calendar" button (visible only when deadline is set)
3. Google Calendar opens in a new tab with the event pre-filled
4. User reviews and saves the event in Google Calendar

### Pre-filled event fields

| Calendar field | Source |
|---|---|
| Title | `task.title` |
| Start time | `task.deadline` |
| End time | `task.deadline + 1 hour` (or same day if no time set) |
| Description | `task.body` + resource URLs |
| Location | (empty) |

### Implementation

Uses the Google Calendar event URL:
```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text={title}
  &dates={startISO}/{endISO}
  &details={description}
```

All-day events use date-only ISO format (`20260407`) instead of datetime.

---

## Feature 4: Create Calendar Event In-App (OAuth, Direct)

If Gmail OAuth is already connected, Pulse can create the calendar event directly via the Google Calendar API without opening a new tab.

### Trigger condition
- Gmail OAuth is connected (implicitly provides Calendar access if the user consents)
- User has a valid Calendar API scope (requested during OAuth, user must accept)
- The task has a deadline

### Flow
1. User clicks "Add to Calendar" 
2. Because OAuth is active, instead of opening a new tab, an in-app dialog appears:

```
┌─────────────────────────────────────────────────────┐
│  Add to Google Calendar                             │
│                                                     │
│  Title:  Review Q2 proposal                        │
│  Date:   Monday, April 7, 2026                     │
│  Time:   [ 3:00 PM  ▼ ] to [ 4:00 PM  ▼ ]        │
│  Calendar: [ Primary  ▼ ]                          │
│                                                     │
│  [Add Event]                  [Open in Calendar]   │
└─────────────────────────────────────────────────────┘
```

3. Clicking "Add Event" makes a POST to the Calendar API
4. Success: a toast fires and the event URL is stored as a resource on the task (type: `calendarEvent`)
5. Clicking "Open in Calendar" falls back to the URL approach (Feature 3)

### Calendar scopes
- Requested: `calendar.events` (write access to create events)
- The OAuth consent screen must clearly describe this to the user
- Scope is additive: we request both Gmail and Calendar scopes in a single consent flow if the user connects from Settings

---

## OAuth Security Notes

- Access tokens are stored in localStorage with a simple XOR obfuscation (not encryption — see note below)
- Refresh tokens are also stored locally; Google's token lifespan applies
- **Security consideration:** localStorage is accessible to any script on the same origin. Since this is a PWA with no CDN-injected third-party scripts, the risk is low. Future versions should consider storing tokens in a service worker's isolated scope or using PKCE with short-lived tokens only.
- Token scope is minimal (read-only Gmail + label management + Calendar events write)
- Users can revoke access at any time from Google Account settings or from Pulse Settings

---

## Offline Behavior

| Feature | Offline behavior |
|---|---|
| Share as email | Disabled; button grayed out with "Requires internet" tooltip |
| Email polling | Paused; resumes automatically when connection restored |
| Add to Calendar (URL) | Disabled; button grayed out |
| Add to Calendar (direct) | Disabled; button grayed out |

A connection status indicator in the toolbar shows current online/offline state.
