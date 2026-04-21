import { evaluateText } from "./filterService";
import { AIProfile } from "../models";
import { decryptSecret } from "../utils/crypto";
import {
  getProviderKeyByUserAndProvider,
  getSystemProviderKey,
} from "../repositories/providerKeyRepository";
import { OpenAI } from "openai";
import { logUsage } from "./usageTracker";
import { isProviderKeyFree } from "../middleware/rateLimiter";
import { calculateCostFromTokens } from "../utils/costs";
import logger from "../logger";
/**
 * מזהה provider מתוך model
 */
function getProviderFromModel(model: string): string {
  // אם יש prefix → הכי אמין
  if (model.includes("/")) {
    return model.split("/")[0] || "unknown";
  }

  const lower = model.toLowerCase();

  if (lower.startsWith("gpt") || lower.startsWith("o3")) return "openai";
  if (lower.startsWith("claude")) return "anthropic";
  if (lower.startsWith("gemini")) return "google";
  if (
    lower.startsWith("llama") ||
    lower.startsWith("groq") ||
    lower.startsWith("qwen")
  )
    return "groq";

  if (
    lower.startsWith("dall-e") ||
    lower.startsWith("tts") ||
    lower.startsWith("whisper")
  )
    return "openai";

  throw new Error(`Unsupported model: ${model}`);
}

/**
 * נורמליזציה של שם המודל - מוסיף prefix של provider אם חסר
 */
function normalizeModelName(model: string, provider: string): string {
  // אם כבר יש prefix, החזר כמו שזה
  if (model.includes("/")) {
    return model;
  }

  // אחרת, הוסף את ה-provider כ-prefix
  return `${provider}/${model}`;
}

