
import { AppData, DEFAULT_DATA } from '../types';

const DB_KEY = 'service_pro_db_v1';

export const getAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (!stored) {
      saveAppData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    
    const parsed = JSON.parse(stored);
    
    // Merge to ensure new fields exist
    const data: AppData = { ...DEFAULT_DATA, ...parsed };

    // --- Migration Logic for Single Key -> Multi Key ---
    // If old 'apiKey' exists and 'geminiKeys' is empty, move it
    if ((parsed as any).apiKey && (!data.geminiKeys || data.geminiKeys.length === 0)) {
       data.geminiKeys = [(parsed as any).apiKey];
       console.log("Migrated single Gemini key to key list");
    }

    // If old 'openAiKey' exists and 'openAiKeys' is empty, move it
    if ((parsed as any).openAiKey && (!data.openAiKeys || data.openAiKeys.length === 0)) {
       data.openAiKeys = [(parsed as any).openAiKey];
       console.log("Migrated single OpenAI key to key list");
    }
    
    return data;
  } catch (e) {
    console.error("Failed to load data", e);
    return DEFAULT_DATA;
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    // Remove old keys if they exist in the object before saving to keep storage clean
    const dataToSave = { ...data };
    delete (dataToSave as any).apiKey;
    delete (dataToSave as any).openAiKey;
    
    localStorage.setItem(DB_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};
