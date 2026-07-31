import React, { useState } from 'react';
import { X, Layers, Sparkles } from 'lucide-react';
import { DeckCategory } from '../types';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deckData: { title: string; description: string; category: DeckCategory; tags: string[] }) => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DeckCategory>('computer-science');
  const [tagsText, setTagsText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tags.length > 0 ? tags : ['Study'],
    });

    // Reset
    setTitle('');
    setDescription('');
    setTagsText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-lg">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Create Custom Deck</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Deck Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neuroscience & Brain Pathology"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief summary of what this deck covers..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Subject Category
            </label>
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
              <option value="business">Business & Econ</option>
              <option value="general">General Knowledge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="e.g. Brain, USMLE, Anatomy"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
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
              Create Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
