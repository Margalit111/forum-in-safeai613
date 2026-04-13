/**
 * server/src/models/aiProfile.ts
 *
 * Mongoose model representing an AI profile for filtering.
 * Profiles define allowed/blocked categories and thresholds for embeddings.
 */

import mongoose from "mongoose";

export interface AIProfileDoc extends mongoose.Document {
  name: string;
  allowedCategories?: string[];
  blockedCategories?: string[];
  thresholdAllowed: number;
  thresholdBlocked: number;
  similarityMargin: number;
  createdBy: string;
  creatorEmail: string;
  contentPrompts?: string[];
  behaviorPrompts?: string[];
  knowledgePrompts?: string[];
}

const AIProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    allowedCategories: [{ type: String, lowercase: true, trim: true }],
    blockedCategories: [{ type: String, lowercase: true, trim: true }],
    thresholdAllowed: { type: Number, default: 0.25 },
    thresholdBlocked: { type: Number, default: 0.25 },
    similarityMargin: { type: Number, default: 0.05 },
    createdBy: { type: String, required: true },
    creatorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contentPrompts: [String],
    behaviorPrompts: [String],
    knowledgePrompts: [String],
  },
  { timestamps: true },
);

AIProfileSchema.index({ creatorEmail: 1 });
AIProfileSchema.index({ name: 1 });


export const AIProfile = mongoose.model<AIProfileDoc>("AIProfile", AIProfileSchema, "ai-profiles");
