import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/puffin-todo-app/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      strategies: 'injectManifest',
      srcDir: 'src/workers',
      filename: 'sw.js',
      manifest: {
        name: 'Pulse',
        short_name: 'Pulse',
        description: 'A personal, local-first task manager',
        display: 'standalone',
        start_url: '/',
        background_color: '#0f0f0f',
        theme_color: '#0f0f0f',
        launch_handler: { client_mode: 'focus-existing' },
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        shortcuts: [
          { name: 'New Task',      short_name: 'New Task', url: '/?action=new-task',  description: 'Quickly create a new task' },
          { name: 'Voice Capture', short_name: 'Voice',    url: '/?action=voice',     description: 'Capture by voice' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['dexie', 'chrono-node']
        }
      }
    }
  }
});
