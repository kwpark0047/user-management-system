import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI 아이콘
          'vendor-icons': ['lucide-react'],
          // 유틸리티
          'vendor-utils': ['axios', 'socket.io-client'],
          // PDF 생성
          'vendor-pdf': ['jspdf'],
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
