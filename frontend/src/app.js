import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

function detectGesture(landmarks) {
    return null; // Placeholder to avoid ReferenceError
}

let previousLandmarks = null;
const SMOOTHING = 0.2; // light smoothing
let displayedVolumePercent = 0;

let lastTriggerTime = 0;
const COOLDOWN_MS = 800;
const MIN_CONFIDENCE = 0.8;
let currentGesture = null;
let currentMode = "volume"; // "volume" or "media"

let calibrationMode = false;
let calibrationData = {
    neutralAngle: null
};

try {
    const saved = localStorage.getItem("gestureCalibration");
    if (saved) {
        const parsed = JSON.parse(saved);

        if (typeof parsed.neutralAngle === "number") {
            calibrationData.neutralAngle = parsed.neutralAngle;
            console.log("Calibration loaded:", calibrationData);
        }
    }
} catch (err) {
    console.warn("Calibration load failed:", err);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        calibrationMode = !calibrationMode;
        if (calibrationMode) {
            calibrationData = { neutralAngle: null };
            updateGestureStatus("Calibrating...");
        } else {
            localStorage.setItem("gestureCalibration", JSON.stringify(calibrationData));
            console.log("Calibration saved:", calibrationData);
            updateGestureStatus("Calibration saved");
        }
    }
});

let lastVolumeSent = null;

function updateGestureStatus(text) {
    const el = document.getElementById("gesture-status");
    if (el) el.innerText = text;
}

function updateModeUI() {
    const modeEl = document.getElementById("gesture-mode");
    if (modeEl) {
        modeEl.innerText = "Mode: " +
            (currentMode === "volume" ? "Volume" : "Media");
        modeEl.style.color = currentMode === "volume" ? "#00ffc8" : "#ffaa00";
    }
}

window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "m") {
        currentMode = currentMode === "volume" ? "media" : "volume";
        updateModeUI();
    }
});

const modeBtn = document.getElementById("gesture-mode");
if (modeBtn) {
    modeBtn.addEventListener("click", () => {
        currentMode = currentMode === "volume" ? "media" : "volume";
        updateModeUI();
    });
}

const WS_PROTOCOL = location.protocol === "https:" ? "wss" : "ws";
const WS_HOST = window.location.hostname;

const socket = new WebSocket(
    `${WS_PROTOCOL}://${WS_HOST}:3000`
);

const backendStatusEl = document.getElementById("backend-status");
const connectionInfoEl = document.getElementById("connection-info");

socket.onopen = () => {
    console.log("WebSocket connected");
    updateGestureStatus("Connected");
    if (backendStatusEl) {
        backendStatusEl.innerText = "Connected";
        backendStatusEl.className = "status-badge status-connected";
    }
    if (connectionInfoEl) {
        connectionInfoEl.innerText = "Backend online";
    }
};

socket.onerror = (err) => {
    console.error("WebSocket error", err);
    updateGestureStatus("Connection Error");
    if (backendStatusEl) {
        backendStatusEl.innerText = "Error";
        backendStatusEl.className = "status-badge status-disconnected";
    }
};

let reconnectTimeout = null;

function reconnect() {
    if (reconnectTimeout) return;

    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        console.log("Attempting reconnect...");
        window.location.reload();
    }, 2000);
}

socket.onclose = () => {
    console.warn("WebSocket closed");
    updateGestureStatus("Disconnected");
    if (backendStatusEl) {
        backendStatusEl.innerText = "Disconnected";
        backendStatusEl.className = "status-badge status-disconnected";
    }
    if (connectionInfoEl) {
        connectionInfoEl.innerText = "Backend offline";
    }
    reconnect();
};

const processGesture = (gesture, sendWebSocketCommand, confidence = 1) => {
    if (confidence < MIN_CONFIDENCE) {
        return;
    }
    if (gesture === 'VOL_UP' || gesture === 'VOL_DOWN') return;

    if (currentMode !== "media") return;

    if (gesture === currentGesture) return;

    const now = Date.now();
    if (now - lastTriggerTime < COOLDOWN_MS) return;
    lastTriggerTime = now;
    currentGesture = gesture;

    if (sendWebSocketCommand) {
        sendWebSocketCommand(gesture);
    } else if (socket && socket.readyState === 1 && gesture) {
        if (gesture === 'PLAY_PAUSE') {
            console.log("Sending media command:", "PLAY_PAUSE");
        } else if (gesture === 'NEXT') {
            console.log("Sending media command:", "NEXT");
        } else if (gesture === 'PREV' || gesture === 'PREVIOUS') {
            console.log("Sending media command:", "PREVIOUS");
        }
        socket.send(gesture);
    }

    if (gesture === 'PLAY_PAUSE') {
        updateGestureStatus("Play / Pause");
    } else if (gesture === 'NEXT') {
        updateGestureStatus("Next Track");
    } else if (gesture === 'PREV') {
        updateGestureStatus("Previous Track");
    }
};

const processDistance = () => { };

