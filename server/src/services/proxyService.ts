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
  if (lower.startsWith("llama") || lower.startsWith("groq") || lower.startsWith("qwen")) return "groq";

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

  // const result = await evaluateText({
  //   profileId: profile ? profile._id?.toString() : "",
  //   text: userQuery,
  // });

const result = {allowed: true};

  if (!result.allowed) {
    throw new Error("Content blocked");
  }

  // 4. הוספת system prompts

  const systemPrompt = [
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
  console.log("--- DEBUG PROXY REQUEST ---");
  console.log("🔑 Provider:", provider);
  console.log("🔑 Model:", model);
  console.log("🔑 Provider API Key (last 4):", providerApiKey.slice(-4));

  console.log("---------------------------");
  console.log("🚀 DEPLOYMENT CHECK: Version 1.0.5 - Headers: api-key present");

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
    console.error("❌ LiteLLM Error Response:", errorText);
    throw new Error(`LiteLLM request failed: ${errorText}`);
  }

  // 6. 🎯 החזרת התשובה - זה הקריטי!
  if (body.stream) {
    // החזר את ה-stream
    console.log("✅ Returning stream");

    // For streaming, we need to intercept the stream to collect usage data
    const reader = litellmResponse.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get stream reader");
    }

    const decoder = new TextDecoder();
    let accumulatedUsage = {
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
              console.log(
                "📊 Logging usage for streaming request, user:",
                user._id,
              );
              console.log(
                "📊 Accumulated tokens:",
                accumulatedUsage.total_tokens,
              );

              // Fix: Calculate cost properly - if responseCost is 0, calculate from tokens
              // Normalize model name to include provider prefix for cost calculation
              const normalizedModel = normalizeModelName(model, provider);
              let streamCost = responseCost;
              if (!streamCost || streamCost === 0) {
                streamCost = calculateCostFromTokens(accumulatedUsage, normalizedModel);
                console.log(`📊 LiteLLM didn't provide cost, calculated from tokens using model: ${normalizedModel}: $${streamCost.toFixed(6)}`);
              } else {
                console.log(`📊 Using LiteLLM provided cost: $${streamCost.toFixed(6)}`);
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
                console.error("❌ Failed to log streaming usage:", err),
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
        } catch (error) {
          console.error("❌ Error in stream processing:", error);
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
    console.log(`💰 LiteLLM didn't provide cost, calculated from tokens using model: ${normalizedModel}: $${cost.toFixed(6)}`);
  } else {
    console.log(`💰 Using LiteLLM provided cost: $${cost.toFixed(6)}`);
  }
  
  console.log("✅ Response received from LiteLLM:");
  console.log("- ID:", data.id);
  console.log("- Model:", data.model);
  console.log(
    "- Content:",
    data.choices?.[0]?.message?.content?.substring(0, 50) + "...",
  );
  console.log("- Tokens:", data.usage?.total_tokens);

  // 7. Log usage
  const responseTime = Date.now() - startTime;
  console.log("📊 Logging usage for user:", user._id);
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
    console.log("✅ Usage logged successfully");
  } catch (logError) {
    console.error("❌ Failed to log usage:", logError);
  }

  // 🚨 זה החלק הכי חשוב - להחזיר את הדאטה!
  return data;
}
