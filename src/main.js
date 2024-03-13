import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import '@mediapipe/selfie_segmentation'
import './style.css'

const video = document.getElementById('webcam')
const liveView = document.getElementById('liveView')
const demosSection = document.getElementById('demos')
const webcamCanvas = document.createElement('canvas')
const ctx = webcamCanvas.getContext('2d')
const enableWebcamButton = document.getElementById('webcamButton')
const backgroundImage = new Image(640, 480)
backgroundImage.src = 'background.jpg'

// Let's load the model with our parameters defined above.
// Before we can use bodypix class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
let modelHasLoaded = false
let model = undefined

model = bodySegmentation
    .createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, {
        runtime: 'mediapipe',
        modelType: 'general',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747`,
    })
    .then((loadedModel) => {
        model = loadedModel
        modelHasLoaded = true
        // Show demo section now model is ready to use.
        demosSection.classList.remove('invisible')
    })

let previousSegmentationComplete = true

// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// This function will repeatidly call itself when the browser is ready to process
// the next frame from webcam.
async function predictWebcam() {
    if (previousSegmentationComplete) {
        previousSegmentationComplete = false
        // Now classify the canvas image we have available.
        const segmentation = await model.segmentPeople(video, {
            flipHorizontal: false,
        })
        const mask = await bodySegmentation.toBinaryMask(
            segmentation,
            { r: 0, g: 0, b: 0, a: 0 },
            { r: 0, g: 0, b: 0, a: 255 },
            false,
            0.65
        )
        ctx.putImageData(mask, 0, 0)
        ctx.globalCompositeOperation = 'source-in'
        ctx.drawImage(backgroundImage, 0, 0, webcamCanvas.width, webcamCanvas.height)
        ctx.globalCompositeOperation = 'destination-over'
        ctx.drawImage(video, 0, 0, webcamCanvas.width, webcamCanvas.height)
        ctx.globalCompositeOperation = 'source-over'
        // const opacity = 1
        // const maskBlurAmount = 5
        // const flipHorizontal = false
        // bodySegmentation.drawMask(
        //     webcamCanvas,
        //     backgroundImage,
        //     bgMask,
        //     opacity,
        //     maskBlurAmount,
        //     flipHorizontal
        // )
        previousSegmentationComplete = true
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam)
}

// Enable the live webcam view and start classification.
async function enableCam(event) {
    if (!modelHasLoaded) {
        return
    }

    // Hide the button.
    event.target.classList.add('removed')

    // Activate the webcam stream.
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.addEventListener('loadedmetadata', () => {
        // Update widths and heights once video is successfully played otherwise
        // it will have width and height of zero initially causing classification
        // to fail.
        webcamCanvas.width = video.videoWidth
        webcamCanvas.height = video.videoHeight
    })
    video.srcObject = stream
    video.addEventListener('loadeddata', predictWebcam)
}

// Lets create a canvas to render our findings to the DOM.
webcamCanvas.setAttribute('class', 'overlay')
liveView.appendChild(webcamCanvas)

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton.addEventListener('click', enableCam)
} else {
    console.warn('getUserMedia() is not supported by your browser')
}
