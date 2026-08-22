import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/' is the default — matches IIS serving from root
  base: '/',
  server: {
    // Local dev server settings (not used in production)
    host: '0.0.0.0',
    port: 5173,
  }
})

