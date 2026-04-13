import express from "express";
import { proxyAuth } from "../middleware/proxyAuth";
import { chatCompletionHandler } from "../controllers/openaiController";
import { rateLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.post(
  "/chat/completions",
  proxyAuth,
  rateLimiter,
  chatCompletionHandler
);

export default router;