import { nowTs } from "./utils.js";

const MAX_QUEUE = 100;

class PubSubManager {
  constructor() {
    this.topics = new Map(); // topic => { messages, subscribers }
  }

  createTopic(name) {
    if (this.topics.has(name)) return false;

    this.topics.set(name, {
      messages: [],
      maxMessages: 100,
      subscribers: new Map(),
    });

    // this.topics.set(name, { messages: [], subscribers: new Map() }); // Map<clientId, subscriberMeta>
    return true;
  }

  deleteTopic(name) {
    const topic = this.topics.get(name);
    if (!topic) return false;

    for (const { ws } of topic.subscribers.values()) {
      ws.send(
        JSON.stringify({
          type: "info",
          topic: name,
          msg: "topic_deleted",
          ts: nowTs(),
        })
      );
    }
    this.topics.delete(name);
    return true;
  }

  listTopics() {
    return [...this.topics.entries()].map(([name, topic]) => ({
      name,
      subscribers: topic.subscribers.size,
    }));
  }

  stats() {
    const obj = {};
    for (const [name, topic] of this.topics.entries()) {
      obj[name] = {
        messages: topic.messages.length,
        subscribers: topic.subscribers.size,
      };
    }
    return obj;
  }

  subscribe(topicName, ws, last_n = 0) {
    const topic = this.topics.get(topicName);
    if (!topic) return;

    const clientId = ws.clientId;
    if (!clientId) return;

    topic.subscribers.set(clientId, {
      ws,
      queue: [],
      sending: false,
    });

    // Replay last_n messages
    const replay = topic.messages.slice(-last_n);
    for (const msg of replay) {
      this.enqueueMessage(topicName, clientId, msg);
    }
  }

  unsubscribe(topicName, ws) {
    const topic = this.topics.get(topicName);
    if (!topic) return;

    topic.subscribers.delete(ws.clientId);
  }

  publish(topicName, message) {
    const topic = this.topics.get(topicName);
    if (!topic) return;

    topic.messages.push(message);

    // Enforce ring buffer size
    if (topic.messages.length > topic.maxMessages) {
      topic.messages.shift(); // drop oldest
    }

    for (const [clientId, subscriber] of topic.subscribers.entries()) {
      this.enqueueMessage(topicName, clientId, message);
    }
  }

  enqueueMessage(topicName, clientId, message) {
    const topic = this.topics.get(topicName);
    const subscriber = topic.subscribers.get(clientId);

    if (!subscriber) return;

    if (subscriber.queue.length >= MAX_QUEUE) {
      subscriber.queue.shift();
      // Backpressure
      //   try {
      //     subscriber.ws.send(
      //       JSON.stringify({
      //         type: "error",
      //         error: {
      //           code: "SLOW_CONSUMER",
      //           message: "Queue overflow. Disconnecting.",
      //         },
      //         ts: nowTs(),
      //       })
      //     );
      //   } catch {}
      //   subscriber.ws.close();
      //   topic.subscribers.delete(clientId);
      //   return;
    }

    subscriber.queue.push(message);
    if (!subscriber.sending) {
      this.flushQueue(topicName, clientId);
    }
  }

  flushQueue(topicName, clientId) {
    const topic = this.topics.get(topicName);
    const subscriber = topic.subscribers.get(clientId);
    if (!subscriber) return;

    const { ws, queue } = subscriber;

    if (queue.length === 0) {
      subscriber.sending = false;
      return;
    }

    subscriber.sending = true;
    const msg = queue.shift();

    try {
      ws.send(
        JSON.stringify({
          type: "event",
          topic: topicName,
          message: msg,
          ts: nowTs(),
        }),
        () => {
          // After send, recursively flush next
          setImmediate(() => this.flushQueue(topicName, clientId));
        }
      );
    } catch (err) {
      topic.subscribers.delete(clientId);
    }
  }

  cleanup(ws) {
    for (const topic of this.topics.values()) {
      topic.subscribers.delete(ws.clientId);
    }
  }
}

export const pubsubManager = new PubSubManager();
