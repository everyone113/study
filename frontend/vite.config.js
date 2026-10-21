import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('peerjs')) {
              return 'vendor-peerjs'
            }
            if (id.includes('lucide-react') || id.includes('lucide')) {
              return 'vendor-lucide'
            }
            if (id.includes('framer-motion') || id.includes('animejs') || id.includes('gsap') || id.includes('canvas-confetti')) {
              return 'vendor-animation'
            }
            if (id.includes('vara')) {
              return 'vendor-vara'
            }
            if (id.includes('axios')) {
              return 'vendor-axios'
            }
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/drop': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/anatomy-data': {
        target: 'https://svitylo.com',
        changeOrigin: true
      }
    }
  }
})
