import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

export default defineConfig({
    server: {
        host: true,
        port: 5173,
        https: {
            key: fs.readFileSync("../backend/key.pem"),
            cert: fs.readFileSync("../backend/cert.pem")
        },
        proxy: {
            "/ws": {
                target: "ws://localhost:3000",
                ws: true,
                changeOrigin: true
            }
        }
    }
});
