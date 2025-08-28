import express from "express";
import { pubsubManager } from "../pubsub.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ topics: pubsubManager.stats() });
});

export default router;
