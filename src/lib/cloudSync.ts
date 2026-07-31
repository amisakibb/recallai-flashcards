import { getSupabase, isSupabaseConfigured } from './supabase';
import { Deck, Flashcard, UserProfile } from '../types';

export interface UserLibrary {
  decks: Deck[];
  cards: Flashcard[];
  profile: UserProfile;
}

// Pulls the authenticated user's saved library from Supabase.
// Returns null if cloud sync isn't configured, the user has no row yet,
// or the request fails for any reason (caller falls back to local data).
export async function pullUserLibrary(userId: string): Promise<UserLibrary | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_library')
    .select('decks, cards, profile')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('cloudSync: pull failed', error.message);
    return null;
  }
  if (!data) return null;

  return {
    decks: (data.decks as Deck[]) || [],
    cards: (data.cards as Flashcard[]) || [],
    profile: data.profile as UserProfile,
  };
}

// Pushes the current library up to Supabase for the authenticated user.
// Row-Level Security (see supabase/schema.sql) ensures a user can only
// ever write to the row matching their own auth.uid().
export async function pushUserLibrary(userId: string, library: UserLibrary): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from('user_library').upsert(
    {
      id: userId,
      decks: library.decks,
      cards: library.cards,
      profile: library.profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('cloudSync: push failed', error.message);
    return false;
  }
  return true;
}
