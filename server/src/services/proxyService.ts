import { evaluateText } from "./filterService";
import { AIProfile } from "../models";
import { decryptSecret } from "../utils/crypto";
import {
  getProviderKeyByUserAndProvider,
  getSystemProviderKey,
} from "../repositories/providerKeyRepository";
import { OpenAI } from "openai";

/**
 * מזהה provider מתוך model
 */
function getProviderFromModel(model: string): string {
  // אם יש prefix → הכי אמין
  if (model.includes("/")) {
    return model.split("/")[0] || "unknown";
  }

  const lower = model.toLowerCase();

  if (lower.startsWith("gpt")) return "openai";
  if (lower.startsWith("claude")) return "anthropic";
  if (lower.startsWith("gemini")) return "google";

  throw new Error(`Unsupported model: ${model}`);
}

export async function proxyChatCompletion(user: any, body: any) {
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


  // 3. סינון טקסט (Content Filtering)
  const profile = await AIProfile.findById(user.profileId);

  if (!profile) {
    throw new Error("Profile not found");
  }
  const lastMessage = body.messages[body.messages.length - 1].content;

  if (!lastMessage || typeof lastMessage !== "string") {
    throw new Error("Missing message content");
  }

  const result = await evaluateText({
    profileId: profile ? profile._id?.toString() : "",
    text: lastMessage,
  });

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



//   const litellmClient = new OpenAI({
//     apiKey: decryptedLiteLLMKey,
// baseURL: `${process.env.LITELLM_PROXY_URL}/v1`,
// defaultHeaders: {
//       // ה-Proxy מחפש את זה כדי לדעת איזה מפתח להעביר לספק (OpenAI)
//      "x-api-key": providerApiKey 
//     }
//   });

//   const requestBody = {
//     model: model,
//     messages: messages,
//     stream: body.stream ?? false, // ברירת מחדל false
//     ...(providerApiKey && { api_key: providerApiKey }), // הוספת המפתח ל-body
//   } as any; // bypass TypeScript


//   const response = await litellmClient.chat.completions.create(
//     requestBody,
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

  const litellmResponse = await fetch(
    `${process.env.LITELLM_PROXY_URL}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${decryptedLiteLLMKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: body.stream ?? false,
        // 🎯 המפתח של הספק
        api_key: providerApiKey,
      }),
    }
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
    return litellmResponse.body;
  }

  // החזר את ה-JSON
  const data: any = await litellmResponse.json();
  
  console.log("✅ Response received from LiteLLM:");
  console.log("- ID:", data.id);
  console.log("- Model:", data.model);
  console.log("- Content:", data.choices?.[0]?.message?.content?.substring(0, 50) + "...");
  console.log("- Tokens:", data.usage?.total_tokens);

  // 🚨 זה החלק הכי חשוב - להחזיר את הדאטה!
  return data;
}



