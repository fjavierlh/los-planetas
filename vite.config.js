import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/los-planetas/",
  build: {
    rollupOptions: {
      external: ["@mediapipe/face_mesh"]
    }
  },
  optimizeDeps: {
    include: ["@mediapipe/face_mesh"]
  }
})