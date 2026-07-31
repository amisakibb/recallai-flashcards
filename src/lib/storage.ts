import { Deck, Flashcard, UserProfile, QuizResult, StudySessionStats } from '../types';
import { INITIAL_DECKS, INITIAL_CARDS } from '../data/initialDecks';

const STORAGE_KEYS = {
  DECKS: 'recallai_decks_v2',
  CARDS: 'recallai_cards_v2',
  PROFILE: 'recallai_profile_v2',
  QUIZ_RESULTS: 'recallai_quiz_results_v2',
  STUDY_SESSIONS: 'recallai_study_sessions_v2',
};

export function getStoredDecks(): Deck[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (!data) {
      saveStoredDecks([]);
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading decks from storage', e);
    return [];
  }
}

export function saveStoredDecks(decks: Deck[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (e) {
    console.error('Error saving decks to storage', e);
  }
}

export function getStoredCards(): Flashcard[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (!data) {
      saveStoredCards([]);
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading cards from storage', e);
    return [];
  }
}

export function saveStoredCards(cards: Flashcard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Error saving cards to storage', e);
  }
}

export function getStoredProfile(): UserProfile {
  const defaultProfile: UserProfile = {
    name: 'Learner',
    email: '',
    avatar: '',
    streakDays: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalCardsStudied: 0,
    totalMasteredCount: 0,
    dailyGoalCards: 20,
    todayStudiedCount: 0,
  };

  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!data) {
      saveStoredProfile(defaultProfile);
      return defaultProfile;
    }
    const profile = JSON.parse(data);
    
    // Check if streak needs updating
    const todayStr = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate !== todayStr) {
      const lastDate = new Date(profile.lastActiveDate);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        profile.streakDays = 1; // broken streak
      }
      profile.todayStudiedCount = 0; // reset daily count
      profile.lastActiveDate = todayStr;
      saveStoredProfile(profile);
    }
    return profile;
  } catch (e) {
    return defaultProfile;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

export function getStoredQuizResults(): QuizResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveQuizResult(result: QuizResult): void {
  try {
    const existing = getStoredQuizResults();
    const updated = [result, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving quiz result', e);
  }
}

export function getStoredStudySessions(): StudySessionStats[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveStudySession(session: StudySessionStats): void {
  try {
    const existing = getStoredStudySessions();
    const updated = [session, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving study session', e);
  }
}

// Clears every locally stored key. Called on logout so a shared device
// never shows the next person the previous account's decks/cards/stats.
export function clearAllStoredData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error('Error clearing local storage', e);
  }
}

export function defaultProfile(): UserProfile {
  return {
    name: 'Learner',
    email: '',
    avatar: '',
    streakDays: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalCardsStudied: 0,
    totalMasteredCount: 0,
    dailyGoalCards: 20,
    todayStudiedCount: 0,
  };
}