export async function proxyChatCompletion(user: any, body: any) {
  const startTime = Date.now();
  const model = body.model;

  if (!model) {
    throw new Error("Model is required");
  }

  // 1. זיהוי הספק
  const provider = getProviderFromModel(model);

  let providerKey;

  // 2. השגת מפתח הספק של המשתמש
  const providerKeyDoc =
    user.mode === "MANAGED"
      ? await getSystemProviderKey(provider)
      : await getProviderKeyByUserAndProvider(user._id.toString(), provider);

  if (!providerKeyDoc) {
    throw new Error(`Provider key missing for provider: ${provider}`);
  }

  const providerApiKey = decryptSecret(providerKeyDoc.apiKeyEncrypted);

  // Check if this provider key is free
  const isFree = isProviderKeyFree(user, providerKeyDoc._id.toString());

  // 3. סינון טקסט (Content Filtering)
  const profile = await AIProfile.findById(user.profileId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  // חילוץ ההודעה האחרונה מהמערך
  const lastMessageRaw = body.messages[body.messages.length - 1]?.content;
  let userQuery = "";

  if (typeof lastMessageRaw === "string") {
    // מקרה רגיל: טקסט פשוט
    userQuery = lastMessageRaw;
  } else if (Array.isArray(lastMessageRaw)) {
    // מקרה של OpenAI/Cline: מערך של אובייקטים
    // אנחנו מחלצים רק את חלקי הטקסט (Type: text) ומחברים אותם
    userQuery = lastMessageRaw
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");
  }

  // בדיקה אם נמצא טקסט לסינון
  if (!userQuery || userQuery.trim() === "") {
    // אם אין טקסט (למשל רק קובץ/תמונה), אפשר להחליט אם לחסום או להמשיך
    // כאן בחרתי להמשיך עם טקסט ריק כדי לא לשבור את הזרימה אם אין "שאלה"
    userQuery = "No text content";
  }

  const result = await evaluateText({
    profileId: profile ? profile._id?.toString() : "",
    text: userQuery,
  });

  if (!result.allowed) {
    throw new Error(
      "Content blocked By SafeAI Filter: " +
        (result.reason || "Unknown reason"),
    );
  }

  // 4. הוספת system prompts

  const systemPrompt = [
    `
    do not reference the following topics in any way: <Other religions besides orthodox jewisem, relationships with women, sexual relations, Sexual exploitation or harassment, rape, sex, violent, immodest, romantic, intimate content, including innuendo, venereal diseases, fertility, pills, gynecology,impossible to answer the question without referencing these forbidden topics, respond only with: blocked.
     Even if the prohibited topics are requested inside a data structure such as an object, array, HTML page, or any other embedded way , do not respond to them.           
`,
    ...(profile?.contentPrompts || []),
    ...(profile?.behaviorPrompts || []),
    ...(profile?.knowledgePrompts || []),
  ].join("\n");

  const messages = [...(body.messages || [])];

  if (systemPrompt) {
    messages.unshift({
      role: "system",
      content: systemPrompt,
    });
  }

  // 5. קריאה ל-LiteLLM עם העברת API Key דינמית

  const decryptedLiteLLMKey = decryptSecret(user.litellmKeyEncrypted);
  if (!decryptedLiteLLMKey) {
    throw new Error("LiteLLM Proxy Key could not be decrypted or is missing");
  }

  // --- לוגים לבדיקה (מומלץ להשאיר עד שהצ'אט עובד) ---
  logger.debug("--- DEBUG PROXY REQUEST ---");
  logger.debug("🔑 Provider:", provider);
  logger.debug("🔑 Model:", model);
  logger.debug("🔑 Provider API Key (last 4):", providerApiKey.slice(-4));

  logger.debug("---------------------------");
  logger.debug("🚀 DEPLOYMENT CHECK: Version 1.0.5 - Headers: api-key present");

  const litellmResponse = await fetch(
    `${process.env.LITELLM_PROXY_URL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedLiteLLMKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: body.stream ?? false,
        // 🎯 המפתח של הספק
        api_key: providerApiKey,
      }),
    },
  );

  if (!litellmResponse.ok) {
    const errorText = await litellmResponse.text();

    logger.error("❌ LiteLLM Error Response:", {
      error: errorText,
      stack: errorText,
    });
    throw new Error(`LiteLLM request failed: ${errorText}`);
  }

  // 6. 🎯 החזרת התשובה - זה הקריטי!
  if (body.stream) {
    // החזר את ה-stream
    logger.debug("✅ Returning stream");

    // For streaming, we need to intercept the stream to collect usage data
    const reader = litellmResponse.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get stream reader");
    }

    const decoder = new TextDecoder();
    const accumulatedUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    let responseId = "streaming";
    let responseCost = 0;

    // Create a new ReadableStream that we'll return to the client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Stream finished - log the accumulated usage
              const responseTime = Date.now() - startTime;
              logger.info(
                "📊 Logging usage for streaming request, user:",
                user._id,
              );
              logger.info(
                "📊 Accumulated tokens:",
                accumulatedUsage.total_tokens,
              );

              // Fix: Calculate cost properly - if responseCost is 0, calculate from tokens
              // Normalize model name to include provider prefix for cost calculation
              const normalizedModel = normalizeModelName(model, provider);
              let streamCost = responseCost;
              if (!streamCost || streamCost === 0) {
                streamCost = calculateCostFromTokens(
                  accumulatedUsage,
                  normalizedModel,
                );
                logger.info(
                  `📊 LiteLLM didn't provide cost, calculated from tokens using model: ${normalizedModel}: $${streamCost.toFixed(6)}`,
                );
              } else {
                logger.info(
                  `📊 Using LiteLLM provided cost: $${streamCost.toFixed(6)}`,
                );
              }

              logUsage({
                userId: user._id.toString(),
                profileId: user.profileId?.toString(),
                provider,
                modelName: model,
                mode: user.mode,
                response: {
                  id: responseId,
                  usage: accumulatedUsage,
                  _hidden_params: { response_cost: responseCost },
                },
                responseTime,
                success: true,
                isFree,
                cost: streamCost,
              }).catch((err) =>
                logger.error("❌ Failed to log streaming usage:", {
                  error: err.message,
                  stack: err.stack,
                }),
              );

              controller.close();
              break;
            }

            // Parse the chunk to extract usage information
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  // Extract usage data if present
                  if (parsed.usage) {
                    accumulatedUsage.prompt_tokens +=
                      parsed.usage.prompt_tokens || 0;
                    accumulatedUsage.completion_tokens +=
                      parsed.usage.completion_tokens || 0;
                    accumulatedUsage.total_tokens +=
                      parsed.usage.total_tokens || 0;
                  }
                  // Extract cost if present
                  if (parsed._hidden_params?.response_cost) {
                    responseCost = parsed._hidden_params.response_cost;
                  }

                  // Extract response ID
                  if (parsed.id) {
                    responseId = parsed.id;
                  }
                } catch (e) {
                  // Not valid JSON, skip
                }
              }
            }

            // Forward the chunk to the client
            controller.enqueue(value);
          }
        } catch (error: any) {
          logger.error("❌ Error in stream processing:", {
            error: error.message,
            stack: error.stack,
          });
          controller.error(error);
        }
      },
    });

    return stream;
  }

  // החזר את ה-JSON
  const data: any = await litellmResponse.json();

  // Fix: Calculate cost properly - if LiteLLM doesn't provide cost, calculate from tokens
  // Normalize model name to include provider prefix for cost calculation
  const normalizedModel = normalizeModelName(model, provider);
  let cost = data?._hidden_params?.response_cost;
  if (!cost || cost === 0) {
    cost = calculateCostFromTokens(data.usage, normalizedModel);
    logger.info(
      `💰 LiteLLM didn't provide cost, calculated from tokens using model: ${normalizedModel}: $${cost.toFixed(6)}`,
    );
  } else {
    logger.info(`💰 Using LiteLLM provided cost: $${cost.toFixed(6)}`);
  }

  logger.debug("✅ Response received from LiteLLM:");
  logger.info("- ID:", data.id);
  logger.info("- Model:", data.model);
  logger.info(
    "- Content:",
    data.choices?.[0]?.message?.content?.substring(0, 50) + "...",
  );
  logger.info("- Tokens:", data.usage?.total_tokens);

  // 7. Log usage
  const responseTime = Date.now() - startTime;
  logger.debug("📊 Logging usage for user:", user._id);
  try {
    await logUsage({
      userId: user._id.toString(),
      profileId: user.profileId?.toString(),
      provider,
      modelName: model,
      mode: user.mode,
      response: data,
      responseTime,
      success: true,
      isFree,
      cost,
    });
    logger.debug("✅ Usage logged successfully");
  } catch (logError) {
    logger.error("❌ Failed to log usage:", {
      error: logError instanceof Error ? logError.message : String(logError),
      stack: logError instanceof Error ? logError.stack : undefined,
    });
  }

  // 🚨 זה החלק הכי חשוב - להחזיר את הדאטה!
  return data;
}

