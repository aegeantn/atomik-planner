import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    // Tailwind v4 — config CSS içinde @theme ile yönetilir, tailwind.config.js gerekmez
    tailwindcss(),
    react(),
  ],
  server: {
    // /api isteklerini Express sunucusuna yönlendir
    // Böylece client kodunda URL'yi tam yazmak gerekmez: fetch('/api/identities')
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
