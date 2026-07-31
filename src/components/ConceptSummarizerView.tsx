import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Lightbulb, 
  FileText, 
  Check, 
  Plus, 
  Loader2, 
  ArrowRight,
  BookOpen,
  Copy,
  Zap
} from 'lucide-react';
import { SummarizeResult, DeckCategory } from '../types';

interface ConceptSummarizerViewProps {
  onCreateDeckFromSummary: (deckData: { title: string; description: string; category: DeckCategory; tags: string[]; cards: Array<{ front: string; back: string; hint?: string }> }) => void;
}

export const ConceptSummarizerView: React.FC<ConceptSummarizerViewProps> = ({
  onCreateDeckFromSummary,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('high-school');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError('Please enter or paste text to summarize.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/summarize-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetAudience,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate concept breakdown.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToDeck = () => {
    if (!result) return;

    const topicTitle = inputText.slice(0, 30).trim() + ' Concept Deck';
    onCreateDeckFromSummary({
      title: topicTitle,
      description: result.summary,
      category: 'general',
      tags: ['AI-Summarized', 'Study-Notes'],
      cards: result.suggestedCards || [],
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
          <span>Google Gemini AI Concept Tutor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Complex Concept Simplifier & Summarizer
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl font-medium">
          Paste dense textbook chapters, medical journal excerpts, or difficult code logic. AI will simplify it into memorable analogies, key takeaways, and flashcards.
        </p>
      </div>

      {/* Input Stage */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
            Paste Complex Text / Research Notes
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            placeholder="e.g. Paste a complex paragraph about Quantum Entanglement, Krebs Cycle, or React Fiber Reconciliation..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">Explanation Depth:</span>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ELI5">ELI5 (Explain Like I'm 5)</option>
              <option value="high-school">High School / General</option>
              <option value="college">College / University Level</option>
              <option value="bullet-points">Executive Bullet Points</option>
            </select>
          </div>

          <button
            id="btn-summarize-ai"
            onClick={handleSummarize}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Simplifying Concept...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summarize & Explain</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Output Breakdown Stage */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                <span>AI Concept Breakdown</span>
              </h2>

              <button
                id="btn-convert-summary-to-deck"
                onClick={handleConvertToDeck}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Convert to Flashcard Deck</span>
              </button>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <strong className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                Executive Summary
              </strong>
              <p className="text-slate-800 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                {result.summary}
              </p>
            </div>

            {/* Analogy & Simplified Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-1.5">
                <strong className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Real World Analogy</span>
                </strong>
                <p className="text-amber-950 text-xs leading-relaxed font-medium">{result.analogy}</p>
              </div>

              <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-xl space-y-1.5">
                <strong className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Jargon-Free Explanation</span>
                </strong>
                <p className="text-indigo-950 text-xs leading-relaxed font-medium">{result.simplifiedExplanation}</p>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <strong className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Key Takeaways
              </strong>
              <ul className="space-y-2">
                {result.keyTakeaways?.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium"
                  >
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Derived Flashcards */}
            {result.suggestedCards && result.suggestedCards.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <strong className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                  Derived Study Flashcards ({result.suggestedCards.length})
                </strong>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.suggestedCards.map((c, i) => (
                    <div key={i} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900">Q: {c.front}</div>
                      <div className="text-slate-600 font-medium">A: {c.back}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
