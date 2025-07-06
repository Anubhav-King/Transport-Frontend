import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
  },
});
