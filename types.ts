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
  PHRASAL_VERBS = 'PHRASAL_VERBS',
  OXFORD_3000 = 'OXFORD_3000',
  YDS_WORDS = 'YDS_WORDS',
  BUSINESS_ENGLISH = 'BUSINESS_ENGLISH',
  TRAVEL_WORDS = 'TRAVEL_WORDS',
  DAILY_WORDS = 'DAILY_WORDS',
  TECH_WORDS = 'TECH_WORDS',
  DUEL = 'DUEL',
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

export interface PhrasalVerb {
  id: string;
  verb: string; // e.g. "give up"
  tr: string; // Türkçe Anlamı: "vazgeçmek, bırakmak"
  meaningEn?: string; // İngilizce Kısa Tanımı: "stop trying"
  example: string; // Örnek Cümle
  exampleTr?: string; // Örnek Cümlenin Çevirisi
}

export interface CuratedWord {
  id: string;
  word: string;
  tr: string;
  type?: string; // noun, verb, adj, adv
  level?: string; // A1, A2, B1, B2, C1
  synonym?: string; // Eş anlamlısı (synonym)
  example: string;
  exampleTr?: string;
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

// 2 Kişilik Canlı Düello Tipleri
export type DuelCategory =
  | 'oxford'
  | 'yds'
  | 'business'
  | 'phrasal'
  | 'daily'
  | 'travel'
  | 'tech'
  | 'custom';

export interface DuelQuestion {
  id: string;
  word: string;
  tr: string;
  type?: string;
  example?: string;
  exampleTr?: string;
  options: string[];
  correctOption: string;
}

export interface DuelPlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  currentQuestionIndex: number;
  isFinished: boolean;
  finishedTimeMs?: number;
}