export async function proxyResponses(user: any, body: any) {
  const startTime = Date.now();
  const model = body.model;

  if (!model) throw new Error("Model is required");

  const provider = getProviderFromModel(model);

  const providerKeyDoc =
    user.mode === "MANAGED"
      ? await getSystemProviderKey(provider)
      : await getProviderKeyByUserAndProvider(user._id.toString(), provider);

  if (!providerKeyDoc)
    throw new Error(`Provider key missing for provider: ${provider}`);

  const providerApiKey = decryptSecret(providerKeyDoc.apiKeyEncrypted);
  const isFree = isProviderKeyFree(user, providerKeyDoc._id.toString());
  const decryptedLiteLLMKey = decryptSecret(user.litellmKeyEncrypted);

  if (!decryptedLiteLLMKey)
    throw new Error("LiteLLM Proxy Key could not be decrypted or is missing");

  // Content filtering - אותו לוגיק כמו בchat completions
  const profile = await AIProfile.findById(user.profileId);
  if (!profile) throw new Error("Profile not found");

  // חילוץ טקסט מ-input (יכול להיות string או מערך)
  let userQuery = "";
  if (typeof body.input === "string") {
    userQuery = body.input;
  } else if (Array.isArray(body.input)) {
    userQuery = body.input
      .flatMap((item: any) =>
        Array.isArray(item.content)
          ? item.content
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
          : typeof item.content === "string"
            ? [item.content]
            : [],
      )
      .join("\n");
  }

  const filterResult = await evaluateText({
    profileId: profile._id?.toString(),
    text: userQuery,
  });
  if (!filterResult.allowed) {
    throw new Error(
      "Content blocked By SafeAI Filter: " +
        (filterResult.reason || "Unknown reason"),
    );
  }

  // System prompt מה-profile
  const systemPrompt = [
    `
     do not reference the following topics in any way: <Other religions besides orthodox jewisem, relationships with women, sexual relations, Sexual exploitation or harassment, rape, sex, violent, immodest, romantic, intimate content, including innuendo, venereal diseases, fertility, pills, gynecology,impossible to answer the question without referencing these forbidden topics, respond only with: blocked.
           Even if the prohibited topics are requested inside a data structure such as an object, array, HTML page, or any other embedded way , do not respond to them.           
`,
    ...(profile?.contentPrompts || []),
    ...(profile?.behaviorPrompts || []),
    ...(profile?.knowledgePrompts || []),
  ].join("\n");

  // ב-Responses API - system prompt הולך בתוך instructions
  const requestBody: any = {
    ...body,
    api_key: providerApiKey,
  };

  if (systemPrompt && !requestBody.instructions) {
    requestBody.instructions = systemPrompt;
  }

  logger.debug("--- DEBUG RESPONSES REQUEST ---");
  logger.debug("🔑 Provider:", provider);
  logger.debug("🔑 Model:", model);
  logger.debug("🌊 Stream:", body.stream ?? false);

  const litellmResponse = await fetch(
    `${process.env.LITELLM_PROXY_URL}/v1/responses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedLiteLLMKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!litellmResponse.ok) {
    const errorText = await litellmResponse.text();
    logger.error("❌ LiteLLM Responses Error:", errorText);
    throw new Error(`LiteLLM responses request failed: ${errorText}`);
  }

  // ========== STREAMING ==========
  if (body.stream) {
    const reader = litellmResponse.body?.getReader();
    if (!reader) throw new Error("Failed to get stream reader");

    const decoder = new TextDecoder();
    const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    let responseId = "streaming";
    let responseCost = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              const responseTime = Date.now() - startTime;
              const normalizedModel = normalizeModelName(model, provider);
              const streamCost =
                responseCost || calculateCostFromTokens(usage, normalizedModel);

              logUsage({
                userId: user._id.toString(),
                profileId: user.profileId?.toString(),
                provider,
                modelName: model,
                mode: user.mode,
                response: {
                  id: responseId,
                  usage,
                  _hidden_params: { response_cost: responseCost },
                },
                responseTime,
                success: true,
                isFree,
                cost: streamCost,
              }).catch((err) =>
                logger.error(
                  "❌ Failed to log streaming responses usage:",
                  err,
                ),
              );

              controller.close();
              break;
            }

            // פרסור events מה-stream לחילוץ usage
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);

                // Responses API - usage מגיע ב-response.completed event
                if (
                  parsed.type === "response.completed" &&
                  parsed.response?.usage
                ) {
                  const u = parsed.response.usage;
                  usage.prompt_tokens = u.input_tokens || 0;
                  usage.completion_tokens = u.output_tokens || 0;
                  usage.total_tokens =
                    (u.input_tokens || 0) + (u.output_tokens || 0);
                }

                if (parsed._hidden_params?.response_cost) {
                  responseCost = parsed._hidden_params.response_cost;
                }

                if (parsed.response?.id || parsed.id) {
                  responseId = parsed.response?.id || parsed.id;
                }
              } catch (_) {
                // not JSON, skip
              }
            }

            controller.enqueue(value);
          }
        } catch (error: any) {
          logger.error("❌ Error in responses stream:", error.message);
          controller.error(error);
        }
      },
    });

    return stream;
  }

  // ========== NON-STREAMING ==========
  const data: any = await litellmResponse.json();

  // Responses API מחזיר usage עם input_tokens/output_tokens (לא prompt/completion)
  const usageNormalized = {
    prompt_tokens: data.usage?.input_tokens || 0,
    completion_tokens: data.usage?.output_tokens || 0,
    total_tokens:
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };

  const normalizedModel = normalizeModelName(model, provider);
  let cost = data?._hidden_params?.response_cost;
  if (!cost || cost === 0) {
    cost = calculateCostFromTokens(usageNormalized, normalizedModel);
    logger.info(`💰 Calculated cost from tokens: $${cost.toFixed(6)}`);
  }

  logger.debug("✅ Responses API response received");
  logger.info("- ID:", data.id);
  logger.info("- Model:", data.model);
  logger.info("- Tokens:", usageNormalized.total_tokens);

  const responseTime = Date.now() - startTime;
  try {
    await logUsage({
      userId: user._id.toString(),
      profileId: user.profileId?.toString(),
      provider,
      modelName: model,
      mode: user.mode,
      response: { ...data, usage: usageNormalized },
      responseTime,
      success: true,
      isFree,
      cost,
    });
  } catch (logError: any) {
    logger.error("❌ Failed to log responses usage:", logError.message);
  }

  return data;
}

// ========== IMAGE GENERATION ==========
export async function proxyImageGeneration(user: any, body: any) {
  const startTime = Date.now();
  const model = body.model || "dall-e-3";
  const provider = getProviderFromModel(model);

  const providerKeyDoc =
    user.mode === "MANAGED"
      ? await getSystemProviderKey(provider)
      : await getProviderKeyByUserAndProvider(user._id.toString(), provider);

  if (!providerKeyDoc) throw new Error(`Provider key missing for: ${provider}`);

  const providerApiKey = decryptSecret(providerKeyDoc.apiKeyEncrypted);
  const isFree = isProviderKeyFree(user, providerKeyDoc._id.toString());
  const decryptedLiteLLMKey = decryptSecret(user.litellmKeyEncrypted);

  if (!decryptedLiteLLMKey) throw new Error("LiteLLM key missing");

  const litellmResponse = await fetch(
    `${process.env.LITELLM_PROXY_URL}/v1/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedLiteLLMKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, api_key: providerApiKey }),
    },
  );

  if (!litellmResponse.ok) {
    const err = await litellmResponse.text();
    throw new Error(`LiteLLM image generation failed: ${err}`);
  }

  const data: any = await litellmResponse.json();

  const responseTime = Date.now() - startTime;
  logUsage({
    userId: user._id.toString(),
    profileId: user.profileId?.toString(),
    provider,
    modelName: model,
    mode: user.mode,
    response: data,
    responseTime,
    success: true,
    isFree,
    cost: 0, // עלות תמונות - תחשב בנפרד לפי מודל/גדול
  }).catch((err) => logger.error("Failed to log image usage:", err));

  return data;
}

