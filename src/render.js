const {
    desktopCapturer,
    remote: { Menu, dialog },
} = require('electron')
const { writeFile } = require('fs')

const videoElement = document.querySelector('video')

const startBtn = document.getElementById('startBtn')
startBtn.onclick = (e) => {
    mediaRecorder.start()
    startBtn.classList.add('is-danger')
    startBtn.innerText = 'Recording'
}

const stopBtn = document.getElementById('stopBtn')

stopBtn.onclick = (e) => {
    mediaRecorder.stop()
    startBtn.classList.remove('is-danger')
    startBtn.innerText = 'Start'
}

const videoSelectBtn = document.getElementById('videoSelectBtn')
videoSelectBtn.onclick = getVideoSources

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => ({
            label: source.name,
            click: () => selectSource(source),
        }))
    )

    videoOptionsMenu.popup()
}

let mediaRecorder
const recordedChunks = []

async function selectSource(source) {
    videoSelectBtn.innerHTML = source.name

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
            },
        },
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // preview the source in video element
    videoElement.srcObject = stream
    videoElement.play()

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' }
    mediaRecorder = new MediaRecorder(stream, options)

    //Register event handlers
    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop
}

function handleDataAvailable(e) {
    console.log('video data available')
    recordedChunks.push(e.data)
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9',
    })

    const buffer = Buffer.from(await blob.arrayBuffer())

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`,
    })

    console.log(filePath)

    writeFile(filePath, buffer, () => console.log('video saved'))
}
