/**
 * server/src/models/prompt.ts
 *
 * Mongoose model for stored prompt templates or canned text used in the system.
 */

import mongoose from "mongoose";

export interface PromptDoc extends mongoose.Document {
  code?: string;
  category?: string;
  content?: string;
  description?: string;
  status?: "לבדיקה" | "בשימוש" | "ישן";
}

const PromptSchema = new mongoose.Schema(
  {
    code: String,
    category: String,
    content: String,
    description: String,
    status: { type: String, enum: ["לבדיקה", "בשימוש", "ישן"] },
  },
  { timestamps: true },
);


PromptSchema.index({ code: 1 });
PromptSchema.index({ category: 1 });

export const Prompt = mongoose.model<PromptDoc>("Prompt", PromptSchema);
