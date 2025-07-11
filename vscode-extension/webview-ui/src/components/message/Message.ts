export interface Message {
  sender: 'user' | 'llm';
  content: string;
}