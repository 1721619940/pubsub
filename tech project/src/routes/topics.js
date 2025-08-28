import express from "express";
import { pubsubManager } from "../pubsub.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing topic name" });

  const created = pubsubManager.createTopic(name);
  if (!created) return res.status(409).json({ error: "Topic already exists" });

  res.status(201).json({ status: "created", topic: name });
});

router.delete("/:name", (req, res) => {
  const deleted = pubsubManager.deleteTopic(req.params.name);
  if (!deleted) return res.status(404).json({ error: "Topic not found" });

  res.json({ status: "deleted", topic: req.params.name });
});

router.get("/", (req, res) => {
  res.json({ topics: pubsubManager.listTopics() });
});

export default router;
