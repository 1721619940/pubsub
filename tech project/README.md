# 📡 In-Memory Pub/Sub Service

A lightweight **Pub/Sub messaging system** implemented in **Node.js**, featuring:

- 🔌 **WebSocket API** (`/ws`) for `subscribe`, `publish`, `unsubscribe`, `ping`  
- 🌐 **REST API** (`/topics`, `/health`, `/stats`) for management & observability  
- 🧠 **In-memory only** — no DBs or brokers (Redis/Kafka)  
- 🛡️ **Authentication** using `X-API-Key`  
- ♻️ **Ring buffer** with replay (`last_n`) support  
- ⚖️ **Backpressure** via per-subscriber queues (bounded)  
- 📴 **Graceful shutdown** with client notifications  

---

## Clone & Install

- git clone https://github.com/1721619940/pubsub.git
- cd pubsub
- cd tech project

### Install dependencies
npm install


## 🚀 Features

- **WebSocket API**
  - `subscribe` → Subscribe to a topic (with optional replay)
  - `publish` → Broadcast a message to all subscribers
  - `unsubscribe` → Leave a topic
  - `ping` → Keepalive check
- **REST API**
  - `POST /topics` → Create a topic
  - `DELETE /topics/:name` → Delete a topic
  - `GET /topics` → List topics with subscriber counts
  - `GET /health` → Uptime, topics, subscriber count
  - `GET /stats` → Message counts per topic
- **Resilience**
  - Per-subscriber queue (default: 100 messages) with **overflow policy**
  - **Ring buffer** (default: 100 messages per topic) for replay
  - **Graceful shutdown**: stop new ops, notify clients, flush queues
- **Security**
  - All REST and WebSocket calls require a valid `X-API-Key`

---

## 📂 Project Structure
```
pubsub-service/
│
├── src/
│ ├── server.js # Entry point (REST + WebSocket + shutdown)
│ ├── websocket.js # WebSocket message handler
│ ├── pubsub.js # Pub/Sub manager (topics, queues, replay)
│ ├── utils.js # Helpers (auth, UUID, timestamps)
│ ├── routes/
│ │ ├── topics.js # REST: topic management
│ │ ├── health.js # REST: health check
│ │ └── stats.js # REST: stats/observability
│
├── Dockerfile
├── package.json
└── README.md

```
---

## 🔑 Authentication

All REST and WebSocket calls require a valid API key.  

Default API key is configured in `utils.js`:

```js
export const VALID_API_KEYS = ["my-secret-key-123"];

REST Example (cURL):
curl -X GET http://localhost:3000/topics \
  -H "X-API-Key: my-secret-key-123"

WebSocket Example (Postman/Node):

Headers:

X-API-Key: my-secret-key-123

🧩 WebSocket Protocol
✅ Client → Server
Subscribe
{
  "type": "subscribe",
  "topic": "orders",
  "client_id": "c1",
  "last_n": 5,
  "request_id": "req-1"
}

Publish
{
  "type": "publish",
  "topic": "orders",
  "message": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "payload": { "order_id": "ORD-101", "amount": 99.5, "currency": "USD" }
  },
  "request_id": "req-2"
}

Unsubscribe
{ "type": "unsubscribe", "topic": "orders", "client_id": "c1" }

Ping
{ "type": "ping", "request_id": "req-3" }

✅ Server → Client
Ack
{ "type": "ack", "request_id": "req-2", "topic": "orders", "status": "ok", "ts": "..." }

Event
{
  "type": "event",
  "topic": "orders",
  "message": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "payload": { "order_id": "ORD-101", "amount": 99.5, "currency": "USD" }
  },
  "ts": "..."
}

Error
{
  "type": "error",
  "error": { "code": "SLOW_CONSUMER", "message": "Queue overflow. Disconnecting." },
  "ts": "..."
}

Info
{ "type": "info", "msg": "server_shutdown", "ts": "..." }

⚖️ Backpressure Policy

Each subscriber has a bounded queue (default: 100 messages).

If overflow occurs:

Default behavior: Drop the oldest message (FIFO).

Optional mode: Disconnect client with SLOW_CONSUMER.

♻️ Replay Policy

Each topic stores the last 100 messages in a ring buffer.

When subscribing with last_n, the server replays that many historical messages.

📴 Graceful Shutdown

On SIGINT or SIGTERM:

Server stops accepting new REST/WS requests.

All clients receive:

{ "type": "info", "msg": "server_shutdown", "ts": "..." }


Connections are closed after a short delay.

Process exits cleanly.

🐳 Running with Docker
docker build -t pubsub-service .
docker run -p 3000:3000 -e PORT=3000 pubsub-service

🧪 Testing
WebSocket (Node.js client)
import WebSocket from "ws";
const ws = new WebSocket("ws://localhost:3000/ws", {
  headers: { "X-API-Key": "my-secret-key-123" }
});
ws.on("open", () => {
  ws.send(JSON.stringify({ type: "subscribe", topic: "orders", client_id: "c1" }));
});
ws.on("message", (msg) => console.log("Received:", msg.toString()));

REST (cURL)
curl -X POST http://localhost:3000/topics \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-key-123" \
  -d '{"name": "orders"}'

📜 License

MIT License. Free to use, modify, and distribute.


---






