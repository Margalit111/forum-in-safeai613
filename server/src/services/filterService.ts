/**
 * server/src/services/filterService.ts
 *
 * Business logic for creating embeddings and evaluating text against
 * user-defined AI profiles and embedding categories.
 */

import OpenAI from "openai";
import logger from "../logger";
import { Embedding } from "../models";
import {
  getEmbeddingVectorsByCategory,
  addEmbeddingToCache,
} from "../cache/embeddingCache";
import { getLLMDecision } from "./llmService";
import { cosineSimilarity } from "../utils/cosineSimilarity";
import {
  EmbeddingRequest,
  EvaluateRequest,
  EvaluateResponse,
} from "../types/proxyTypes";

import { openai } from "../config/openai";

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

export async function evaluateText(
  req: EvaluateRequest,
): Promise<EvaluateResponse> {
  const { profileId, text, auditDisabled } = req;

  if (!profileId || !text) {
    throw new Error("profileId and text are required");
  }

  const { AIProfile, EvaluationLog } = await import("../models");

  const profile = await AIProfile.findById(profileId);
  if (!profile) {
    throw new Error("AIProfile not found");
  }

  //----------------Embedding Filter (Futute)----------------
  // const response = await openai.embeddings.create({
  //   model: "text-embedding-3-small",
  //   input: text,
  // });

  // const inputVector = response.data?.[0]?.embedding;
  // if (!inputVector) {
  //   throw new Error("Embedding failed");
  // }

  // let bestAllowed = 0;
  // let bestBlocked = 0;

  // for (const category of profile.allowedCategories ?? []) {
  //   const vectors = getEmbeddingVectorsByCategory(category);
  //   for (const vector of vectors) {
  //     const score = cosineSimilarity(inputVector, vector);
  //     if (score > bestAllowed) bestAllowed = score;
  //   }
  // }

  // for (const category of profile.blockedCategories ?? []) {
  //   const vectors = getEmbeddingVectorsByCategory(category);
  //   for (const vector of vectors) {
  //     const score = cosineSimilarity(inputVector, vector);
  //     if (score > bestBlocked) bestBlocked = score;
  //   }
  // }

  // const diff = bestAllowed - bestBlocked;

  // logger.info(
  //   `Profile=${profile.name} | allowed=${bestAllowed.toFixed(4)} blocked=${bestBlocked.toFixed(4)} diff=${diff.toFixed(
  //     4,
  //   )}`,
  // );

  let finalAllowed = false;
  let reason = "low-confidence";

  // if (bestBlocked > profile.thresholdBlocked && bestBlocked > bestAllowed) {
  //   reason = "blocked-category";
  // } else if (
  //   bestAllowed > profile.thresholdAllowed &&
  //   diff > profile.similarityMargin
  // ) {
  //   finalAllowed = true;
  //   reason = "passed-vector";
  // }

  // if (!finalAllowed) {
  if (!auditDisabled) {
    logger.info(
      "Low confidence or blocked by vector. Consulting GPT-4o-mini...",
    );
  }


  // const isSafeByLLM = true;
  const isSafeByLLM = await getLLMDecision(
    text,
    profile.name,
    (profile.allowedCategories ?? []).join(", ") +
      " " +
      (profile.blockedCategories ?? []).join(", "),
  );

  if (isSafeByLLM) {
    finalAllowed = true;
    reason = "allowed-by-llm";
  } else {
    reason = "blocked-by-llm";
  }
  // }

  if (!auditDisabled) {
    await EvaluationLog.create({
      profileId: profile._id,
      text,
      vectorScores: {  },
      initialDecision: reason,
      llmFinalDecision: finalAllowed ? "allowed" : "blocked",
    });
  }

  return {
    allowed: finalAllowed,
    reason,
  };
}
