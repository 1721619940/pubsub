import { pubsubManager } from "./pubsub.js";
import { isValidUUID, nowTs } from "./utils.js";

export function handleWebSocketConnection(ws) {
  ws.clientId = null;

  ws.on("message", (data) => {
       if (ws.isShuttingDown && ws.isShuttingDown()) {
         ws.send(
           JSON.stringify({
             type: "error",
             error: {
               code: "SHUTTING_DOWN",
               message: "Server is shutting down. No new operations allowed.",
             },
             ts: new Date().toISOString(),
           })
         );
         return;
       }
    try {
      const msg = JSON.parse(data);
      const { type, topic, message, client_id, last_n = 0, request_id } = msg;

      if (!type) return;

      switch (type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong", request_id, ts: nowTs() }));
          break;

        case "subscribe":
          if (!topic || !client_id)
            return sendError(
              ws,
              request_id,
              "BAD_REQUEST",
              "Missing topic or client_id"
            );
          ws.clientId = client_id;
          pubsubManager.subscribe(topic, ws, last_n);
          sendAck(ws, request_id, topic);
          break;

        case "unsubscribe":
          pubsubManager.unsubscribe(topic, ws);
          sendAck(ws, request_id, topic);
          break;

        case "publish":
          if (!topic || !message?.id || !isValidUUID(message.id))
            return sendError(
              ws,
              request_id,
              "BAD_REQUEST",
              "Invalid or missing message.id"
            );
          pubsubManager.publish(topic, message);
          sendAck(ws, request_id, topic);
          break;

        default:
          sendError(ws, request_id, "BAD_REQUEST", "Unknown message type");
      }
    } catch (e) {
      sendError(ws, null, "BAD_REQUEST", "Invalid JSON");
    }
  });

  ws.on("close", () => {
    pubsubManager.cleanup(ws);
  });
}

function sendAck(ws, request_id, topic) {
  ws.send(
    JSON.stringify({
      type: "ack",
      request_id,
      topic,
      status: "ok",
      ts: nowTs(),
    })
  );
}

function sendError(ws, request_id, code, message) {
  ws.send(
    JSON.stringify({
      type: "error",
      request_id,
      error: { code, message },
      ts: nowTs(),
    })
  );
}
