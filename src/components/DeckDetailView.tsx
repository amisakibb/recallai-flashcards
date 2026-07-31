import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Play, 
  GraduationCap, 
  Trash2, 
  Edit, 
  Volume2, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  Tag, 
  AlertCircle,
  FileJson,
  Loader2
} from 'lucide-react';
import { Deck, Flashcard, CardStatus } from '../types';
import { speakNative } from '../lib/audio';

interface DeckDetailViewProps {
  deck: Deck;
  cards: Flashcard[];
  onBack: () => void;
  onStartStudy: (deckId: string) => void;
  onStartQuiz: (deckId: string) => void;
  onOpenAddCardModal: (deckId: string) => void;
  onOpenEditCardModal: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onUpdateCardStatus: (cardId: string, status: CardStatus) => void;
  onAIExpandDeck: (deck: Deck) => void;
  isAIExpanding?: boolean;
}

export const DeckDetailView: React.FC<DeckDetailViewProps> = ({
  deck,
  cards,
  onBack,
  onStartStudy,
  onStartQuiz,
  onOpenAddCardModal,
  onOpenEditCardModal,
  onDeleteCard,
  onDeleteDeck,
  onUpdateCardStatus,
  onAIExpandDeck,
  isAIExpanding = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);

  const deckCards = cards.filter((c) => c.deckId === deck.id);
  const masteredCount = deckCards.filter((c) => c.status === 'mastered').length;
  const learningCount = deckCards.filter((c) => c.status === 'learning').length;
  const newCount = deckCards.filter((c) => c.status === 'new').length;

  const filteredCards = deckCards.filter((card) => {
    const matchesSearch =
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.hint && card.hint.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSpeak = async (card: Flashcard) => {
    setSpeakingCardId(card.id);
    await speakNative(`${card.front}. Answer: ${card.back}`);
    setSpeakingCardId(null);
  };

  const handleExportJSON = () => {
    const exportData = {
      deck,
      cards: deckCards,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flashcards.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>Back to All Decks</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Export deck as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export Deck</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${deck.title}" and all its flashcards?`)) {
                onDeleteDeck(deck.id);
              }
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Deck</span>
          </button>
        </div>
      </div>

      {/* Deck Overview Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {deck.category.replace('-', ' ')}
              </span>
              {deck.tags.map((t, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 font-bold">
                  #{t}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{deck.title}</h1>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">{deck.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartStudy(deck.id)}
              disabled={deckCards.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Study Deck ({deckCards.length})</span>
            </button>

            <button
              onClick={() => onStartQuiz(deck.id)}
              disabled={deckCards.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 border border-slate-200 font-bold text-sm transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Take Quiz</span>
            </button>

            <button
              onClick={() => onAIExpandDeck(deck)}
              disabled={isAIExpanding}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 font-bold text-sm transition cursor-pointer"
            >
              {isAIExpanding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  <span>AI Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span>AI Add 5 Cards</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 text-xs font-bold">Total Cards</div>
            <div className="text-xl font-black text-slate-900 mt-1">{deckCards.length}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-emerald-700 text-xs font-bold">Mastered</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{masteredCount}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-amber-700 text-xs font-bold">Learning</div>
            <div className="text-xl font-black text-amber-600 mt-1">{learningCount}</div>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="text-slate-500 text-xs font-bold">New</div>
            <div className="text-xl font-black text-slate-700 mt-1">{newCount}</div>
          </div>
        </div>
      </div>

      {/* Cards Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards in this deck..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="all">All Statuses ({deckCards.length})</option>
            <option value="mastered">Mastered ({masteredCount})</option>
            <option value="learning">Learning ({learningCount})</option>
            <option value="new">New ({newCount})</option>
          </select>

          <button
            id="btn-add-card-manual"
            onClick={() => onOpenAddCardModal(deck.id)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      {filteredCards.length > 0 ? (
        <div className="space-y-4">
          {filteredCards.map((card, idx) => (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition space-y-4 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center border border-slate-200">
                    {idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      card.status === 'mastered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : card.status === 'learning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {card.status}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      card.difficulty === 'easy'
                        ? 'text-emerald-700 bg-emerald-50'
                        : card.difficulty === 'medium'
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-rose-700 bg-rose-50'
                    }`}
                  >
                    {card.difficulty}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSpeak(card)}
                    className={`p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer ${
                      speakingCardId === card.id ? 'text-indigo-600 animate-bounce' : ''
                    }`}
                    title="Listen to card audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenEditCardModal(card)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                    title="Edit card"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCard(card.id)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Question & Answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                    Front / Question
                  </div>
                  <p className="text-slate-900 font-bold text-sm leading-relaxed">{card.front}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Back / Answer
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">{card.back}</p>
                </div>
              </div>

              {/* Hint & Explanation */}
              {(card.hint || card.explanation) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  {card.hint && (
                    <div className="flex items-start space-x-2 text-slate-600">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong className="text-amber-800">Hint:</strong> {card.hint}</span>
                    </div>
                  )}
                  {card.explanation && (
                    <div className="flex items-start space-x-2 text-slate-600">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong className="text-indigo-800">Explanation:</strong> {card.explanation}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status Selector Footer */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-medium">
                <span>Reviews: {card.reviewCount}</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 font-bold">Mark as:</span>
                  {(['new', 'learning', 'mastered'] as CardStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateCardStatus(card.id, st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-extrabold capitalize transition cursor-pointer ${
                        card.status === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 space-y-3">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No cards in this deck yet</h4>
          <p className="text-slate-500 text-xs">
            Add cards manually or use the AI generator to auto-create cards from topics or notes.
          </p>
          <button
            onClick={() => onOpenAddCardModal(deck.id)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Card</span>
          </button>
        </div>
      )}
    </div>
  );
};
