let audioContext;
let analyser;
let dataArray;
let canvas = document.getElementById("waveform");
let ctx = canvas.getContext("2d");
let currentID = null;
let audioBufferSource;
let isPlaying = false;
let startTime = 0;
let pauseTime = 0;
let audioBuffer;

function generateID() {
    return Math.random().toString(36).substr(2, 9);
}

function updateURL() {
    const input = document.getElementById("wavString").value;
    if (input.trim() === "") return;

    let existingID = null;
    for (let key in localStorage) {
        if (localStorage[key] === input) {
            existingID = key.replace("wavCode_", "");
            break;
        }
    }

    if (existingID) {
        currentID = existingID;
    } else {
        currentID = generateID();
        localStorage.setItem("wavCode_" + currentID, input);
    }

    history.replaceState(null, "", "?id=" + currentID);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id && localStorage.getItem("wavCode_" + id)) {
        document.getElementById("wavString").value = localStorage.getItem("wavCode_" + id);
        currentID = id;
    }
}

async function playAudio() {
    const wavString = document.getElementById('wavString').value;
    const binaryData = atob(wavString);
    const byteArray = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        byteArray[i] = binaryData.charCodeAt(i);
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    try {
        audioBuffer = await audioContext.decodeAudioData(byteArray.buffer);
        if (audioBufferSource) {
            audioBufferSource.stop();
        }
        audioBufferSource = audioContext.createBufferSource();
        audioBufferSource.buffer = audioBuffer;
        audioBufferSource.connect(analyser);
        analyser.connect(audioContext.destination);
        audioBufferSource.playbackRate.value = document.getElementById("playbackRate").value;
        audioBufferSource.start(0, pauseTime);
        startTime = audioContext.currentTime - pauseTime;
        isPlaying = true;
        visualizeFrequency();
    } catch (error) {
        alert('Ошибка декодирования аудио');
        console.error(error);
    }
}

function pauseAudio() {
    if (audioBufferSource && isPlaying) {
        audioBufferSource.stop();
        pauseTime = audioContext.currentTime - startTime;
        isPlaying = false;
    }
}

function stopAudio() {
    if (audioBufferSource) {
        audioBufferSource.stop();
        pauseTime = 0;
        isPlaying = false;
    }
}

function rewindBack() {
    if (audioBufferSource && isPlaying) {
        pauseTime -= 5;
        if (pauseTime < 0) pauseTime = 0;
        playAudio();
    }
}

function rewindForward() {
    if (audioBufferSource && isPlaying) {
        pauseTime += 5;
        playAudio();
    }
}

function beginning() {
    if (audioBufferSource && isPlaying) {
        pauseTime = 0;
        playAudio();
    }
}

function visualizeFrequency() {
    if (!isPlaying) return; // Останавливаем визуализацию, если не воспроизводится

    requestAnimationFrame(visualizeFrequency);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i];
        ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
    }
}

document.getElementById("playButton").addEventListener("click", playAudio);
document.getElementById("pauseButton").addEventListener("click", pauseAudio);
document.getElementById("stopButton").addEventListener("click", stopAudio);
document.getElementById("rewindBackButton").addEventListener("click", rewindBack);
document.getElementById("rewindForwardButton").addEventListener("click", rewindForward);
document.getElementById("beginningButton").addEventListener("click", beginning);

document.getElementById("playbackRate").addEventListener("change", () => {
    if (audioBufferSource && isPlaying) {
        audioBufferSource.playbackRate.value = document.getElementById("playbackRate").value;
    }
});

document.getElementById("volume").addEventListener("input", () => {
    if (audioContext) {
        audioContext.destination.gain.value = document.getElementById("volume").value;
    }
});

document.getElementById("visualizerSize").addEventListener("input", () => {
    canvas.height = document.getElementById("visualizerSize").value;
    canvas.width = document.getElementById("visualizerSize").value * 3;
});

window.onload = loadFromURL;