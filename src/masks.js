import { getInputSize } from './utils'

const backgroundImage = new Image(640, 480)
backgroundImage.src = 'background.jpg'
// const offScreenCanvases: { [name: string]: Canvas } = {}
const offScreenCanvases = {}
const CANVAS_NAMES = {
    blurred: 'blurred',
    blurredMask: 'blurred-mask',
    mask: 'mask',
    lowresPartMask: 'lowres-part-mask',
}

function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function ensureOffscreenCanvasCreated(id = '') {
    if (!offScreenCanvases[id]) {
        offScreenCanvases[id] = document.createElement('canvas')
    }
    return offScreenCanvases[id]
}

function renderImageDataToOffScreenCanvas(image, canvasName = '') {
    const canvas = ensureOffscreenCanvasCreated(canvasName)
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(image, 0, 0)
    return canvas
}

function cpuBlur(canvas, image, blur) {
    const ctx = canvas.getContext('2d')
    let sum = 0
    const delta = 5
    const alphaLeft = 1 / (2 * Math.PI * delta * delta)
    const step = blur < 3 ? 1 : 2
    for (let y = -blur; y <= blur; y += step) {
        for (let x = -blur; x <= blur; x += step) {
            const weight = alphaLeft * Math.exp(-(x * x + y * y) / (2 * delta * delta))
            sum += weight
        }
    }
    for (let y = -blur; y <= blur; y += step) {
        for (let x = -blur; x <= blur; x += step) {
            ctx.globalAlpha =
                ((alphaLeft * Math.exp(-(x * x + y * y) / (2 * delta * delta))) / sum) * blur
            ctx.drawImage(image, x, y)
        }
    }
    ctx.globalAlpha = 1
}

function drawAndBlurImageOnCanvas({ image, blurAmount, canvas }) {
    const { height, width } = image
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    if (isSafari()) {
        cpuBlur(canvas, image, blurAmount)
    } else {
        ctx.filter = `blur(${blurAmount}px)`
        ctx.drawImage(image, 0, 0, width, height)
        ctx.filter = 'none'
    }
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(backgroundImage, 0, 0, width, height)
    ctx.globalCompositeOperation = 'destination-over'
    ctx.restore()
}

function drawAndBlurImageOnOffScreenCanvas({ image, blurAmount, offscreenCanvasName }) {
    const canvas = ensureOffscreenCanvasCreated(offscreenCanvasName)
    if (blurAmount === 0) {
        const { width, height } = image
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0, width, height)
    } else {
        drawAndBlurImageOnCanvas({ image, blurAmount, canvas })
    }
    return canvas
}

export function drawMask({ canvas, image, maskImage, maskOpacity = 0.7, maskBlurAmount = 0 }) {
    const [height, width] = getInputSize(image)
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.drawImage(image, 0, 0)
    ctx.globalAlpha = maskOpacity
    if (maskImage) {
        const mask = renderImageDataToOffScreenCanvas(maskImage, CANVAS_NAMES.mask)
        const blurredMask = drawAndBlurImageOnOffScreenCanvas({
            image: mask,
            blurAmount: maskBlurAmount,
            offscreenCanvasName: CANVAS_NAMES.blurredMask,
        })
        ctx.drawImage(blurredMask, 0, 0, width, height)
    }
    ctx.restore()
}
