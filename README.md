# Pulse

A local-first desktop PWA task manager — personal, fun to use, and built for productivity.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

## Getting Started

```bash
npm install
npm run dev
```

Then open your browser at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

## Tech Stack

- **Vite** — build tool and dev server
- **Dexie** — IndexedDB wrapper for local-first storage
- **Workbox** — PWA/service worker support
- **chrono-node** — natural language date parsing
- **Vitest** — unit testing
- **Playwright** — end-to-end testing
