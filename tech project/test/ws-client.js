import WebSocket from "ws";

const URL = "ws://localhost:3000/ws";

const subscriber = new WebSocket(URL);
const publisher = new WebSocket(URL);

subscriber.on("open", () => {
  console.log("[SUB] Connected");

  // Subscribe to 'orders' topic
  subscriber.send(
    JSON.stringify({
      type: "subscribe",
      topic: "orders",
      client_id: "sub-client",
      last_n: 0,
      request_id: "req-sub-123",
    })
  );
});

subscriber.on("message", (msg) => {
  console.log("[SUB] Received:", msg.toString());
});

publisher.on("open", () => {
  console.log("[PUB] Connected");

  // Wait 1 second and publish
  setTimeout(() => {
    const message = {
      type: "publish",
      topic: "orders",
      message: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        payload: {
          order_id: "ORD-999",
          amount: 88.5,
          currency: "USD",
        },
      },
      request_id: "req-pub-456",
    };

    publisher.send(JSON.stringify(message));
    console.log("[PUB] Sent publish message");
  }, 1000);
});

subscriber.on("message", (msg) => {
  console.log("[SUB] Received:", msg.toString());
});

subscriber.on("close", () => {
  console.log("[SUB] Socket closed by server");
});


publisher.on("message", (msg) => {
  console.log("[PUB] Received:", msg.toString());
});
