import express from "express";
import { pubsubManager } from "../pubsub.js";

const router = express.Router();
const startTime = Date.now();

router.get("/", (req, res) => {
  let subs = 0;
  for (const topic of pubsubManager.topics.values()) {
    subs += topic.subscribers.size;
  }

  res.json({
    uptime_sec: Math.floor((Date.now() - startTime) / 1000),
    topics: pubsubManager.topics.size,
    subscribers: subs,
  });
});

export default router;
