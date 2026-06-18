import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/saborsan-app/',
  server: {
    port: 5173
  }
})
