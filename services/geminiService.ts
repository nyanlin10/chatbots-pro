
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

// Helper to determine if ANY AI is enabled
export const isAIEnabled = (appData: AppData): boolean => {
  return !!(
    (appData.geminiKeys && appData.geminiKeys.length > 0) || 
    process.env.API_KEY || 
    (appData.openAiKeys && appData.openAiKeys.length > 0) || 
    appData.customApiKey
  );
};

export const generateAIResponse = async (
  userMessage: string,
  appData: AppData
): Promise<string> => {
  // 1. Prepare Context based on Types
  const textRules = appData.kb.filter(item => item.type === 'text');
  const files = appData.kb.filter(item => item.type === 'file');
  const urls = appData.kb.filter(item => item.type === 'url');

  const kbContext = `
    --- KNOWLEDGE BASE (Q&A Rules) ---
    ${textRules.map(item => `Q: ${item.key}\nA: ${item.answer}`).join('\n')}

    --- REFERENCE DOCUMENTS (File Content) ---
    ${files.map(item => `Filename: ${item.key}\nContent Snippet: ${item.answer.slice(0, 1000)}...`).join('\n\n')}

    --- RELEVANT LINKS (Social Media & Websites) ---
    ${urls.map(item => `Description: ${item.key}\nURL: ${item.answer}`).join('\n')}
  `;

  const systemInstruction = `
    ${appData.systemPrompt}
    
    Here is your internal Knowledge Base. Use this information to answer user questions if relevant.
    
    INSTRUCTIONS:
    1. If the answer is in the "KNOWLEDGE BASE" (Q&A), use it directly.
    2. If the user asks about a document, summarize information from "REFERENCE DOCUMENTS".
    3. If the user asks for links, websites, or social media, provide the exact URLs from "RELEVANT LINKS".
    4. If the answer is not found in the context below, use your general knowledge but be helpful.
    
    ${kbContext}
    ----------------------
  `;

  let errors: string[] = [];

  // --- STRATEGY 1: GEMINI ROTATION ---
  // Combine stored keys with env key (if not already in list)
  const geminiKeys = [...(appData.geminiKeys || [])];
  if (process.env.API_KEY && !geminiKeys.includes(process.env.API_KEY)) {
    geminiKeys.push(process.env.API_KEY);
  }

  if (geminiKeys.length > 0) {
    console.log(`Starting Gemini strategy with ${geminiKeys.length} keys.`);
    
    for (let i = 0; i < geminiKeys.length; i++) {
      const apiKey = geminiKeys[i];
      try {
        console.log(`Attempting Gemini Key ${i + 1}/${geminiKeys.length}`);
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });
        return response.text || "No text returned from Gemini.";
      } catch (error) {
        console.warn(`Gemini Key ${i + 1} Failed:`, error);
        errors.push(`Gemini [Key ${i}]: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue to next key in loop...
      }
    }
  }

  // --- STRATEGY 2: OPENAI ROTATION (Fallback 1) ---
  const openAiKeys = appData.openAiKeys || [];
  if (openAiKeys.length > 0) {
    console.log(`Gemini failed/missing. Starting OpenAI strategy with ${openAiKeys.length} keys.`);
    
    for (let i = 0; i < openAiKeys.length; i++) {
      const apiKey = openAiKeys[i];
      try {
        console.log(`Attempting OpenAI Key ${i + 1}/${openAiKeys.length}`);
        return await callGenericLLM(
          'https://api.openai.com/v1',
          apiKey,
          'gpt-3.5-turbo',
          systemInstruction,
          userMessage
        );
      } catch (error) {
        console.warn(`OpenAI Key ${i + 1} Failed:`, error);
        errors.push(`OpenAI [Key ${i}]: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue...
      }
    }
  }

  // --- STRATEGY 3: CUSTOM / DEEPSEEK / GROQ (Fallback 2) ---
  if (appData.customApiKey) {
    try {
      console.log("OpenAI unavailable/failed. Attempting Custom Provider...");
      const baseUrl = appData.customBaseUrl.replace(/\/+$/, ""); // Trim trailing slash
      
      return await callGenericLLM(
        baseUrl,
        appData.customApiKey,
        appData.customModel || 'gpt-3.5-turbo', // Fallback model name
        systemInstruction,
        userMessage
      );
    } catch (error) {
      console.error("Custom Provider Failed:", error);
      errors.push(`Custom: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // If we get here, everything failed
  return `Service Unavailable. I am currently offline due to technical limits. (Debug: ${errors.length} attempts failed)`;
};

// Generic function for OpenAI-compatible APIs (OpenAI, DeepSeek, Groq, LocalAI)
async function callGenericLLM(
  baseUrl: string, 
  apiKey: string, 
  model: string, 
  systemPrompt: string, 
  userMessage: string
): Promise<string> {
  
  let endpoint = `${baseUrl}/chat/completions`;
  if (baseUrl.includes('/chat/completions')) {
    endpoint = baseUrl;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API request failed with status ${response.status}`);
  }

  return data.choices?.[0]?.message?.content || "No response text received.";
}
