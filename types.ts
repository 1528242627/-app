export enum Persona {
  MENTOR = 'MENTOR',
  FRIEND = 'FRIEND',
  PHILOSOPHER = 'PHILOSOPHER',
}

export type AiProvider = 'GOOGLE' | 'OPENAI';

export interface ApiConfig {
  id: string;
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string; // Optional for OpenAI compatible
  isEnabled: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  content: string;
  aiInsight?: string;
  mood?: string;
  updatedAt: number;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEntry: boolean;
}

export type ViewState = 'CALENDAR' | 'EDITOR' | 'SETTINGS';

export interface EditorProps {
  date: Date;
  onBack: () => void;
  onSave: (entry: DiaryEntry) => void;
}
