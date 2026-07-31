import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Play, 
  GraduationCap, 
  Layers, 
  BookOpen, 
  MoreVertical, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Zap,
  Tag,
  Code,
  HeartPulse,
  Languages,
  Landmark,
  Building2,
  Atom,
  Brain,
  Filter,
  FileUp
} from 'lucide-react';
import { Deck, DeckCategory, Flashcard } from '../types';

interface DashboardViewProps {
  decks: Deck[];
  cards: Flashcard[];
  onSelectDeckToStudy: (deckId: string) => void;
  onSelectDeckToQuiz: (deckId: string) => void;
  onSelectDeckDetail: (deckId: string) => void;
  onOpenAIGenerator: (presetTopic?: string, mode?: 'topic' | 'notes' | 'document') => void;
  onOpenCreateDeckModal: () => void;
  onDeleteDeck: (deckId: string) => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: 'All Subjects', icon: Layers, color: 'indigo' },
  'computer-science': { label: 'Computer Science', icon: Code, color: 'emerald' },
  medicine: { label: 'Medicine & Health', icon: HeartPulse, color: 'rose' },
  languages: { label: 'Languages', icon: Languages, color: 'amber' },
  history: { label: 'History & Law', icon: Landmark, color: 'indigo' },
  science: { label: 'Natural Science', icon: Atom, color: 'cyan' },
  business: { label: 'Business & Econ', icon: Building2, color: 'blue' },
  general: { label: 'General Knowledge', icon: Brain, color: 'purple' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  decks,
  cards,
  onSelectDeckToStudy,
  onSelectDeckToQuiz,
  onSelectDeckDetail,
  onOpenAIGenerator,
  onOpenCreateDeckModal,
  onDeleteDeck,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate high-level stats
  const totalDecks = decks.length;
  const totalCards = cards.length;
  const masteredCards = cards.filter((c) => c.status === 'mastered').length;
  const learningCards = cards.filter((c) => c.status === 'learning').length;
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  // Filter decks
  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || deck.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & Overview Stats Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 text-slate-900 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI-Powered Active Recall Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Accelerate Your Learning with <span className="text-indigo-600">RecallAI</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Create, review, and master flashcards powered by Google Gemini AI. Generate comprehensive study decks from notes in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              id="btn-ai-pdf-hero"
              onClick={() => onOpenAIGenerator('', 'document')}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition transform active:scale-95 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Upload PDF & Create Flashcards</span>
            </button>
            <button
              id="btn-ai-generator-hero"
              onClick={() => onOpenAIGenerator('', 'topic')}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generate by Topic</span>
            </button>
            <button
              id="btn-manual-deck-hero"
              onClick={onOpenCreateDeckModal}
              className="px-3.5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs transition cursor-pointer"
              title="Create Blank Custom Deck"
            >
              <Plus className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Quick Stats Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-slate-500 text-xs font-bold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Decks</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalDecks}</div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-slate-500 text-xs font-bold flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Cards</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalCards}</div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-slate-500 text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cards Mastered</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{masteredCards}</div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-slate-500 text-xs font-bold flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Mastery Rate</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{masteryPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              id="search-decks-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study decks, topics, or tags..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-2xs"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Showing {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deck Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            const deckCards = cards.filter((c) => c.deckId === deck.id);
            const deckMastered = deckCards.filter((c) => c.status === 'mastered').length;
            const progressPct = deckCards.length > 0 ? Math.round((deckMastered / deckCards.length) * 100) : 0;
            const catInfo = CATEGORY_MAP[deck.category] || CATEGORY_MAP.general;
            const CategoryIcon = catInfo.icon;

            return (
              <div
                key={deck.id}
                id={`deck-card-${deck.id}`}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div>
                  {/* Category Header & Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 capitalize">
                        {catInfo.label}
                      </span>
                    </div>

                    {deck.isPreset && (
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Preset
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => onSelectDeckDetail(deck.id)}
                    className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition cursor-pointer line-clamp-1"
                  >
                    {deck.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed font-medium">
                    {deck.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {deck.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Bar & Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-bold text-slate-700">
                        {deckCards.length} Card{deckCards.length !== 1 ? 's' : ''} • {deckMastered} Mastered
                      </span>
                      <span className="font-extrabold text-indigo-600">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      id={`btn-study-deck-${deck.id}`}
                      onClick={() => onSelectDeckToStudy(deck.id)}
                      className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                      title="Start Study Mode"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Study</span>
                    </button>

                    <button
                      id={`btn-quiz-deck-${deck.id}`}
                      onClick={() => onSelectDeckToQuiz(deck.id)}
                      className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
                      title="Take Quiz"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Quiz</span>
                    </button>

                    <button
                      id={`btn-view-deck-${deck.id}`}
                      onClick={() => onSelectDeckDetail(deck.id)}
                      className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
                      title="Manage Deck Cards"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cards</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No decks found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchQuery
              ? `No flashcard decks matched "${searchQuery}". Try searching another topic or reset filters.`
              : 'You have not created any decks in this category yet.'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => onOpenAIGenerator(searchQuery)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate "{searchQuery || 'New Deck'}" with AI</span>
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
