import { defineConfig } from 'vite'

// Issue https://github.com/google/mediapipe/issues/2883
function mediapipe() {
    return {
        name: 'mediapipe',
        load(id) {
            if (path.basename(id) === 'selfie_segmentation.js') {
                let code = fs.readFileSync(id, 'utf-8')
                code += 'exports.SelfieSegmentation = SelfieSegmentation;'
                return { code }
            } else {
                return null
            }
        },
    }
}

export default defineConfig({
    build: {
        rollupOptions: {
            plugins: [mediapipe()],
        },
    },
})
