import React from 'react';
import { X, User, Flame, Target, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
            <User className="w-5 h-5 text-indigo-600" />
            <span>Account Details</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer rounded-full hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-extrabold text-slate-900 text-base">{profile.name}</div>
              <div className="text-xs text-slate-500 font-medium">{profile.email}</div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Account</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center space-x-1 text-amber-600 font-bold">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Study Streak</span>
              </div>
              <div className="text-lg font-black text-slate-900">{profile.streakDays} Days</div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center space-x-1 text-indigo-600 font-bold">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Daily Goal</span>
              </div>
              <div className="text-lg font-black text-slate-900">{profile.todayStudiedCount}/{profile.dailyGoalCards} Cards</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {onLogout ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
