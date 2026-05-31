/**
 * server/src/services/filterService.ts
 *
 * הערכת טקסט מול פרופיל. הלוגיקה עברה ל-input workflow;
 * הקובץ הזה נשאר נקודת הכניסה ושומר את ה-EvaluationLog (כולל trace).
 */

import logger from "../logger";
import { Embedding } from "../models";
import { addEmbeddingToCache } from "../cache/embeddingCache";
import {
  EmbeddingRequest,
  EvaluateRequest,
  EvaluateResponse,
} from "../types/proxyTypes";
import { openai } from "../config/openai";
import { getFullProfileById } from "../repositories/profileRepository";

import { runInputWorkflow } from "../workflows/input/inputFilterWorkflow";
import { NodeTrace } from "../workflows/types";

/* ---------- Embeddings (לא בשימוש בזרימה הנוכחית, נשמר לעתיד) ---------- */

export async function getEmbeddings(categories: string[] = []) {
  return Embedding.find({ category: { $in: categories } });
}

export async function createEmbedding(req: EmbeddingRequest) {
  const { category, originText } = req;

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: originText,
  });

  const vector = response.data?.[0]?.embedding;
  if (!vector) {
    throw new Error("Embedding failed");
  }

  await Embedding.create({ category, originText, vector });
  addEmbeddingToCache(category, vector);
}