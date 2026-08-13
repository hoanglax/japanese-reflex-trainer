export interface VocabItem {
  id: string;
  japanese: string;
  kana: string;
  romaji: string;
  vietnamese: string;
  type: string;
  jlpt: string;
  exampleJp: string;
  exampleVi: string;
  notes: string;
  createdAt: string;
  srsLevel: number;
  easeFactor: number;
  intervalDays: number;
  nextReview: string;
  masteryScore: number;
}

export interface PracticeLog {
  id: string;
  vocabId: string;
  promptQuestion: string;
  userAnswer: string;
  correctAnswer: string;
  score: number;
  responseTimeMs: number;
  aiFeedback: string;
  practicedAt: string;
}

export interface ReflexEvaluation {
  score: number;
  isCorrect: boolean;
  feedback: string;
  suggestedCorrection: string;
  explanation: string;
  naturalExample: string;
  nuanceNote: string;
}

export type ReflexDirection = 'jp-to-vi' | 'vi-to-jp' | 'mixed';

export interface GeneratedVocabItem {
  japanese: string;
  kana: string;
  romaji: string;
  vietnamese: string;
  type: string;
  jlpt: string;
  exampleJp: string;
  exampleVi: string;
  notes: string;
}
