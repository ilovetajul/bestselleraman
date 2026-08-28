export type GroupId = 1 | 2 | 3;

export interface Principle {
  id: number;
  keyword: string; // e.g. "Honest"
  english: string; // full sentence, e.g. "We Are Honest."
  bangla: string; // full Bangla sentence
  banglaKeyword: string; // e.g. "সৎ"
  pronunciation: string; // Bangla phonetic pronunciation of the English sentence
  group: GroupId;
  memoryTip: string;
}

export interface PrincipleGroup {
  id: GroupId;
  titleBangla: string;
  titleEnglish: string;
  principleIds: number[];
  memoryPhrase: string;
}

export type QuestionType =
  | 'keyword-to-english'
  | 'english-to-bangla'
  | 'fill-blank'
  | 'multiple-choice'
  | 'full-sentence-recall';

export type QuizMode = QuestionType | 'mixed';

export interface Question {
  id: string;
  principleId: number;
  type: QuestionType;
  prompt: string;
  promptLang: 'bn' | 'en';
  correctAnswer: string;
  choices?: string[]; // for multiple-choice
  blankTemplate?: string; // for fill-blank, e.g. "We Are ______."
}

export type MatchResult = 'correct' | 'almost' | 'incorrect';

export interface SRSData {
  principleId: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string | null;
  nextReview: string | null;
  difficulty: number; // 0 (easy) - 1 (hard)
  masteryScore: number; // 0-100
}

export interface AttemptRecord {
  timestamp: string;
  principleId: number;
  type: QuestionType;
  result: MatchResult;
  mode: 'practice' | 'review' | 'speed' | 'full-test';
}

export interface AppSettings {
  theme: 'light' | 'dark';
  pronunciation: boolean;
  autoNext: boolean;
  soundEffects: boolean;
  strictMatching: boolean;
}

export interface UserProgress {
  srs: Record<number, SRSData>;
  streakDays: number;
  lastActiveDate: string | null;
  xp: number;
  badges: string[];
  totalQuestionsCompleted: number;
  totalCorrect: number;
  totalMistakes: number;
  bestSpeedRecallScore: number;
  history: AttemptRecord[];
  sessionCorrectStreak: number;
  bestSessionCorrectStreak: number;
}

export interface AppState {
  progress: UserProgress;
  settings: AppSettings;
}

export type Page =
  | 'home'
  | 'dashboard'
  | 'practice'
  | 'review'
  | 'challenge'
  | 'fulltest'
  | 'competition'
  | 'progress'
  | 'settings';
