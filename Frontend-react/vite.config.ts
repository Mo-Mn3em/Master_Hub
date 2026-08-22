import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base path ensures assets load whether URL is /PCC or /PCC/
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})