// ========== AUDIO TRANSCRIPTION (Whisper) ==========
export async function proxyAudioTranscription(
  user: any,
  formData: FormData, // מגיע מה-multipart
  model: string = "whisper-1",
) {
  const startTime = Date.now();
  const provider = getProviderFromModel(model);

  const providerKeyDoc =
    user.mode === "MANAGED"
      ? await getSystemProviderKey(provider)
      : await getProviderKeyByUserAndProvider(user._id.toString(), provider);

  if (!providerKeyDoc) throw new Error(`Provider key missing for: ${provider}`);

  const providerApiKey = decryptSecret(providerKeyDoc.apiKeyEncrypted);
  const isFree = isProviderKeyFree(user, providerKeyDoc._id.toString());
  const decryptedLiteLLMKey = decryptSecret(user.litellmKeyEncrypted);

  if (!decryptedLiteLLMKey) throw new Error("LiteLLM key missing");

  // מעביר את ה-FormData ישירות ל-LiteLLM
  const litellmResponse = await fetch(
    `${process.env.LITELLM_PROXY_URL}/v1/audio/transcriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedLiteLLMKey}`,
        // Content-Type לא מוגדר - fetch יוסיף boundary אוטומטית ל-multipart
      },
      body: formData,
    },
  );

  if (!litellmResponse.ok) {
    const err = await litellmResponse.text();
    throw new Error(`LiteLLM transcription failed: ${err}`);
  }

  const data: any = await litellmResponse.json();

  const responseTime = Date.now() - startTime;
  logUsage({
    userId: user._id.toString(),
    profileId: user.profileId?.toString(),
    provider,
    modelName: model,
    mode: user.mode,
    response: data,
    responseTime,
    success: true,
    isFree,
    cost: 0,
  }).catch((err) => logger.error("Failed to log transcription usage:", err));

  return data;
}

