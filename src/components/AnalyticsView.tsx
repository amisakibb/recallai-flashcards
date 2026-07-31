import React from 'react';
import { 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  Award, 
  Clock, 
  Layers, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Deck, Flashcard, UserProfile, QuizResult, StudySessionStats } from '../types';

interface AnalyticsViewProps {
  decks: Deck[];
  cards: Flashcard[];
  profile: UserProfile;
  quizResults: QuizResult[];
  studySessions: StudySessionStats[];
  onStartStudy: (deckId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  decks,
  cards,
  profile,
  quizResults,
  studySessions,
  onStartStudy,
}) => {
  const totalCards = cards.length;
  const masteredCards = cards.filter((c) => c.status === 'mastered').length;
  const learningCards = cards.filter((c) => c.status === 'learning').length;
  const newCards = cards.filter((c) => c.status === 'new').length;
  const overallMasteredPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  // Deck recommendations (decks with lowest % mastered)
  const deckMastery = decks.map((d) => {
    const dCards = cards.filter((c) => c.deckId === d.id);
    const dMastered = dCards.filter((c) => c.status === 'mastered').length;
    const pct = dCards.length > 0 ? Math.round((dMastered / dCards.length) * 100) : 0;
    return { deck: d, pct, cardCount: dCards.length, needsReview: dCards.length - dMastered };
  }).sort((a, b) => a.pct - b.pct);

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Active Learning Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Study Progress & Retention Stats
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl font-medium">
          Track card mastery levels, active study streaks, quiz performance scores, and personalized spaced repetition recommendations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{profile.streakDays} Days</div>
          <p className="text-[11px] text-slate-500 font-medium">Keep up your daily habit!</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Mastery Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{overallMasteredPct}%</div>
          <p className="text-[11px] text-slate-500 font-medium">{masteredCards} of {totalCards} cards mastered</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Studied Today</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{profile.todayStudiedCount}</div>
          <p className="text-[11px] text-slate-500 font-medium">Goal: {profile.dailyGoalCards} cards</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Quizzes Taken</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{quizResults.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Completed quizzes</p>
        </div>
      </div>

      {/* Spaced Repetition AI Recommendations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-extrabold text-slate-900">Recommended Reviews for Today</h2>
        </div>

        <p className="text-slate-600 text-xs font-medium">
          Based on mastery rates and review intervals, here are the top decks that require active recall practice:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {deckMastery.slice(0, 4).map(({ deck, pct, cardCount, needsReview }) => (
            <div
              key={deck.id}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm line-clamp-1">{deck.title}</div>
                <div className="text-xs text-slate-500 font-medium">
                  {pct}% Mastered • {needsReview} cards needing review
                </div>
              </div>

              <button
                onClick={() => onStartStudy(deck.id)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition shadow-xs cursor-pointer"
              >
                Review Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Quiz Performance History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Quiz Performance History</span>
          </h2>
          <span className="text-xs text-slate-500 font-bold">{quizResults.length} Total Quizzes</span>
        </div>

        {quizResults.length > 0 ? (
          <div className="space-y-3">
            {quizResults.slice(0, 5).map((q) => (
              <div
                key={q.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{q.deckTitle}</div>
                  <div className="text-slate-500 mt-0.5 font-medium">
                    {q.correctCount}/{q.totalQuestions} Questions Correct • {new Date(q.completedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-black ${
                      q.scorePercentage >= 80
                        ? 'text-emerald-600'
                        : q.scorePercentage >= 60
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {q.scorePercentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-xs italic py-4 font-medium">No quizzes completed yet. Take a quiz in Quiz Mode to build your performance history!</p>
        )}
      </div>
    </div>
  );
};
