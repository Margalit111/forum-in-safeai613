export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ModelPricing {
  input: number;
  output: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI GPT-5.4 models
  "openai/gpt-5.4": {
    input: 0.01 / 1000,
    output: 0.03 / 1000,
  },
  "openai/gpt-5.4-mini": {
    input: 0.00025 / 1000,
    output: 0.002 / 1000,
  },
  "openai/gpt-5.4-nano": {
    input: 0.00005 / 1000,
    output: 0.0004 / 1000,
  },
  
  // OpenAI O3 models
  "openai/o3-pro": {
    input: 0.02 / 1000,
    output: 0.06 / 1000,
  },
  "openai/o3": {
    input: 0.015 / 1000,
    output: 0.045 / 1000,
  },
  "openai/o3-mini": {
    input: 0.001 / 1000,
    output: 0.003 / 1000,
  },
  
  // Anthropic Claude 4 models
  "anthropic/claude-opus-4-6": {
    input: 0.015 / 1000,
    output: 0.075 / 1000,
  },
  "anthropic/claude-sonnet-4-6": {
    input: 0.003 / 1000,
    output: 0.015 / 1000,
  },
  "anthropic/claude-haiku-4-5": {
    input: 0.0008 / 1000,
    output: 0.004 / 1000,
  },
  
  // Google Gemini 3 models
  "gemini/gemini-3.1-pro": {
    input: 0.00125 / 1000,
    output: 0.005 / 1000,
  },
  "gemini/gemini-3-flash": {
    input: 0.000075 / 1000,
    output: 0.0003 / 1000,
  },
  "gemini/gemini-3.1-flash-lite": {
    input: 0.00001 / 1000,
    output: 0.00004 / 1000,
  },
  
  // Google Gemini 2.5 models
  "gemini/gemini-2.5-pro": {
    input: 0.00125 / 1000,
    output: 0.005 / 1000,
  },
  "gemini/gemini-2.5-flash": {
    input: 0.000075 / 1000,
    output: 0.0003 / 1000,
  },
  "gemini/gemini-2.5-flash-lite": {
    input: 0.00001 / 1000,
    output: 0.00004 / 1000,
  },
  
  // Groq models (most are free/very cheap)
  "groq/groq/compound": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/groq/compound-mini": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/llama-3.1-8b-instant": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/llama-3.3-70b-versatile": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/openai/gpt-oss-120b": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/openai/gpt-oss-20b": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/meta-llama/llama-4-scout-17b-16e-instruct": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
  "groq/qwen/qwen3-32b": {
    input: 0.0 / 1000,
    output: 0.0 / 1000,
  },
};

export function calculateCostFromTokens(
  usage: TokenUsage | null | undefined,
  model: string,
): number {
  const pricing = MODEL_PRICING[model];

  if (!usage) {
    console.warn(`[calculateCostFromTokens] No usage data provided for model: ${model}`);
    return 0;
  }

  if (!pricing) {
    console.warn(`[calculateCostFromTokens] No pricing found for model: ${model}. Available models:`, Object.keys(MODEL_PRICING).slice(0, 5));
    return 0;
  }

  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  const calculatedCost = promptTokens * pricing.input + completionTokens * pricing.output;

  console.log(`[calculateCostFromTokens] Model: ${model}, Prompt: ${promptTokens}, Completion: ${completionTokens}, Cost: $${calculatedCost.toFixed(6)}`);

  return calculatedCost;
}
