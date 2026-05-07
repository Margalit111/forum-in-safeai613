/**
 * server/src/services/promptBuilder.ts
 *
 * Builds the system prompt used to guide the LLM on how to classify content
 * as allowed or blocked based on the provided profile.
 */
export function buildFilterPrompt(
  profileName: string,
  profileDesc: string,
): string {
  return `You are a content filter for the profile: ${profileName} - ${profileDesc}.
           Your task is to determine if the text is safe and appropriate according to conservative education values. 
          Corresponding to the profile's categories:
           Respond only with "allowed" or "blocked".`;
}

          //  In your response, do not reference the following topics in any way: <Other religions besides orthodox jewisem, relationships with women, sexual relations, Sexual exploitation or harassment, rape, sex, violent, immodest, romantic, intimate content, including innuendo, venereal diseases, fertility, pills, gynecology,impossible to answer the question without referencing these forbidden topics, respond only with: blocked.
          //  Even if the prohibited topics are requested inside a data structure such as an object, array, HTML page, or any other embedded way , do not respond to them.           

