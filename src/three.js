import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { TRIANGULATION } from './triangulation'

const liveView = document.getElementById('liveView')
const overlay = document.createElement('canvas')
const renderer = new THREE.WebGLRenderer({
    canvas: overlay,
    alpha: true,
})
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
const scene = new THREE.Scene()
let model3D

function loadModel(file) {
    return new Promise((res, rej) => {
        const loader = new GLTFLoader()
        loader.load(
            file,
            function (gltf) {
                res(gltf.scene)
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            function (error) {
                console.log(error)
                rej(error)
            }
        )
    })
}

export async function setupScene(video) {
    const { videoWidth, videoHeight } = video
    overlay.width = video.videoWidth
    overlay.height = video.videoHeight
    overlay.setAttribute('class', 'overlay')
    liveView.appendChild(overlay)

    camera.position.x = videoWidth / 2
    camera.position.y = -videoHeight / 2
    camera.position.z = -(videoHeight / 2) / Math.tan(45 / 2) // distance to z should be tan( fov / 2 )

    scene.add(new THREE.AmbientLight(0xcccccc, 0.4))
    camera.add(new THREE.PointLight(0xffffff, 0.8))
    scene.add(camera)

    camera.lookAt({ x: videoWidth / 2, y: -videoHeight / 2, z: 0, isVector3: true })
    // Glasses from https://sketchfab.com/3d-models/heart-glasses-ef812c7e7dc14f6b8783ccb516b3495c
    model3D = await loadModel('model/scene.gltf')
    scene.add(model3D)
    return scene
}

const drawMesh = (prediction, ctx) => {
    if (!prediction) return
    const keyPoints = prediction.keypoints
    if (!keyPoints) return
    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
        const points = [
            TRIANGULATION[i * 3],
            TRIANGULATION[i * 3 + 1],
            TRIANGULATION[i * 3 + 2],
        ].map((index) => keyPoints[index])
        drawPath(ctx, points, true)
    }
    for (let keyPoint of keyPoints) {
        ctx.beginPath()
        ctx.arc(keyPoint.x, keyPoint.y, 1, 0, 3 * Math.PI)
        ctx.fillStyle = 'aqua'
        ctx.fill()
    }
}

const drawPath = (ctx, points, closePath) => {
    const region = new Path2D()
    region.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
        const point = points[i]
        region.lineTo(point.x, point.y)
    }
    if (closePath) region.closePath()
    ctx.stokeStyle = 'black'
    ctx.stroke(region)
}

export async function trackFace(canvas, faces = []) {
    // renderer.render(scene, camera)
    const context = canvas.getContext('2d')

    for (const face of faces) {
        drawMesh(face, context)
        // Draw the bounding box

        // glasses.position.x = face.annotations.midwayBetweenEyes[0][0]
        // glasses.position.y = -face.annotations.midwayBetweenEyes[0][1]
        // glasses.position.z = -camera.position.z + face.annotations.midwayBetweenEyes[0][2]

        // // Calculate an Up-Vector using the eyes position and the bottom of the nose
        // glasses.up.x = face.annotations.midwayBetweenEyes[0][0] - face.annotations.noseBottom[0][0]
        // glasses.up.y = -(
        //     face.annotations.midwayBetweenEyes[0][1] - face.annotations.noseBottom[0][1]
        // )
        // glasses.up.z = face.annotations.midwayBetweenEyes[0][2] - face.annotations.noseBottom[0][2]
        // const length = Math.sqrt(glasses.up.x ** 2 + glasses.up.y ** 2 + glasses.up.z ** 2)
        // glasses.up.x /= length
        // glasses.up.y /= length
        // glasses.up.z /= length

        // // Scale to the size of the head
        // const eyeDist = Math.sqrt(
        //     (face.annotations.leftEyeUpper1[3][0] - face.annotations.rightEyeUpper1[3][0]) ** 2 +
        //         (face.annotations.leftEyeUpper1[3][1] - face.annotations.rightEyeUpper1[3][1]) **
        //             2 +
        //         (face.annotations.leftEyeUpper1[3][2] - face.annotations.rightEyeUpper1[3][2]) ** 2
        // )
        // glasses.scale.x = eyeDist / 6
        // glasses.scale.y = eyeDist / 6
        // glasses.scale.z = eyeDist / 6

        // glasses.rotation.y = Math.PI
        // glasses.rotation.z = Math.PI / 2 - Math.acos(glasses.up.x)
    }
}
