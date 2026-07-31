export type CardStatus = 'new' | 'learning' | 'mastered';
export type CardDifficulty = 'easy' | 'medium' | 'hard';
export type DeckCategory = 'computer-science' | 'medicine' | 'languages' | 'science' | 'history' | 'business' | 'general';

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  status: CardStatus;
  difficulty: CardDifficulty;
  lastReviewedAt?: string;
  reviewCount: number;
  nextReviewDate?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: DeckCategory;
  color: string; // Tailwind color class or hex
  iconName?: string;
  tags: string[];
  cardCount: number;
  masteredCount: number;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string;
  isPreset?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizResult {
  id: string;
  deckId: string;
  deckTitle: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  completedAt: string;
  questions: QuizQuestion[];
}

export interface StudySessionStats {
  deckId: string;
  cardsStudied: number;
  cardsMastered: number;
  cardsReviewAgain: number;
  timeSpentSeconds: number;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  streakDays: number;
  lastActiveDate: string;
  totalCardsStudied: number;
  totalMasteredCount: number;
  dailyGoalCards: number;
  todayStudiedCount: number;
}

export interface SummarizeResult {
  summary: string;
  keyTakeaways: string[];
  analogy: string;
  simplifiedExplanation: string;
  suggestedCards: Array<{ front: string; back: string; hint?: string }>;
}
