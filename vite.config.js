import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    // Ensures direct URL visits like /fruit don't 404 in dev
    historyApiFallback: true,
  },

  build: {
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core — smallest possible critical chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // Router — deferred, only needed after hydration
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // Axios — deferred, only needed on API calls
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          // Icons — tree-shaken by Vite but isolated so it doesn't bloat vendor
          if (id.includes('node_modules/react-icons')) {
            return 'react-icons';
          }
          // Everything else in node_modules → single vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
