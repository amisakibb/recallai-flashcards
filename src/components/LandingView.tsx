import React from 'react';
import { 
  Sparkles, 
  FileUp, 
  BrainCircuit, 
  Layers, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  ShieldCheck, 
  Cloud, 
  Zap,
  BookOpen
} from 'lucide-react';

interface LandingViewProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenAuth,
}) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* Hero Header */}
      <section className="text-center space-y-6 pt-6 sm:pt-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI-Powered Active Recall Study Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Turn Any PDF or Notes into <span className="text-indigo-600">Smart Flashcards</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
          Upload textbook PDFs, lecture slides, or class notes. Our AI instantly extracts key concepts, builds flashcards, and generates practice quizzes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            id="btn-landing-signup"
            onClick={() => onOpenAuth('signup')}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 transition transform active:scale-95 flex items-center justify-center space-x-2.5 text-base cursor-pointer"
          >
            <Zap className="w-5 h-5 text-amber-300" />
            <span>Create Free Account</span>
          </button>

          <button
            id="btn-landing-login"
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md transition transform active:scale-95 flex items-center justify-center space-x-2 text-base cursor-pointer"
          >
            <span>Log In to Account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <FileUp className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Instant PDF Processing</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Drop course PDFs, slides, or raw text. The AI parses key definitions, formulas, and Q&A flashcards instantly.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Spaced Repetition & Quizzes</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Master your exams with active recall flip modes, smart difficulty ratings, and AI multiple-choice quizzes.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <Cloud className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">Automatic Sync</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Log in once and all your study decks, review streaks, and scores automatically sync across all your devices.
          </p>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-black tracking-tight">Ready to start studying smarter?</h2>
            <p className="text-xs text-slate-300 font-medium">
              Create an account now to start creating AI flashcards from your course materials.
            </p>
          </div>

          <button
            onClick={() => onOpenAuth('signup')}
            className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl transition shadow-md cursor-pointer flex items-center justify-center space-x-2 shrink-0"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
