import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5294', // HTTP port of API
        changeOrigin: true,
        secure: false, // Don't verify SSL for localhost
      },
      '/hubs': {
        target: 'http://localhost:5294',
        changeOrigin: true,
        ws: true, // Enable Websocket support for SignalR
        secure: false,
      }
    }
  }
})
