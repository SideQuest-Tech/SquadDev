import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Enables @/components/ui/... imports throughout the project
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
