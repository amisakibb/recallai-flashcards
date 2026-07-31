import React, { useState, useEffect } from 'react';
import { X, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { Flashcard, CardDifficulty } from '../types';

interface CreateCardModalProps {
  isOpen: boolean;
  deckId: string;
  initialCard?: Flashcard | null;
  onClose: () => void;
  onSubmit: (cardData: {
    front: string;
    back: string;
    hint?: string;
    explanation?: string;
    difficulty: CardDifficulty;
  }) => void;
}

export const CreateCardModal: React.FC<CreateCardModalProps> = ({
  isOpen,
  deckId,
  initialCard,
  onClose,
  onSubmit,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<CardDifficulty>('medium');

  useEffect(() => {
    if (initialCard) {
      setFront(initialCard.front);
      setBack(initialCard.back);
      setHint(initialCard.hint || '');
      setExplanation(initialCard.explanation || '');
      setDifficulty(initialCard.difficulty);
    } else {
      setFront('');
      setBack('');
      setHint('');
      setExplanation('');
      setDifficulty('medium');
    }
  }, [initialCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    onSubmit({
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      explanation: explanation.trim() || undefined,
      difficulty,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-lg">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>{initialCard ? 'Edit Flashcard' : 'Add New Flashcard'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Front / Question *
            </label>
            <textarea
              required
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              placeholder="e.g. What is the mechanism of action of Beta Blockers?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Back / Answer *
            </label>
            <textarea
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              placeholder="e.g. Competitively block beta-adrenergic receptors, reducing heart rate and blood pressure."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                Hint (Optional)
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g. Think heart rate reduction..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CardDifficulty)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold"
              >
                <option value="easy">Easy / Fundamental</option>
                <option value="medium">Medium / Standard</option>
                <option value="hard">Hard / Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Detailed Explanation (Optional)
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Additional background context for review mode..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {initialCard ? 'Save Changes' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
