/**
 * server/src/services/promptBuilder.ts
 *
 * Builds the system prompt used to guide the LLM on how to classify content
 * as allowed or blocked based on the provided profile.
 */
export function buildFilterPrompt(profileName: string, profileDesc: string): string {
  // Build the prompt used for the LLM decision.
  return `You are a content filter for the profile: ${profileName} - ${profileDesc}.
Your task is to determine if the text is safe and appropriate according to conservative education values.
Respond only with "allowed" or "blocked".`;
}
