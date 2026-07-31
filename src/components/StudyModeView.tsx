import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  RotateCw, 
  Check, 
  X, 
  HelpCircle, 
  Volume2, 
  Sparkles, 
  Shuffle, 
  ArrowLeft, 
  Award, 
  BarChart2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap,
  Lightbulb,
  Brain,
  Zap,
  Loader2
} from 'lucide-react';
import { Deck, Flashcard, CardStatus } from '../types';
import { speakNative } from '../lib/audio';

interface StudyModeViewProps {
  deck: Deck;
  cards: Flashcard[];
  onBack: () => void;
  onUpdateCardStatus: (cardId: string, status: CardStatus) => void;
  onFinishSession: (stats: { deckId: string; cardsStudied: number; cardsMastered: number; cardsReviewAgain: number; timeSpentSeconds: number }) => void;
  onStartQuiz: (deckId: string) => void;
}

export const StudyModeView: React.FC<StudyModeViewProps> = ({
  deck,
  cards,
  onBack,
  onUpdateCardStatus,
  onFinishSession,
  onStartQuiz,
}) => {
  const deckCards = cards.filter((c) => c.deckId === deck.id);

  const [cardQueue, setCardQueue] = useState<Flashcard[]>(deckCards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [masteredThisSession, setMasteredThisSession] = useState<number>(0);
  const [reviewAgainThisSession, setReviewAgainThisSession] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // AI Card Explainer State
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<{ deeperBreakdown: string; mnemonic: string; realWorldExample: string; commonPitfalls: string } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentCard = cardQueue[currentIndex];

  // Reset flip when index changes
  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
    setShowAIAssistant(false);
    setAiExplanation(null);
  }, [currentIndex]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHint((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        handleSpeakCard();
      } else if (isFlipped) {
        if (e.key === '1') {
          handleResponse('review');
        } else if (e.key === '2') {
          handleResponse('good');
        } else if (e.key === '3') {
          handleResponse('mastered');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, isCompleted, currentCard]);

  const handleShuffle = () => {
    const shuffled = [...cardQueue].sort(() => Math.random() - 0.5);
    setCardQueue(shuffled);
    setCurrentIndex(0);
  };

  const handleSpeakCard = () => {
    if (!currentCard) return;
    const textToSpeak = isFlipped ? currentCard.back : currentCard.front;
    speakNative(textToSpeak);
  };

  const handleResponse = (quality: 'review' | 'good' | 'mastered') => {
    if (!currentCard) return;

    if (quality === 'mastered') {
      onUpdateCardStatus(currentCard.id, 'mastered');
      setMasteredThisSession((prev) => prev + 1);
    } else if (quality === 'review') {
      onUpdateCardStatus(currentCard.id, 'learning');
      setReviewAgainThisSession((prev) => prev + 1);
    } else {
      onUpdateCardStatus(currentCard.id, 'learning');
    }

    if (currentIndex + 1 < cardQueue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Session finished!
      setIsCompleted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const durationSec = Math.round((Date.now() - sessionStartTime) / 1000);
      onFinishSession({
        deckId: deck.id,
        cardsStudied: cardQueue.length,
        cardsMastered: masteredThisSession + (quality === 'mastered' ? 1 : 0),
        cardsReviewAgain: reviewAgainThisSession + (quality === 'review' ? 1 : 0),
        timeSpentSeconds: durationSec,
      });
    }
  };

  const handleFetchAIExplanation = async () => {
    if (!currentCard) return;
    setShowAIAssistant(true);
    setIsLoadingAI(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/explain-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: currentCard.front,
          back: currentCard.back,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI breakdown.');
      }

      const data = await res.json();
      setAiExplanation(data);
    } catch (err: any) {
      setAiError(err.message || 'AI Assistant unavailable right now.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!currentCard || deckCards.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-4 max-w-lg mx-auto mt-8 shadow-sm">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">No cards available in this deck</h3>
        <p className="text-slate-500 text-sm">Please add flashcards to this deck before launching study mode.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition cursor-pointer"
        >
          Return to Deck
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / cardQueue.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>Exit Session</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-extrabold text-slate-800">
            Card {currentIndex + 1} of {cardQueue.length}
          </span>
          <button
            onClick={handleShuffle}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer border border-slate-200"
            title="Shuffle queue"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isCompleted ? (
        /* Interactive 3D Card Stage */
        <div className="space-y-6">
          <div
            className="perspective-1000 w-full min-h-[360px] sm:min-h-[420px] cursor-pointer"
            onClick={() => setIsFlipped((prev) => !prev)}
          >
            <motion.div
              className="relative w-full h-full min-h-[360px] sm:min-h-[420px] rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-lg transition-all duration-300 bg-white border-2 border-slate-200 hover:border-indigo-400"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* FRONT OF CARD */}
              <div
                className={`absolute inset-0 p-8 sm:p-12 flex flex-col justify-between backface-hidden bg-white rounded-3xl ${
                  isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold tracking-wider text-indigo-600 uppercase">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Question / Term</span>
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Click or press Space to flip</span>
                </div>

                <div className="my-auto text-center space-y-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-relaxed">
                    {currentCard.front}
                  </h2>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {currentCard.hint ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint((prev) => !prev);
                      }}
                      className="inline-flex items-center space-x-1.5 text-xs text-amber-600 hover:text-amber-700 font-bold"
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                  ) : <div />}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeakCard();
                    }}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                    title="Audio Speak"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* BACK OF CARD (Flipped) */}
              <div
                className={`absolute inset-0 p-8 sm:p-12 flex flex-col justify-between backface-hidden transform rotate-y-180 bg-slate-900 rounded-3xl text-white ${
                  !isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold tracking-wider text-indigo-300 uppercase">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Answer / Concept</span>
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">Click or press Space to flip</span>
                </div>

                <div className="my-auto text-center space-y-4">
                  <p className="text-lg sm:text-2xl font-extrabold text-white leading-relaxed">
                    {currentCard.back}
                  </p>
                  {currentCard.explanation && (
                    <p className="text-xs sm:text-sm text-slate-300 italic max-w-lg mx-auto bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      "{currentCard.explanation}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFetchAIExplanation();
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white border border-indigo-500 text-xs font-bold hover:bg-indigo-500 transition cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5 text-cyan-300" />
                    <span>AI Tutor Deep Dive</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeakCard();
                    }}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Optional Hint Banner */}
          {showHint && currentCard.hint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs flex items-start space-x-2"
            >
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-900 font-bold mb-0.5">Study Hint:</strong>
                <span>{currentCard.hint}</span>
              </div>
            </motion.div>
          )}

          {/* AI Assistant Explanation Drawer */}
          {showAIAssistant && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
                  <Brain className="w-4 h-4" />
                  <span>RecallAI Tutor Deep Dive</span>
                </div>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="text-slate-400 hover:text-slate-800 text-xs font-bold"
                >
                  Close
                </button>
              </div>

              {isLoadingAI ? (
                <div className="flex items-center justify-center py-6 space-x-3 text-slate-500 text-xs font-medium">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Generating memory mnemonic and deep breakdown...</span>
                </div>
              ) : aiError ? (
                <div className="text-rose-700 text-xs p-3 bg-rose-50 rounded-xl border border-rose-200">
                  {aiError}
                </div>
              ) : aiExplanation ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-indigo-700 font-bold block mb-1">Concept Breakdown</strong>
                    <p className="text-slate-700 leading-relaxed font-medium">{aiExplanation.deeperBreakdown}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-amber-800 font-bold block mb-1">Memory Mnemonic</strong>
                    <p className="text-amber-900 font-bold">{aiExplanation.mnemonic}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-cyan-800 font-bold block mb-1">Real World Example</strong>
                    <p className="text-slate-700 leading-relaxed font-medium">{aiExplanation.realWorldExample}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <strong className="text-rose-700 font-bold block mb-1">Common Pitfalls</strong>
                    <p className="text-slate-700 leading-relaxed font-medium">{aiExplanation.commonPitfalls}</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Rating Action Controls */}
          <div className="space-y-2">
            <p className="text-center text-xs text-slate-500 font-bold">
              {isFlipped ? 'Rate your recall confidence:' : 'Flip card to rate your answer:'}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                id="btn-rate-review"
                onClick={() => handleResponse('review')}
                disabled={!isFlipped}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-40 text-rose-800 transition cursor-pointer"
              >
                <X className="w-5 h-5 mb-1 text-rose-600" />
                <span className="text-xs font-bold">Review Again</span>
                <span className="text-[10px] text-rose-600/80 mt-0.5">Key 1</span>
              </button>

              <button
                id="btn-rate-good"
                onClick={() => handleResponse('good')}
                disabled={!isFlipped}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 text-indigo-900 transition cursor-pointer"
              >
                <RotateCw className="w-5 h-5 mb-1 text-indigo-600" />
                <span className="text-xs font-bold">Good / Learning</span>
                <span className="text-[10px] text-indigo-600/80 mt-0.5">Key 2</span>
              </button>

              <button
                id="btn-rate-mastered"
                onClick={() => handleResponse('mastered')}
                disabled={!isFlipped}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 text-emerald-900 transition cursor-pointer"
              >
                <Check className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-xs font-bold">Mastered!</span>
                <span className="text-[10px] text-emerald-600/80 mt-0.5">Key 3</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completed Summary Modal Stage */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <div className="w-full h-full bg-indigo-600 rounded-[14px] flex items-center justify-center">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Study Session Complete! 🎉</h2>
            <p className="text-slate-600 text-sm font-medium">
              Great job reviewing <span className="text-indigo-600 font-bold">{deck.title}</span>. Your active recall muscle is growing stronger!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-xs font-bold">Total Reviewed</div>
              <div className="text-xl font-black text-slate-900 mt-1">{cardQueue.length}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-emerald-700 text-xs font-bold">Mastered</div>
              <div className="text-xl font-black text-emerald-600 mt-1">{masteredThisSession}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-rose-700 text-xs font-bold">To Review Again</div>
              <div className="text-xl font-black text-rose-600 mt-1">{reviewAgainThisSession}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentIndex(0);
                setMasteredThisSession(0);
                setReviewAgainThisSession(0);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition cursor-pointer"
            >
              Study Again
            </button>

            <button
              onClick={() => onStartQuiz(deck.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition inline-flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <GraduationCap className="w-4 h-4 text-white" />
              <span>Launch Quiz on this Deck</span>
            </button>

            <button
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
