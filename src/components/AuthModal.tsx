import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Cloud,
  AlertCircle,
  ArrowRight,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { isSupabaseConfigured, getSupabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  // Called once Supabase confirms a real session exists. App.tsx's own
  // onAuthStateChange listener is the actual source of truth for
  // isLoggedIn — this just lets the modal close itself promptly.
  onAuthSuccess: () => void;
  // Explicit, clearly-labeled local/offline mode. Does NOT create or
  // pretend to create a cloud account.
  onGuestLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
  onGuestLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setMsg(null);
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const isCloudConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!isCloudConfigured) {
      setMsg({
        type: 'error',
        text: 'Cloud accounts are not configured for this deployment. Use Guest Mode below, or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      setMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!password || password.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setMsg({ type: 'error', text: 'Could not reach the authentication service. Please try again.' });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split('@')[0] },
          },
        });

        if (error) {
          setMsg({ type: 'error', text: error.message });
          setIsLoading(false);
          return;
        }

        if (data.session) {
          // Email confirmation is disabled on this project — user is signed in immediately.
          setMsg({ type: 'success', text: 'Account created! You are now logged in.' });
          setTimeout(() => {
            onAuthSuccess();
            onClose();
          }, 600);
        } else {
          setMsg({
            type: 'success',
            text: 'Account created! Check your email to confirm your address, then log in.',
          });
          setMode('login');
          setPassword('');
        }
        setIsLoading(false);
        return;
      }

      // Login mode — real credential check against Supabase. Wrong
      // credentials return an error and the user is NOT logged in.
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMsg({ type: 'error', text: error.message || 'Invalid email or password.' });
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        setMsg({ type: 'error', text: 'Login failed. Please try again.' });
        setIsLoading(false);
        return;
      }

      setMsg({ type: 'success', text: 'Welcome back! You are now logged in.' });
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Authentication failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    onGuestLogin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'login'
              ? 'Log in to sync your AI flashcards & study stats across devices'
              : 'Sign up for free to save decks, track streaks & enable cloud sync'}
          </p>
        </div>

        {/* Cloud Status Banner */}
        <div
          className={`p-3.5 rounded-2xl flex items-center space-x-3 text-xs font-semibold ${
            isCloudConfigured
              ? 'bg-indigo-50/80 border border-indigo-100 text-indigo-900'
              : 'bg-amber-50 border border-amber-200 text-amber-900'
          }`}
        >
          {isCloudConfigured ? (
            <Cloud className="w-5 h-5 text-indigo-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span>{isCloudConfigured ? 'Supabase Cloud Accounts Enabled' : 'Cloud Accounts Not Configured'}</span>
            <p className={`text-[11px] font-normal ${isCloudConfigured ? 'text-indigo-700' : 'text-amber-700'}`}>
              {isCloudConfigured
                ? 'Your decks and study statistics will be securely backed up to your account.'
                : 'This deployment has no Supabase keys set, so real accounts are unavailable — use Guest Mode to try the app locally.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={!isCloudConfigured || isLoading} className="space-y-4 disabled:opacity-50">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="you@student.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </fieldset>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                msg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {msg.text}
            </div>
          )}

          {isCloudConfigured && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Processing...' : mode === 'login' ? 'Log In & Sync' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Guest Mode */}
        <button
          type="button"
          onClick={handleGuestLogin}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition transform active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
        >
          <UserRound className="w-4 h-4" />
          <span>Continue as Guest (offline, this device only)</span>
        </button>

        {/* Switch between Login and Signup */}
        {isCloudConfigured && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <div className="text-xs text-slate-500 font-medium">
              {mode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setMsg(null); }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setMsg(null); }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
