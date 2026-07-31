import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Upload,
  FileUp,
  X,
  Layers, 
  Check, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Zap, 
  Lightbulb, 
  BookOpen, 
  CheckCircle2,
  HelpCircle,
  Brain,
  FileType
} from 'lucide-react';
import { DeckCategory, Flashcard } from '../types';

interface AIGeneratorViewProps {
  initialTopic?: string;
  initialMode?: 'topic' | 'notes' | 'document';
  onSaveDeck: (deckData: { title: string; description: string; category: DeckCategory; tags: string[]; cards: Array<{ front: string; back: string; hint?: string; explanation?: string }> }) => void;
  onCancel: () => void;
}

const PRESET_PROMPTS = [
  'Machine Learning & Neural Network Architecture',
  'Human Anatomy: Central Nervous System & Brain Lobes',
  'Spanish B2 Subjunctive Mood & Complex Verbs',
  'Corporate Finance: Valuations, WACC & DCF Modeling',
  'Organic Chemistry: Functional Groups & Reactions',
  'World History: Cold War Geopolitics 1945-1991',
];

export const AIGeneratorView: React.FC<AIGeneratorViewProps> = ({
  initialTopic = '',
  initialMode,
  onSaveDeck,
  onCancel,
}) => {
  const [inputMode, setInputMode] = useState<'topic' | 'notes' | 'document'>(
    initialMode || (initialTopic ? 'topic' : 'document')
  );
  const [topic, setTopic] = useState<string>(initialTopic);
  const [notes, setNotes] = useState<string>('');
  
  // Document upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const [category, setCategory] = useState<DeckCategory>('computer-science');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [cardCount, setCardCount] = useState<number>(8);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generated deck preview state
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    description: string;
    category: string;
    tags: string[];
    cards: Array<{ front: string; back: string; hint?: string; explanation?: string }>;
  } | null>(null);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload a PDF or document under 10MB.');
      return;
    }

    setError(null);
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract pure base64 without data URI header if present
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      setFileBase64(base64Data);
    };
    reader.onerror = () => {
      setError('Failed to read document file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (inputMode === 'topic' && !topic.trim()) {
      setError('Please enter a study topic or keyword.');
      return;
    }
    if (inputMode === 'notes' && !notes.trim()) {
      setError('Please paste study notes or textbook content.');
      return;
    }
    if (inputMode === 'document' && !fileBase64) {
      setError('Please select or drop a PDF or document file.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: inputMode === 'topic' ? topic : '',
          notes: inputMode === 'notes' ? notes : '',
          fileBase64: inputMode === 'document' ? fileBase64 : undefined,
          fileMimeType: inputMode === 'document' && uploadedFile ? uploadedFile.type : undefined,
          fileName: inputMode === 'document' && uploadedFile ? uploadedFile.name : undefined,
          cardCount,
          difficulty,
          category,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        throw new Error(
          !res.ok
            ? `Server limit reached or server error (${res.status}). If uploading a PDF, please ensure it is under 10MB or try pasting the text content.`
            : 'Received an invalid non-JSON response from server.'
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || 'AI generation failed. Please try again.');
      }

      if (!data || !Array.isArray(data.cards) || data.cards.length === 0) {
        throw new Error('AI was unable to extract flashcards from this document. Please ensure the document contains readable text or notes.');
      }

      setGeneratedResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during AI generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateCard = (index: number, field: 'front' | 'back' | 'hint' | 'explanation', value: string) => {
    if (!generatedResult) return;
    const updatedCards = [...generatedResult.cards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setGeneratedResult({ ...generatedResult, cards: updatedCards });
  };

  const handleRemoveCard = (index: number) => {
    if (!generatedResult) return;
    const updatedCards = generatedResult.cards.filter((_, i) => i !== index);
    setGeneratedResult({ ...generatedResult, cards: updatedCards });
  };

  const handleAddCard = () => {
    if (!generatedResult) return;
    setGeneratedResult({
      ...generatedResult,
      cards: [
        ...generatedResult.cards,
        { front: 'New Question', back: 'New Answer', hint: 'Optional hint', explanation: 'Optional explanation' },
      ],
    });
  };

  const handleFinalSave = () => {
    if (!generatedResult) return;
    onSaveDeck({
      title: generatedResult.title,
      description: generatedResult.description,
      category: (generatedResult.category as DeckCategory) || category,
      tags: generatedResult.tags || ['AI-Generated'],
      cards: generatedResult.cards,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Google Gemini AI Deck Generator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Generate Study Flashcards in Seconds
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl font-medium">
          Enter any topic, paste lecture notes, or upload a PDF document. AI will parse key concepts, definitions, and facts to automatically build your flashcard deck.
        </p>
      </div>

      {!generatedResult ? (
        /* Generator Form Stage */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Mode Switcher */}
          <div className="flex border-b border-slate-200 pb-4 space-x-2 sm:space-x-6 overflow-x-auto">
            <button
              onClick={() => setInputMode('topic')}
              className={`flex items-center space-x-2 pb-2 text-sm font-bold border-b-2 transition cursor-pointer shrink-0 ${
                inputMode === 'topic'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>By Topic / Subject</span>
            </button>

            <button
              onClick={() => setInputMode('notes')}
              className={`flex items-center space-x-2 pb-2 text-sm font-bold border-b-2 transition cursor-pointer shrink-0 ${
                inputMode === 'notes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Notes / Raw Text</span>
            </button>

            <button
              id="tab-upload-pdf-doc"
              onClick={() => setInputMode('document')}
              className={`flex items-center space-x-2 pb-2 text-sm font-bold border-b-2 transition cursor-pointer shrink-0 ${
                inputMode === 'document'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Upload PDF / Document</span>
            </button>
          </div>

          {/* Form Inputs */}
          {inputMode === 'topic' ? (
            <div className="space-y-4">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Study Topic / Keyword
              </label>
              <input
                type="text"
                id="input-ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Organic Chemistry Functional Groups, Macroeconomics Supply and Demand..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              />

              {/* Preset prompt inspiration pills */}
              <div className="space-y-2">
                <span className="text-xs text-slate-500 font-bold flex items-center space-x-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popular Topic Inspirations:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setTopic(p)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-bold cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : inputMode === 'notes' ? (
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Paste Lecture Notes, Article, or Textbook Content
              </label>
              <textarea
                id="input-ai-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Paste raw study notes or chapter text here..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-medium"
              />
            </div>
          ) : (
            /* Document / PDF Upload Mode */
            <div className="space-y-4">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Upload PDF, Text, Markdown, or Lecture Slide Document
              </label>

              {!uploadedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                    isDragOver
                      ? 'border-indigo-600 bg-indigo-50/60'
                      : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                    Drag and drop your PDF or document here
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 font-medium">
                    Supports PDF (.pdf), Plain Text (.txt), Markdown (.md) up to 10MB
                  </p>
                  <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer">
                    <FileUp className="w-4 h-4" />
                    <span>Browse Document File</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.text,.csv"
                      onChange={(e) => handleFileChange(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs uppercase shrink-0 shadow-xs">
                      {uploadedFile.name.endsWith('.pdf') ? 'PDF' : 'DOC'}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 line-clamp-1">
                        {uploadedFile.name}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.type || 'Document'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setFileBase64(null);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Subject Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeckCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="computer-science">Computer Science</option>
                <option value="medicine">Medicine & Health</option>
                <option value="languages">Languages</option>
                <option value="history">History & Law</option>
                <option value="science">Natural Science</option>
                <option value="business">Business & Finance</option>
                <option value="general">General Knowledge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Target Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Beginner / Fundamentals</option>
                <option value="medium">Intermediate / High-Yield</option>
                <option value="hard">Advanced / Exam Prep</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Number of Cards</label>
              <select
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 Flashcards</option>
                <option value={8}>8 Flashcards</option>
                <option value={10}>10 Flashcards</option>
                <option value={15}>15 Flashcards</option>
                <option value={20}>20 Flashcards</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
              <Zap className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="btn-generate-ai-deck"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI is generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Flashcard Deck</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Preview & Edit Generated Deck Stage */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AI Generated Preview ({generatedResult.cards.length} Cards)</span>
              </div>
              <button
                onClick={() => setGeneratedResult(null)}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline cursor-pointer"
              >
                Regenerate / Modify Settings
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Deck Title</label>
                <input
                  type="text"
                  value={generatedResult.title}
                  onChange={(e) => setGeneratedResult({ ...generatedResult, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-base focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  value={generatedResult.description}
                  onChange={(e) => setGeneratedResult({ ...generatedResult, description: e.target.value })}
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Cards List Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Review Generated Cards before saving</h3>
              <button
                onClick={handleAddCard}
                className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Extra Blank Card</span>
              </button>
            </div>

            {generatedResult.cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 relative group shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-indigo-600">Card #{idx + 1}</span>
                  <button
                    onClick={() => handleRemoveCard(idx)}
                    className="text-rose-600 hover:text-rose-800 transition cursor-pointer"
                    title="Remove card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Front (Question)</label>
                    <textarea
                      value={card.front}
                      onChange={(e) => handleUpdateCard(idx, 'front', e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Back (Answer)</label>
                    <textarea
                      value={card.back}
                      onChange={(e) => handleUpdateCard(idx, 'back', e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Hint</label>
                    <input
                      type="text"
                      value={card.hint || ''}
                      onChange={(e) => handleUpdateCard(idx, 'hint', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-700 uppercase mb-1">Explanation</label>
                    <input
                      type="text"
                      value={card.explanation || ''}
                      onChange={(e) => handleUpdateCard(idx, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={() => setGeneratedResult(null)}
              className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Discard & Retry
            </button>

            <button
              id="btn-save-ai-deck"
              onClick={handleFinalSave}
              className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 transition transform active:scale-95 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>Save Deck to My Collection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
