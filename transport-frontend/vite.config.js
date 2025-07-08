// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Transport Duty System',
        short_name: 'TransportDuty',
        description: 'Manage hotel transport duties efficiently',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    allowedHosts: [
      'transport-frontend.testingking.repl.co',
      'f71e836d-dc97-4be6-b3bd-50a2f09f1400-00-2jqr49q6frhut.pike.replit.dev',
      '99b07d40-3487-4b49-8517-cc41ff316ec1-00-3d5ciy6va37cc.sisko.replit.dev'
    ],
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    allowedHosts: [
      'transport-frontend.testingking.repl.co',
      'f71e836d-dc97-4be6-b3bd-50a2f09f1400-00-2jqr49q6frhut.pike.replit.dev',
      '99b07d40-3487-4b49-8517-cc41ff316ec1-00-3d5ciy6va37cc.sisko.replit.dev'
    ],
  }
});
