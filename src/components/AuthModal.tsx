import React, { useState } from 'react';
import { Shield, Sparkles, User, Lock, Mail, AlertCircle, Play, X } from 'lucide-react';
import { api } from '../api/client.ts';
import type { AuthResponse } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (data: AuthResponse) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res: AuthResponse;
      if (isLogin) {
        res = await api.login(email || username, password);
      } else {
        if (!username.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all fields');
        }
        res = await api.signup(username.trim(), email.trim(), password);
      }
      onAuthSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.loginDemo();
      onAuthSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121520] border border-amber-500/30 rounded-3xl p-7 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-cinzel text-white">
                {isLogin ? 'Enter The Realm' : 'Create Adventurer'}
              </h2>
              <p className="text-xs text-neutral-400">Life RPG Cross-Device Sync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Quick Start Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-cinzel">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Evaluation Mode
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Instant
            </span>
          </div>
          <p className="text-[11px] text-neutral-300">
            Play as <strong>Valerius</strong> (Level 3 Blade of Discipline) with pre-configured active quests and starter loot.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleDemoLogin}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold font-cinzel text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Launch Instant Demo Hero</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#121520] px-3 text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
            Or Account Authentication
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                Hero Name / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. IronAdept"
                  className="w-full bg-[#0b0d14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              {isLogin ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={isLogin ? 'text' : 'email'}
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isLogin ? 'adventurer@liferpg.realm' : 'hero@domain.com'}
                className="w-full bg-[#0b0d14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b0d14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wider uppercase border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Consulting Runes...' : isLogin ? 'Sign In' : 'Enlist Character'}
          </button>
        </form>

        <div className="text-center pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
          >
            {isLogin
              ? "Don't have an adventurer record? Enlist here."
              : 'Already forged an identity? Sign In.'}
          </button>
        </div>
      </div>
    </div>
  );
}
