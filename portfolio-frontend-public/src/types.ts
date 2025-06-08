export interface ChatMessageInterface {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};