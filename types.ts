
export enum AppView {
  CHAT = 'CHAT',
  IMAGE_LAB = 'IMAGE_LAB',
  LIVE_VOICE = 'LIVE_VOICE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  groundingUrls?: { title: string; uri: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  timestamp: number;
}
