
export interface KBItem {
  id: number;
  type: 'text' | 'file' | 'url';
  key: string; // Keyword / Filename / Description
  answer: string; // Answer / File Content / URL
}

export interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
}

export interface AppData {
  // Identity
  botName: string;
  botAvatar: string; // Base64 string

  kb: KBItem[];
  quickReplies: string[];
  systemPrompt: string;
  adminPass: string;
  
  // Session State
  isAdminLoggedIn: boolean;
  
  // Chat History (Database)
  messages: Message[];
  
  // API Configurations
  geminiKeys: string[]; // List of Gemini Keys for rotation
  openAiKeys: string[]; // List of OpenAI Keys for rotation
  
  // Custom / Universal Provider (DeepSeek, Groq, LocalAI)
  customApiKey: string;
  customBaseUrl: string;
  customModel: string;
}

export type ViewState = 'chat' | 'login' | 'admin';

export const DEFAULT_DATA: AppData = {
  botName: 'Service Pro',
  botAvatar: '', // Empty defaults to Icon
  
  kb: [
    { id: 1, type: 'text', key: 'price', answer: 'Our service prices are: Basic: $50, Pro: $100.' },
    { id: 2, type: 'text', key: 'location', answer: 'We are located at 123 Main St, Tech City.' },
    { id: 3, type: 'text', key: 'hello', answer: 'Hello! Welcome to Service Pro. How can I help you today?' },
    { id: 4, type: 'text', key: 'contact', answer: 'You can reach us at contact@servicepro.com' }
  ],
  quickReplies: ['How much is it?', 'Where are you located?', 'Speak to Admin'],
  systemPrompt: 'You are a helpful customer service assistant named Service Pro. Be polite, concise, and professional.',
  adminPass: 'admin123',
  
  isAdminLoggedIn: false,
  
  messages: [
    { id: 'init', text: 'Hello! Welcome to Service Pro. How can I help you today?', sender: 'bot', timestamp: Date.now() }
  ],
  
  geminiKeys: [],
  openAiKeys: [],
  
  // Default to DeepSeek settings as an example, but empty key
  customApiKey: '',
  customBaseUrl: 'https://api.deepseek.com/v1', 
  customModel: 'deepseek-chat'
};