const renderOverlay = (ctx, landmarks, connections) => {
    if (!ctx) return;

    ctx.save();
    ctx.shadowColor = "#00ffc8";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "#00ffc8";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#00ffc8";

    if (landmarks && landmarks.length > 0) {
        if (connections && connections.length > 0) {
            for (const [i, j] of connections) {
                const p1 = landmarks[i];
                const p2 = landmarks[j];
                if (p1 && p2) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        for (const lm of landmarks) {
            if (lm) {
                ctx.beginPath();
                ctx.arc(lm.x, lm.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        if (thumbTip && indexTip && lastVolumeSent !== null) {
            const midX = (thumbTip.x + indexTip.x) / 2;
            const midY = (thumbTip.y + indexTip.y) / 2;

            ctx.beginPath();
            ctx.arc(midX, midY, 40, 0, (lastVolumeSent / 100) * Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.restore();
};

export default { processGesture, processDistance, updateGestureStatus, renderOverlay };

// --- Camera & Canvas Setup ---
const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let processingFrame = false;

let leftHandWasOpen = false;
let lastToggleTime = 0;
const TOGGLE_COOLDOWN = 1500;

hands.onResults((results) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    if (results.multiHandLandmarks) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            let landmarks = results.multiHandLandmarks[i];

            if (previousLandmarks && previousLandmarks[i]) {
                landmarks = landmarks.map((lm, idx) => ({
                    x: previousLandmarks[i][idx].x * SMOOTHING + lm.x * (1 - SMOOTHING),
                    y: previousLandmarks[i][idx].y * SMOOTHING + lm.y * (1 - SMOOTHING),
                    z: lm.z
                }));
                results.multiHandLandmarks[i] = landmarks;
            }

            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: "#00ffc8",
                lineWidth: 3
            });
            drawLandmarks(ctx, landmarks, {
                color: "#00ffc8",
                lineWidth: 2
            });
        }
    }

    ctx.restore();

    previousLandmarks = results.multiHandLandmarks;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const wrist = landmarks[0];
            const isLeftSide = wrist.x < 0.5;

            if (isLeftSide === true) {
                if (currentMode === "volume") {
                    const middleTip = landmarks[12];

                    const dx = middleTip.x - wrist.x;
                    const dy = middleTip.y - wrist.y;

                    let angle = Math.atan2(dy, dx);

                    // convert to degrees
                    let degrees = angle * (180 / Math.PI);

                    if (calibrationMode) {
                        calibrationData.neutralAngle = degrees;
                        localStorage.setItem("gestureCalibration", JSON.stringify(calibrationData));
                        updateGestureStatus("Neutral position captured");
                    }

                    const MAX_DELTA = 40;

                    let center = calibrationData.neutralAngle ?? 0;

                    let delta = degrees - center;

                    let clamped = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, delta));

                    let normalized =
                        (clamped + MAX_DELTA) / (2 * MAX_DELTA);

                    normalized = Math.max(0, Math.min(1, normalized));

                    const volumePercent = Math.floor(normalized * 100);

                    if (lastVolumeSent === null || Math.abs(volumePercent - lastVolumeSent) > 3) {
                        if (socket && socket.readyState === 1) {
                            socket.send(JSON.stringify({
                                type: "SET_VOLUME",
                                value: volumePercent
                            }));
                        }
                        lastVolumeSent = volumePercent;
                        updateGestureStatus("Volume: " + volumePercent + "%");
                        const volumeBarEl = document.getElementById("volume-bar-fill");
                        if (volumeBarEl) volumeBarEl.style.width = volumePercent + "%";
                    }
                }

                if (currentMode === "media") {
                    const fistClosed =
                        landmarks[8].y > landmarks[6].y &&
                        landmarks[12].y > landmarks[10].y &&
                        landmarks[16].y > landmarks[14].y &&
                        landmarks[20].y > landmarks[18].y;

                    const now = Date.now();

                    if (fistClosed && now - lastToggleTime > 1000) {
                        console.log("Sending PLAY_PAUSE");
                        socket.send(JSON.stringify({ type: "PLAY_PAUSE" }));
                        lastToggleTime = now;
                    }

                    if (results.multiHandedness && results.multiHandedness.length > 0) {
                        const confidence = results.multiHandedness[i].score;
                        processGesture(detectGesture(landmarks), null, confidence);
                    } else {
                        processGesture(detectGesture(landmarks));
                    }
                }
            }

            if (isLeftSide === false) {
                const fingersOpen =
                    landmarks[8].y < landmarks[6].y &&
                    landmarks[12].y < landmarks[10].y &&
                    landmarks[16].y < landmarks[14].y &&
                    landmarks[20].y < landmarks[18].y;

                const now = Date.now();

                if (
                    fingersOpen &&
                    !leftHandWasOpen &&
                    now - lastToggleTime > TOGGLE_COOLDOWN
                ) {
                    currentMode = currentMode === "volume" ? "media" : "volume";
                    updateModeUI();
                    lastToggleTime = now;
                }

                leftHandWasOpen = fingersOpen;
            }
        }

    } else {
        currentGesture = null;
        updateGestureStatus("Idle");
        previousLandmarks = null;
    }

    processingFrame = false;
});

async function initCamera() {
    if (!video || !canvas) return;
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
    });
    video.srcObject = stream;

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve();
        };
    });
}

function renderLoop() {
    if (!ctx || !canvas) return;

    if (!processingFrame && video.readyState >= 2) {
        processingFrame = true;
        hands.send({ image: video });
    }

    requestAnimationFrame(renderLoop);
}

updateModeUI();

// Ensure the code runs when the document is ready
if (video && canvas) {
    initCamera().then(() => {
        renderLoop();
    });
}
