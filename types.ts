export interface Word {
  id: string;
  en: string;
  tr: string;
}

export interface WordGroup {
  id: string;
  name: string;
  description: string;
  level: string; // A1, A2, B1, etc.
  words: Word[];
  createdAt: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  QUIZ = 'QUIZ',
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
