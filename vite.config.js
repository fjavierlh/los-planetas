import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/los-planetas/",
  build: {
    rollupOptions: {
      external: ["@mediapipe/face_mesh", "@tensorflow/tfjs"]
    }
  },
  optimizeDeps: {
    include: ["@mediapipe/face_mesh", "@tensorflow/tfjs"]
  }
})