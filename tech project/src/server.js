import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { handleWebSocketConnection } from "./websocket.js";
import topicsRouter from "./routes/topics.js";
import healthRouter from "./routes/health.js";
import statsRouter from "./routes/stats.js";
import { isValidApiKey, isValidApiKeyRawHeader } from "./utils.js";

const app = express();
app.use(express.json());


app.use((req, res, next) => {
  if (!isValidApiKey(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use("/topics", topicsRouter);
app.use("/health", healthRouter);
app.use("/stats", statsRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

let isShuttingDown = false;

wss.on("connection", (ws, req) => {

    const apiKey = req.headers["x-api-key"];

    if (!isValidApiKeyRawHeader(apiKey)) {
      ws.send(
        JSON.stringify({
          type: "error",
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid X-API-Key",
          },
          ts: new Date().toISOString(),
        })
      );
      ws.close();
      return;
    }
  // Pass the shutdown flag into the WebSocket logic
  ws.isShuttingDown = () => isShuttingDown;
  handleWebSocketConnection(ws, req);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
function gracefulShutdown() {
  isShuttingDown = true;
  console.log("\n[INFO] Gracefully shutting down...");

  server.close(() => {
    console.log("[HTTP] Server closed.");
  });

  wss.clients.forEach((client) => {
    try {
      client.send(
        JSON.stringify({
          type: "info",
          msg: "server_shutdown",
          ts: new Date().toISOString(),
        })
      );
      //   client.close();
    } catch {}
  });

  setTimeout(() => {
    console.log("[INFO] Force exit.");
    wss.clients.forEach((client) => client.close());

    process.exit(0);
  }, 10000); // force exit after 10 seconds
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
