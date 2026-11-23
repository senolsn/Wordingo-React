export interface Word {
  id: string;
  en: string;
  tr: string;
  wrong_count?: number;
}

export interface WordGroup {
  id: string;
  name: string;
  description: string;
  level: string; // A1, A2, B1, etc.
  words: Word[];
  createdAt: number;
  perfect_completion_count?: number;
}

export enum ViewState {
  DECKS = 'DECKS',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  QUIZ = 'QUIZ',
  FLASHCARD = 'FLASHCARD',
  IRREGULAR_VERBS = 'IRREGULAR_VERBS',
  MISTAKES = 'MISTAKES',
  SETTINGS = 'SETTINGS',
  PROFILE = 'SETTINGS',
}

export interface IrregularVerb {
  id: string;
  v1: string; // Base Form (Infinitive)
  v2: string; // Past Simple
  v3: string; // Past Participle
  tr: string; // Türkçe Anlamı
}

// Quiz yönü: Türkçe'den İngilizce'ye veya İngilizce'den Türkçe'ye
export type QuizDirection = 'tr-to-en' | 'en-to-tr';

export interface QuizQuestion {
  targetWord: Word;
  options: string[]; // Mixed options including the correct answer
  correctOption: string;
  distractors: string[];
}

export interface WrongAnswer {
  word: Word;
  userAnswer: string;
  correctAnswer: string;
}

export interface UserProfile {
  id: string;
  email: string;
  streak_days: number;
  last_active_date: string;
  study_time_minutes: number;
  daily_goal_words: number;
  theme_preference: 'dark' | 'light';
  created_at?: string;
  updated_at?: string;
}
