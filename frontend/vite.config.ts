import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ...(process.env.VERCEL
    ? { define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') } }
    : {}),
})
