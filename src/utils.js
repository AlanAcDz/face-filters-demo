function getSizeFromImageLikeElement(input) {
    if (
        'offsetHeight' in input &&
        input.offsetHeight !== 0 &&
        'offsetWidth' in input &&
        input.offsetWidth !== 0
    ) {
        return [input.offsetHeight, input.offsetWidth]
    } else if (input.height != null && input.width != null) {
        return [input.height, input.width]
    } else {
        throw new Error(`HTMLImageElement must have height and width attributes set.`)
    }
}

function getSizeFromVideoElement(input) {
    if (input.hasAttribute('height') && input.hasAttribute('width')) {
        // Prioritizes user specified height and width.
        // We can't test the .height and .width properties directly,
        // because they evaluate to 0 if unset.
        return [input.height, input.width]
    } else {
        return [input.videoHeight, input.videoWidth]
    }
}

export function getInputSize(input) {
    if (
        (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) ||
        (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas) ||
        (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement)
    ) {
        return getSizeFromImageLikeElement(input)
    } else if (typeof ImageData !== 'undefined' && input instanceof ImageData) {
        return [input.height, input.width]
    } else if (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) {
        return getSizeFromVideoElement(input)
    } else {
        throw new Error(`error: Unknown input type: ${input}.`)
    }
}
