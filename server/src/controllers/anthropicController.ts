import { Request, Response } from "express";
import {
  anthropicToOpenAIChatBody,
  estimateAnthropicTokens,
  openAIToAnthropicMessage,
} from "../services/anthropicAdapter";
import { proxyChatCompletion } from "../services/proxyService";
import logger from "../logger";

export async function anthropicMessagesHandler(req: Request, res: Response) {
  try {
    const originalModel = req.body.model;

    const openAIBody = anthropicToOpenAIChatBody(req.body);

    const data = await proxyChatCompletion((req as any).user, openAIBody);

    const anthropicResponse = openAIToAnthropicMessage(data, originalModel);

    return res.status(200).json(anthropicResponse);
  } catch (error: any) {
  logger.error("Anthropic messages error:", {
    error: error.message,
    stack: error.stack,
  });

  // SafeAI filter blocked the request
  if (
    error.message?.includes(
      "Content blocked By SafeAI Filter",
    )
  ) {
    return res.status(200).json({
      id: `msg_${Date.now()}`,
      type: "message",
      role: "assistant",
      model: req.body.model,
      content: [
        {
          type: "text",
          text: error.message,
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    });
  }

  // Other API errors
  return res.status(500).json({
    type: "error",
    error: {
      type: "api_error",
      message:
        error.message ||
        "Anthropic messages request failed",
    },
  });
}
}

export async function anthropicCountTokensHandler(req: Request, res: Response) {
  try {
    const result = estimateAnthropicTokens(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error("Anthropic count_tokens error:", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      type: "error",
      error: {
        type: "api_error",
        message: error.message || "Token count failed",
      },
    });
  }
}

export async function anthropicModelsHandler(req: Request, res: Response) {
  return res.status(200).json({
    data: [
      {
        id: "claude-sonnet-4-6",
        type: "model",
        display_name: "Claude Sonnet 4.6 via SafeAI",
      },
    //   {
    //     id: "claude-3-5-sonnet-latest",
    //     type: "model",
    //     display_name: "Claude 3.5 Sonnet via SafeAI",
    //   },
    //   {
    //     id: "claude-3-5-haiku-latest",
    //     type: "model",
    //     display_name: "Claude 3.5 Haiku via SafeAI",
    //   },
    ],
  });
}