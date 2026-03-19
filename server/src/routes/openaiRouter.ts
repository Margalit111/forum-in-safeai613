import express from "express";
import { proxyAuth } from "../middleware/proxyAuth";
import { chatCompletionHandler } from "../controllers/openaiController";

const router = express.Router();

router.post(
  "/chat/completions",
  proxyAuth,
  chatCompletionHandler
);

export default router;