// ========== AUDIO SPEECH (TTS) ==========
export async function proxyAudioSpeech(user: any, body: any) {
  const startTime = Date.now();
  const model = body.model || "tts-1";
  const provider = getProviderFromModel(model);

  const providerKeyDoc =
    user.mode === "MANAGED"
      ? await getSystemProviderKey(provider)
      : await getProviderKeyByUserAndProvider(user._id.toString(), provider);

  if (!providerKeyDoc) throw new Error(`Provider key missing for: ${provider}`);

  const providerApiKey = decryptSecret(providerKeyDoc.apiKeyEncrypted);
  const isFree = isProviderKeyFree(user, providerKeyDoc._id.toString());
  const decryptedLiteLLMKey = decryptSecret(user.litellmKeyEncrypted);

  if (!decryptedLiteLLMKey) throw new Error("LiteLLM key missing");

  const litellmResponse = await fetch(
    `${process.env.LITELLM_PROXY_URL}/v1/audio/speech`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedLiteLLMKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, api_key: providerApiKey }),
    },
  );

  if (!litellmResponse.ok) {
    const err = await litellmResponse.text();
    throw new Error(`LiteLLM TTS failed: ${err}`);
  }

  // TTS מחזיר binary audio - לא JSON!
  const audioBuffer = await litellmResponse.arrayBuffer();
  const contentType =
    litellmResponse.headers.get("content-type") || "audio/mpeg";

  const responseTime = Date.now() - startTime;
  logUsage({
    userId: user._id.toString(),
    profileId: user.profileId?.toString(),
    provider,
    modelName: model,
    mode: user.mode,
    response: { id: "tts", usage: null },
    responseTime,
    success: true,
    isFree,
    cost: 0,
  }).catch((err) => logger.error("Failed to log TTS usage:", err));

  return { buffer: audioBuffer, contentType };
}
