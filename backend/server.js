import https from "https";
import fs from "fs";
import { WebSocketServer } from "ws";
import loudness from "loudness";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { execFile } = require("child_process");
const path = require("path");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nircmdPath = path.join(__dirname, "nircmd.exe");

function sendMediaKey(vkCode) {
    execFile(nircmdPath, ["sendkeypress", vkCode], (err) => {
        if (err) {
            console.error("NirCmd error:", err);
        }
    });
}

const server = https.createServer({
    key: fs.readFileSync("./key.pem"),
    cert: fs.readFileSync("./cert.pem")
});

const wss = new WebSocketServer({ server });

async function setSystemVolume(percent) {
    try {
        const value = Math.max(0, Math.min(100, percent));
        await loudness.setVolume(value);
        console.log("System volume set to:", value);
    } catch (err) {
        console.error("Volume error:", err);
    }
}

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message.toString());

            if (parsed.type === "SET_VOLUME") {
                setSystemVolume(parsed.value !== undefined ? parsed.value : parsed.percent);
            }

            if (parsed.type === "PLAY_PAUSE") {
                console.log("PLAY_PAUSE triggered");
                sendMediaKey("179");
            }

            if (parsed.type === "NEXT") {
                console.log("NEXT triggered");
                sendMediaKey("176");
            }

            if (parsed.type === "PREVIOUS") {
                console.log("PREVIOUS triggered");
                sendMediaKey("177");
            }

        } catch (err) {
            console.error("Invalid message:", message.toString());
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, () => {
    console.log("Secure WSS server running on port 3000");
});
