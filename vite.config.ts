import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // dev server: don't let browsers (mobile Safari) reuse cached pages → a refresh always gets the latest code
  server: { headers: { 'Cache-Control': 'no-store' } },
})
