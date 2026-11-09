import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: [resolve(__dirname, 'node_modules')],
        // Usar API moderna de Sass
        api: 'modern-compiler',
        // Silenciar warnings de deprecación de Sass
        silenceDeprecations: ['mixed-decls', 'legacy-js-api', 'import', 'global-builtin', 'color-functions'],
        quietDeps: true,
      },
    },
  },
})
