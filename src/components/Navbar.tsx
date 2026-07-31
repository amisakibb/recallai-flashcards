import React from 'react';
import { 
  Sparkles, 
  Layers, 
  Flame, 
  BookOpen, 
  BrainCircuit, 
  GraduationCap, 
  BarChart3, 
  Plus, 
  User, 
  Target,
  Home,
  LogIn,
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile;
  isLoggedIn: boolean;
  onOpenCreateDeck: () => void;
  onOpenProfile: () => void;
  onOpenAuthModal: (mode?: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  isLoggedIn,
  onOpenCreateDeck,
  onOpenProfile,
  onOpenAuthModal,
}) => {
  const handleNavClick = (tabId: string) => {
    if (tabId !== 'landing' && !isLoggedIn) {
      onOpenAuthModal('login');
    } else {
      setActiveTab(tabId);
    }
  };

  const handleCreateDeckClick = () => {
    if (!isLoggedIn) {
      onOpenAuthModal('login');
    } else {
      onOpenCreateDeck();
    }
  };

  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'My Decks', icon: Layers },
    { id: 'ai-generator', label: 'AI PDF & Cards', icon: Sparkles, badge: 'AI' },
    { id: 'study', label: 'Study Mode', icon: BookOpen },
    { id: 'quiz', label: 'Quiz Mode', icon: GraduationCap },
    { id: 'summarizer', label: 'AI Tutor', icon: BrainCircuit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 p-0.5 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <div className="w-full h-full bg-indigo-600 rounded-[10px] flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Recall<span className="text-indigo-600">AI</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 hidden sm:block">AI Flashcards & PDF Study</p>
            </div>
          </div>

          {/* Nav Items - Desktop (Only when Logged In) */}
          {isLoggedIn && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Widgets */}
          <div className="flex items-center space-x-2.5">
            {isLoggedIn ? (
              <>
                {/* Streak Pill */}
                <div 
                  onClick={onOpenProfile}
                  className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold cursor-pointer hover:bg-amber-100 transition shadow-2xs"
                  title="Daily Study Streak"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>{profile.streakDays}d Streak</span>
                </div>

                {/* Quick Action + Deck */}
                <button
                  id="btn-quick-create-deck"
                  onClick={handleCreateDeckClick}
                  className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Deck</span>
                </button>

                {/* User Profile Badge */}
                <button
                  id="btn-user-profile"
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2 p-1.5 pr-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition cursor-pointer"
                  title="Account Settings"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 max-w-[100px] truncate hidden md:inline">
                    {profile.name || 'Learner'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-nav-signup"
                  onClick={() => onOpenAuthModal('signup')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  <span>Sign Up</span>
                </button>
                <button
                  id="btn-nav-login"
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-nav Mobile Bar (Logged In Only) */}
      {isLoggedIn && (
        <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 bg-white/90 no-scrollbar space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

