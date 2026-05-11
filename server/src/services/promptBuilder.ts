/**
 * server/src/services/promptBuilder.ts
 *
 */
import { PromptService } from "./promptService";


export async function buildSystemPrompt(profile: any): Promise<string> {
  const dbPrompt = await PromptService.getPromptByCode("SYSTEM_PROMPT");

  return [
    dbPrompt.content,
    ...(profile?.contentPrompts || []),
    ...(profile?.behaviorPrompts || []),
    ...(profile?.knowledgePrompts || []),
  ]
    .filter(Boolean)
    .join("\n\n");
}



export async function buildFilterPrompt(
  profileName: string,
  profileDesc: string,
): Promise<string> {
  const dbPrompt = await PromptService.getPromptByCode("FILTER_PROMPT");

  return `
${dbPrompt.content}

Profile name: ${profileName}
Profile description: ${profileDesc}

Respond only with "allowed" or "blocked".
`.trim();
}
