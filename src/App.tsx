import React, { useState, useEffect, useRef } from 'react';
import { 
  getStoredDecks, 
  saveStoredDecks, 
  getStoredCards, 
  saveStoredCards, 
  getStoredProfile, 
  saveStoredProfile, 
  getStoredQuizResults, 
  saveQuizResult, 
  getStoredStudySessions, 
  saveStudySession,
  clearAllStoredData,
  defaultProfile,
} from './lib/storage';
import { getSupabase, isSupabaseConfigured } from './lib/supabase';
import { pullUserLibrary, pushUserLibrary } from './lib/cloudSync';
import { Deck, Flashcard, UserProfile, CardStatus, DeckCategory, QuizResult, StudySessionStats } from './types';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { DeckDetailView } from './components/DeckDetailView';
import { StudyModeView } from './components/StudyModeView';
import { AIGeneratorView } from './components/AIGeneratorView';
import { QuizModeView } from './components/QuizModeView';
import { ConceptSummarizerView } from './components/ConceptSummarizerView';
import { AnalyticsView } from './components/AnalyticsView';
import { CreateDeckModal } from './components/CreateDeckModal';
import { CreateCardModal } from './components/CreateCardModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const [decks, setDecks] = useState<Deck[]>(() => getStoredDecks());
  const [cards, setCards] = useState<Flashcard[]>(() => getStoredCards());
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => getStoredQuizResults());
  const [studySessions, setStudySessions] = useState<StudySessionStats[]>(() => getStoredStudySessions());

  // `session` is the ONLY source of truth for a real, verified account —
  // it is set exclusively from Supabase's own auth state, never from a
  // client-side flag a user could fake by typing arbitrary credentials.
  const [session, setSession] = useState<any>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(!isSupabaseConfigured());
  // Guest mode is a separate, explicitly-chosen offline mode — it never
  // claims to be an authenticated cloud account.
  const [guestMode, setGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('recallai_guest_mode') === 'true';
  });
  const isLoggedIn = Boolean(session) || guestMode;
  const cloudSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextPush = useRef(false);

  // Initialize + subscribe to real Supabase auth state.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthInitialized(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setAuthInitialized(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // When a real session appears, pull that user's cloud library (if any)
  // so a fresh login on a new device shows their real saved decks instead
  // of whatever happens to be sitting in this browser's localStorage.
  useEffect(() => {
    if (!session?.user?.id) return;

    (async () => {
      const library = await pullUserLibrary(session.user.id);
      if (library) {
        skipNextPush.current = true;
        setDecks(library.decks);
        setCards(library.cards);
        if (library.profile) setProfile(library.profile);
      } else {
        // No cloud row yet — push current local state up as their starting library.
        pushUserLibrary(session.user.id, { decks, cards, profile });
      }
    })();
    // Only re-run when the logged-in user changes, not on every decks/cards edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Debounced auto-push: whenever the user's data changes while logged in
  // with a real account, mirror it to Supabase shortly after.
  useEffect(() => {
    if (!session?.user?.id) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current);
    cloudSyncTimer.current = setTimeout(() => {
      pushUserLibrary(session.user.id, { decks, cards, profile });
    }, 1200);
    return () => {
      if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks, cards, profile, session?.user?.id]);

  // Modal controls
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [aiGeneratorInitialTopic, setAiGeneratorInitialTopic] = useState<string>('');
  const [aiGeneratorInitialMode, setAiGeneratorInitialMode] = useState<'topic' | 'notes' | 'document'>('document');
  const [isAIExpandingDeck, setIsAIExpandingDeck] = useState(false);

  // Sync state to storage
  useEffect(() => {
    saveStoredDecks(decks);
  }, [decks]);

  useEffect(() => {
    saveStoredCards(cards);
  }, [cards]);

  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  // Route guard: Prevent accessing decks or creators before login.
  // Waits for authInitialized so a real logged-in user isn't bounced
  // back to the landing page for a frame while Supabase restores their session.
  useEffect(() => {
    if (!authInitialized) return;
    if (!isLoggedIn && activeTab !== 'landing') {
      setActiveTab('landing');
      setIsAuthOpen(true);
    }
  }, [isLoggedIn, activeTab, authInitialized]);

  // Handlers
  const handleSelectDeckToStudy = (deckId: string) => {
    setSelectedDeckId(deckId);
    setActiveTab('study');
  };

  const handleSelectDeckToQuiz = (deckId: string) => {
    setSelectedDeckId(deckId);
    setActiveTab('quiz');
  };

  const handleSelectDeckDetail = (deckId: string) => {
    setSelectedDeckId(deckId);
    setActiveTab('deck-detail');
  };

  const handleOpenAIGenerator = (presetTopic?: string, mode?: 'topic' | 'notes' | 'document') => {
    setAiGeneratorInitialTopic(presetTopic || '');
    setAiGeneratorInitialMode(mode || (presetTopic ? 'topic' : 'document'));
    setActiveTab('ai-generator');
  };

  const handleCreateDeckSubmit = (data: { title: string; description: string; category: DeckCategory; tags: string[] }) => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      color: 'indigo',
      tags: data.tags,
      cardCount: 0,
      masteredCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDecks((prev) => [newDeck, ...prev]);
    setSelectedDeckId(newDeck.id);
    setActiveTab('deck-detail');
  };

  const handleSaveDeckFromAI = (data: {
    title: string;
    description: string;
    category: DeckCategory;
    tags: string[];
    cards: Array<{ front: string; back: string; hint?: string; explanation?: string }>;
  }) => {
    const newDeckId = `deck-ai-${Date.now()}`;
    const newDeck: Deck = {
      id: newDeckId,
      title: data.title,
      description: data.description,
      category: data.category,
      color: 'cyan',
      tags: data.tags,
      cardCount: data.cards.length,
      masteredCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newCards: Flashcard[] = data.cards.map((c, idx) => ({
      id: `card-ai-${Date.now()}-${idx}`,
      deckId: newDeckId,
      front: c.front,
      back: c.back,
      hint: c.hint,
      explanation: c.explanation,
      status: 'new',
      difficulty: 'medium',
      reviewCount: 0,
    }));

    setDecks((prev) => [newDeck, ...prev]);
    setCards((prev) => [...newCards, ...prev]);
    setSelectedDeckId(newDeckId);
    setActiveTab('deck-detail');
  };

  const handleAIExpandDeck = async (deck: Deck) => {
    setIsAIExpandingDeck(true);
    try {
      const res = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: deck.title,
          notes: deck.description,
          cardCount: 5,
          category: deck.category,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to expand deck with AI.');
      }

      const data = await res.json();
      const generatedCards: Array<{ front: string; back: string; hint?: string; explanation?: string }> = data.cards || [];

      const newCards: Flashcard[] = generatedCards.map((c, idx) => ({
        id: `card-expand-${Date.now()}-${idx}`,
        deckId: deck.id,
        front: c.front,
        back: c.back,
        hint: c.hint,
        explanation: c.explanation,
        status: 'new',
        difficulty: 'medium',
        reviewCount: 0,
      }));

      setCards((prev) => [...newCards, ...prev]);
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deck.id ? { ...d, cardCount: d.cardCount + newCards.length, updatedAt: new Date().toISOString() } : d
        )
      );
    } catch (err) {
      console.error('Error expanding deck', err);
      alert('Failed to generate extra cards with AI. Please check your API key.');
    } finally {
      setIsAIExpandingDeck(false);
    }
  };

  const handleCreateOrEditCardSubmit = (data: {
    front: string;
    back: string;
    hint?: string;
    explanation?: string;
    difficulty: any;
  }) => {
    if (!selectedDeckId) return;

    if (editingCard) {
      // Edit
      setCards((prev) =>
        prev.map((c) => (c.id === editingCard.id ? { ...c, ...data } : c))
      );
    } else {
      // Create
      const newCard: Flashcard = {
        id: `card-${Date.now()}`,
        deckId: selectedDeckId,
        front: data.front,
        back: data.back,
        hint: data.hint,
        explanation: data.explanation,
        status: 'new',
        difficulty: data.difficulty,
        reviewCount: 0,
      };

      setCards((prev) => [newCard, ...prev]);
      setDecks((prev) =>
        prev.map((d) =>
          d.id === selectedDeckId ? { ...d, cardCount: d.cardCount + 1, updatedAt: new Date().toISOString() } : d
        )
      );
    }

    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    const cardToDelete = cards.find((c) => c.id === cardId);
    if (!cardToDelete) return;

    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setDecks((prev) =>
      prev.map((d) =>
        d.id === cardToDelete.deckId ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d
      )
    );
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setCards((prev) => prev.filter((c) => c.deckId !== deckId));
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null);
      setActiveTab('dashboard');
    }
  };

  const handleUpdateCardStatus = (cardId: string, status: CardStatus) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              status,
              reviewCount: c.reviewCount + 1,
              lastReviewedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const handleFinishStudySession = (stats: {
    deckId: string;
    cardsStudied: number;
    cardsMastered: number;
    cardsReviewAgain: number;
    timeSpentSeconds: number;
  }) => {
    const sessionRecord: StudySessionStats = { ...stats, date: new Date().toISOString() };
    saveStudySession(sessionRecord);
    setStudySessions((prev) => [sessionRecord, ...prev]);

    // Update user profile daily count
    setProfile((prev) => {
      const newTodayCount = prev.todayStudiedCount + stats.cardsStudied;
      return {
        ...prev,
        todayStudiedCount: newTodayCount,
        totalCardsStudied: prev.totalCardsStudied + stats.cardsStudied,
        totalMasteredCount: prev.totalMasteredCount + stats.cardsMastered,
      };
    });
  };

  const handleSaveQuizResult = (result: QuizResult) => {
    saveQuizResult(result);
    setQuizResults((prev) => [result, ...prev]);
  };

  const activeDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        isLoggedIn={isLoggedIn}
        onOpenCreateDeck={() => setIsCreateDeckOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthMode(mode || 'login');
          setIsAuthOpen(true);
        }}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'landing' && (
          <LandingView
            isLoggedIn={isLoggedIn}
            onOpenAuth={(mode) => {
              setAuthMode(mode || 'signup');
              setIsAuthOpen(true);
            }}
            onUploadPDF={() => handleOpenAIGenerator('', 'document')}
            onExploreDecks={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            decks={decks}
            cards={cards}
            onSelectDeckToStudy={handleSelectDeckToStudy}
            onSelectDeckToQuiz={handleSelectDeckToQuiz}
            onSelectDeckDetail={handleSelectDeckDetail}
            onOpenAIGenerator={handleOpenAIGenerator}
            onOpenCreateDeckModal={() => setIsCreateDeckOpen(true)}
            onDeleteDeck={handleDeleteDeck}
          />
        )}

        {activeTab === 'deck-detail' && activeDeck && (
          <DeckDetailView
            deck={activeDeck}
            cards={cards}
            onBack={() => setActiveTab('dashboard')}
            onStartStudy={handleSelectDeckToStudy}
            onStartQuiz={handleSelectDeckToQuiz}
            onOpenAddCardModal={(dId) => {
              setSelectedDeckId(dId);
              setEditingCard(null);
              setIsCreateCardOpen(true);
            }}
            onOpenEditCardModal={(card) => {
              setSelectedDeckId(card.deckId);
              setEditingCard(card);
              setIsCreateCardOpen(true);
            }}
            onDeleteCard={handleDeleteCard}
            onDeleteDeck={handleDeleteDeck}
            onUpdateCardStatus={handleUpdateCardStatus}
            onAIExpandDeck={handleAIExpandDeck}
            isAIExpanding={isAIExpandingDeck}
          />
        )}

        {activeTab === 'study' && activeDeck && (
          <StudyModeView
            deck={activeDeck}
            cards={cards}
            onBack={() => setActiveTab('dashboard')}
            onUpdateCardStatus={handleUpdateCardStatus}
            onFinishSession={handleFinishStudySession}
            onStartQuiz={handleSelectDeckToQuiz}
          />
        )}

        {activeTab === 'ai-generator' && (
          <AIGeneratorView
            initialTopic={aiGeneratorInitialTopic}
            initialMode={aiGeneratorInitialMode}
            onSaveDeck={handleSaveDeckFromAI}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizModeView
            decks={decks}
            cards={cards}
            selectedDeckId={selectedDeckId || undefined}
            onSaveQuizResult={handleSaveQuizResult}
            onBackToDecks={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'summarizer' && (
          <ConceptSummarizerView
            onCreateDeckFromSummary={handleSaveDeckFromAI}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            decks={decks}
            cards={cards}
            profile={profile}
            quizResults={quizResults}
            studySessions={studySessions}
            onStartStudy={handleSelectDeckToStudy}
          />
        )}
      </main>

      {/* Global Modals */}
      <CreateDeckModal
        isOpen={isCreateDeckOpen}
        onClose={() => setIsCreateDeckOpen(false)}
        onSubmit={handleCreateDeckSubmit}
      />

      <CreateCardModal
        isOpen={isCreateCardOpen}
        deckId={selectedDeckId || ''}
        initialCard={editingCard}
        onClose={() => {
          setIsCreateCardOpen(false);
          setEditingCard(null);
        }}
        onSubmit={handleCreateOrEditCardSubmit}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={setProfile}
        onLogout={async () => {
          const supabase = getSupabase();
          if (supabase && session) {
            await supabase.auth.signOut();
          }
          setSession(null);
          setGuestMode(false);
          localStorage.removeItem('recallai_guest_mode');
          // Reset to a clean local slate so the next person on this device/browser
          // doesn't see the previous account's decks and stats.
          clearAllStoredData();
          setDecks([]);
          setCards([]);
          setQuizResults([]);
          setStudySessions([]);
          setProfile(defaultProfile());
          setSelectedDeckId(null);
          setActiveTab('landing');
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          // `session` updates via the onAuthStateChange listener; just route the user in.
          setActiveTab('dashboard');
        }}
        onGuestLogin={() => {
          setGuestMode(true);
          localStorage.setItem('recallai_guest_mode', 'true');
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
}
