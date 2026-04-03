/**
 * @module sw
 * @description Workbox Service Worker entry point.
 * Handles precaching, runtime strategies, and background Gmail sync.
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
// Injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST ?? []);
cleanupOutdatedCaches();

// ── Runtime caching strategies ────────────────────────────

// App shell (HTML/JS/CSS): stale-while-revalidate
registerRoute(
  ({ request }) => ['document', 'script', 'style'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'app-shell' })
);

// Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({ cacheName: 'google-fonts-webfonts' })
);

// Gmail API: never cache
registerRoute(
  ({ url }) => url.hostname === 'gmail.googleapis.com',
  new NetworkFirst({ cacheName: 'gmail-api', networkTimeoutSeconds: 10 })
);

// ── Background sync: Gmail poll ───────────────────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'gmail-poll') {
    event.waitUntil(_pollGmailAndNotifyClients());
  }
});

// ── Message handler: client → SW ─────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Install / activate ────────────────────────────────────

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Private ───────────────────────────────────────────────

const _pollGmailAndNotifyClients = async () => {
  // The SW doesn't have access to the app's OAuth token directly.
  // Post a message to the active client to trigger the poll there.
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach(client => client.postMessage({ type: 'GMAIL_POLL_REQUEST' }));
};
