# Feature: External Resources

Tasks in Pulse don't exist in isolation. Real work happens across browsers, documents, folders, and applications. External resources let tasks reach into the world they're about.

---

## Why Resources Matter

A task without context forces you to remember everything about it in your head. Where was that document? Which URL was I looking at? What folder holds the assets?

A task with linked resources is a self-contained work unit. You open it and the world is already there.

---

## Supported Resource Types

| Type | Icon | What it connects to |
|---|---|---|
| `url` | Favicon or globe | Any web page, web app, online document |
| `file` | File type icon | Local file (PDF, Word, Excel, image, etc.) |
| `folder` | Folder icon | Local directory |
| `app` | App icon | Any desktop application (via custom URI) |
| `email` | Envelope | A specific Gmail thread |
| `calendarEvent` | Calendar | A Google Calendar event |

---

## Adding Resources

### Method 1: Drag and drop (primary)

**URL from browser:**
- Drag the URL from the browser address bar, a link on the page, or a bookmark onto a task card
- The card briefly highlights on hover to confirm the drop zone
- Resource is added; page title and favicon are fetched asynchronously

**File or folder from OS:**
- Drag any file or folder from the OS file explorer onto a task card
- File path stored as a `file://` URI
- File name, extension, and last-modified date shown in resource card

**Text snippet from browser:**
- Select text on a webpage, drag it onto a task card
- Creates a URL resource for the page + stores the selected snippet as the preview

### Method 2: Paste detection

When the user pastes a URL while the task editor is open:
- A prompt appears: *"Add this URL as a resource? [Yes] [No] [Paste as text]"*
- Timeout: prompt disappears after 4 seconds; defaults to "paste as text"

### Method 3: Manual entry

In the task editor's Resources panel:
- "Add resource" button opens a row with:
  - Type selector (URL / File / Folder / App / Email / Calendar Event)
  - URI input field
  - Title input (auto-suggested from URI, editable)
- Press Enter or click ✓ to confirm

### Method 4: Right-click task on canvas

Right-click → "Add Resource" → opens a mini picker with the same fields as manual entry.

---

## Resource Display

### On the task card (canvas)
A resource badge in the top-right corner of the card:
- `[📎2]` — shows the count; icon is a paperclip for mixed types, or the type icon if all resources are the same type
- On hover: a tooltip shows the first 3 resource titles

### In the task editor (Resources panel)

Each resource shown as a preview card:

**URL resource:**
```
┌────────────────────────────────────────────────────┐
│  [favicon]  Page Title Here                [↗] [✕] │
│  example.com · "The first paragraph of the page..." │
└────────────────────────────────────────────────────┘
```

**File resource:**
```
┌────────────────────────────────────────────────────┐
│  [PDF icon]  Q2-Proposal-FINAL.pdf        [↗] [✕] │
│  ~/Documents/Projects · 2.4 MB · Modified Apr 1   │
└────────────────────────────────────────────────────┘
```

**Email resource:**
```
┌────────────────────────────────────────────────────┐
│  [envelope]  Re: Contract terms            [↗] [✕] │
│  From: marcus@acme.com · Mar 28, 2026              │
└────────────────────────────────────────────────────┘
```

- `↗` opens the resource in the appropriate app/browser
- `✕` removes the resource from the task (does not affect the original file/URL)

---

## Opening Resources

| Resource type | Opens with |
|---|---|
| `url` | `window.open(uri, '_blank')` |
| `file` | `window.open('file://...')` — OS handles the app |
| `folder` | `window.open('file://...')` — OS opens file explorer |
| `app` | `window.open(deepLink)` — app URI scheme |
| `email` | Gmail thread URL in new tab |
| `calendarEvent` | Google Calendar event URL in new tab |

**File/folder URI note:** Browser security policies prevent arbitrary `file://` URI launching in some environments. In the installed PWA context (standalone window), this works on most OSes. If it fails, the app shows the full file path in a copyable text field: *"Could not open file directly. Path copied to clipboard."*

---

## URL Metadata Fetching

When a URL resource is added, Pulse attempts to fetch its metadata to populate the title and preview snippet.

**Process:**
1. Attempt direct fetch (same-origin or CORS-allowed)
2. If blocked by CORS: fall back to a local proxy-less approach — parse what's already available from the dropped URL string
3. The favicon is fetched from `{origin}/favicon.ico` as a fallback if not resolved from the HTML

**Since this is a local-first PWA with no backend:**
- Metadata fetching only succeeds for pages that allow CORS (many public pages do not)
- When fetch is blocked: URL stored with `title = URL hostname` and no snippet
- User can manually edit the title and snippet in the resource editor

**Privacy:** No metadata is fetched unless the user explicitly adds the resource. No browsing history is tracked.

---

## Resource Lens (Filter)

In the Memory Vault and on the canvas, resources can be used as a filter:

- Click a resource type icon in the filter bar → show only tasks/memories with that resource type
- Enter a domain (e.g., "notion.so") → show only tasks with resources from that domain
- Click a specific resource chip on any task → show all tasks that link to the same domain

This allows answering questions like: *"What did I do with all those Figma links?"* or *"Show me everything related to the docs I was reading at microsoft.com."*

---

## Resource Reuse

When a user opens the task editor and starts typing a URL or file path they've used before:
- An autocomplete dropdown shows previously used resources matching the input
- Selecting one adds the resource to the current task without re-fetching metadata (already cached)
- "Most used resources" are shown in the autocomplete when the field is focused but empty

---

## Limitations (v1.0)

| Limitation | Notes |
|---|---|
| No inline preview pane | Resources open externally; no iframe embed for security and complexity reasons |
| No automatic broken link detection | Dead URLs are not auto-detected; user must notice manually |
| No file monitoring | The app does not watch for file changes; resource metadata is point-in-time |
| No browser extension | Context-match feature (§3.4 of functional-spec.md) requires manual URL entry rather than automatic tab detection |
| App deep links | Must be manually entered; no app picker UI |
