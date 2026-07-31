import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  ArrowRight,
  Brain,
  Check,
  X
} from 'lucide-react';
import { Deck, Flashcard, QuizQuestion, QuizResult } from '../types';

interface QuizModeViewProps {
  decks: Deck[];
  cards: Flashcard[];
  selectedDeckId?: string;
  onSaveQuizResult: (result: QuizResult) => void;
  onBackToDecks: () => void;
}

export const QuizModeView: React.FC<QuizModeViewProps> = ({
  decks,
  cards,
  selectedDeckId,
  onSaveQuizResult,
  onBackToDecks,
}) => {
  const [activeDeckId, setActiveDeckId] = useState<string>(selectedDeckId || (decks[0]?.id || ''));
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [quizType, setQuizType] = useState<'mix' | 'multiple-choice' | 'true-false' | 'fill-blank'>('mix');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillBlankText, setFillBlankText] = useState<string>('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDeck = decks.find((d) => d.id === activeDeckId);
  const activeDeckCards = cards.filter((c) => c.deckId === activeDeckId);

  const handleStartQuiz = async () => {
    if (!selectedDeck || activeDeckCards.length === 0) {
      setError('Please select a deck with at least 1 flashcard.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      let formatted: QuizQuestion[] = [];

      try {
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deckTitle: selectedDeck.title,
            cards: activeDeckCards.map((c) => ({ front: c.front, back: c.back })),
            questionCount,
            quizType,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            formatted = data.questions.map((q: any, idx: number) => ({
              id: `q-${idx}`,
              type: q.type || 'multiple-choice',
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || '',
            }));
          }
        }
      } catch (e) {
        console.warn('AI Quiz endpoint error, falling back to local card synthesis:', e);
      }

      // If AI service failed or key missing, generate quiz questions directly from deck flashcards
      if (formatted.length === 0) {
        const shuffled = [...activeDeckCards].sort(() => 0.5 - Math.random());
        const selectedSlice = shuffled.slice(0, Math.min(questionCount, activeDeckCards.length));

        formatted = selectedSlice.map((card, idx) => {
          const distractors = activeDeckCards
            .filter((c) => c.id !== card.id)
            .map((c) => c.back)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

          const opts = Array.from(new Set([card.back, ...distractors])).sort(() => 0.5 - Math.random());

          return {
            id: `q-local-${idx}`,
            type: quizType === 'mix' ? (idx % 2 === 0 ? 'multiple-choice' : 'fill-blank') : (quizType as any),
            question: `What is the definition or correct answer for: "${card.front}"?`,
            options: opts.length > 1 ? opts : [card.back, 'Incorrect Answer 1', 'Incorrect Answer 2', 'None of the above'],
            correctAnswer: card.back,
            explanation: `From deck card key concept: "${card.front}" → "${card.back}"`,
          };
        });
      }

      setQuizQuestions(formatted);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSelectedOption(null);
      setFillBlankText('');
      setIsAnswerSubmitted(false);
      setQuizCompleted(false);
      setStartTime(Date.now());
    } catch (err: any) {
      setError(err.message || 'Error starting quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAnswer = () => {
    const q = quizQuestions[currentQuestionIndex];
    if (!q) return;

    let ans = selectedOption;
    if (q.type === 'fill-blank') {
      ans = fillBlankText.trim();
    }

    if (!ans) return;

    setUserAnswers((prev) => ({ ...prev, [q.id]: ans }));
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFillBlankText('');
      setIsAnswerSubmitted(false);
    } else {
      // Finish Quiz
      setQuizCompleted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Calculate score
      let correct = 0;
      const evaluatedQuestions = quizQuestions.map((q) => {
        const userAns = userAnswers[q.id] || '';
        const isCorr = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        if (isCorr) correct++;
        return { ...q, userAnswer: userAns, isCorrect: isCorr };
      });

      const scorePct = Math.round((correct / quizQuestions.length) * 100);

      onSaveQuizResult({
        id: `quiz-res-${Date.now()}`,
        deckId: activeDeckId,
        deckTitle: selectedDeck?.title || 'Quiz',
        totalQuestions: quizQuestions.length,
        correctCount: correct,
        scorePercentage: scorePct,
        completedAt: new Date().toISOString(),
        questions: evaluatedQuestions,
      });
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Gemini AI is Crafting Your Quiz...</h3>
        <p className="text-slate-500 text-sm font-medium">
          Analyzing deck cards, generating distractors, and tailoring explanation keys.
        </p>
      </div>
    );
  }

  // Quiz Setup Screen
  if (quizQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive AI Quiz Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Test Your Knowledge
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Select a study deck and test format. AI will convert your flashcards into a dynamic quiz with instant feedback and explanations.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Select Deck
            </label>
            <select
              value={activeDeckId}
              onChange={(e) => setActiveDeckId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
            >
              {decks.map((d) => {
                const count = cards.filter((c) => c.deckId === d.id).length;
                return (
                  <option key={d.id} value={d.id}>
                    {d.title} ({count} cards)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Question Count
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold"
              >
                <option value={3}>3 Questions (Quick Speed Check)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={10}>10 Questions (Comprehensive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Quiz Format
              </label>
              <select
                value={quizType}
                onChange={(e) => setQuizType(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold"
              >
                <option value="mix">Mixed Format (Recommended)</option>
                <option value="multiple-choice">Multiple Choice Only</option>
                <option value="true-false">True / False</option>
                <option value="fill-blank">Fill in the Blank</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onBackToDecks}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Back to Decks
            </button>

            <button
              id="btn-start-ai-quiz"
              onClick={handleStartQuiz}
              className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Quiz Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question Player Stage
  const currentQ = quizQuestions[currentQuestionIndex];
  const isLastQ = currentQuestionIndex + 1 === quizQuestions.length;

  if (quizCompleted) {
    let correctCount = 0;
    quizQuestions.forEach((q) => {
      const uAns = userAnswers[q.id] || '';
      if (uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount++;
      }
    });
    const finalPct = Math.round((correctCount / quizQuestions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-lg">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <div className="w-full h-full bg-indigo-600 rounded-[14px] flex items-center justify-center">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Quiz Completed!</h2>
            <p className="text-slate-500 text-sm font-medium">Deck: {selectedDeck?.title}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Score</div>
            <div className="text-4xl font-black text-indigo-600">{finalPct}%</div>
            <div className="text-xs text-slate-600 font-bold">
              {correctCount} out of {quizQuestions.length} questions correct
            </div>
          </div>

          {/* Breakdown Review */}
          <div className="text-left space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Question Review</h3>
            {quizQuestions.map((q, idx) => {
              const uAns = userAnswers[q.id] || '(No Answer)';
              const isCorr = uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isCorr
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900">
                      Q{idx + 1}: {q.question}
                    </span>
                    {isCorr ? (
                      <span className="text-emerald-700 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" /> <span>Correct</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center space-x-1">
                        <X className="w-3.5 h-3.5" /> <span>Incorrect</span>
                      </span>
                    )}
                  </div>

                  <div className="text-slate-600 space-y-1 font-medium">
                    <p>Your Answer: <strong className={isCorr ? 'text-emerald-800' : 'text-rose-800'}>{uAns}</strong></p>
                    {!isCorr && <p>Correct Answer: <strong className="text-emerald-800">{q.correctAnswer}</strong></p>}
                    <p className="text-slate-700 italic pt-1 border-t border-slate-200/80">
                      <strong className="text-indigo-800">AI Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center space-x-3 pt-4">
            <button
              onClick={() => {
                setQuizQuestions([]);
              }}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-sm hover:bg-slate-200 transition cursor-pointer"
            >
              New Quiz
            </button>
            <button
              onClick={onBackToDecks}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Return to Decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedAns = userAnswers[currentQ.id];
  const isCorrect = selectedAns && selectedAns.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Quiz Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl text-xs font-bold shadow-2xs">
        <span className="text-indigo-600">Deck: {selectedDeck?.title}</span>
        <span className="text-slate-700">
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">
            {currentQ.type.replace('-', ' ')}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-relaxed">
            {currentQ.question}
          </h2>
        </div>

        {/* Question Input Options */}
        {currentQ.type === 'fill-blank' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={fillBlankText}
              onChange={(e) => setFillBlankText(e.target.value)}
              disabled={isAnswerSubmitted}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {currentQ.options?.map((opt, i) => {
              const isOptionSelected = selectedOption === opt;
              let optionClass = 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300';

              if (isAnswerSubmitted) {
                if (opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()) {
                  optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                } else if (isOptionSelected) {
                  optionClass = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                }
              } else if (isOptionSelected) {
                optionClass = 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20';
              }

              return (
                <button
                  key={i}
                  disabled={isAnswerSubmitted}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition flex items-center justify-between cursor-pointer ${optionClass}`}
                >
                  <span>{opt}</span>
                  {isAnswerSubmitted && opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* AI Answer Explanation Box */}
        {isAnswerSubmitted && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center space-x-2 font-bold">
              {isCorrect ? (
                <span className="text-emerald-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> <span>Correct! Spot on.</span>
                </span>
              ) : (
                <span className="text-rose-700 flex items-center space-x-1">
                  <XCircle className="w-4 h-4 text-rose-600" /> <span>Not quite right. Correct answer: {currentQ.correctAnswer}</span>
                </span>
              )}
            </div>
            <p className="text-slate-700 leading-relaxed pt-1 border-t border-slate-200/80 font-medium">
              <strong className="text-indigo-700 font-bold">AI Explanation:</strong> {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={onBackToDecks}
            className="text-xs text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
          >
            Quit Quiz
          </button>

          {!isAnswerSubmitted ? (
            <button
              id="btn-confirm-answer"
              onClick={handleConfirmAnswer}
              disabled={currentQ.type === 'fill-blank' ? !fillBlankText.trim() : !selectedOption}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Submit Answer
            </button>
          ) : (
            <button
              id="btn-next-question"
              onClick={handleNextQuestion}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              <span>{isLastQ ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
