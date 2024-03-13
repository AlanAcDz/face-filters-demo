import { defineConfig } from 'vite'
import { mediapipe } from 'vite-plugin-mediapipe'

// Issue https://github.com/google/mediapipe/issues/2883
export default defineConfig({
    plugins: [mediapipe({ 'selfie_segmentation.js': ['SelfieSegmentation'] })],
})
