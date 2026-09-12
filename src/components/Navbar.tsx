import { Volume2, VolumeX, Flame, Coins, Shield, LogOut, Keyboard, User as UserIcon } from 'lucide-react';
import type { Character, User } from '../types.ts';
import { soundFX } from '../utils/audio.ts';

interface NavbarProps {
  character: Character | null;
  user: User | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
  onOpenShortcuts: () => void;
  onOpenAuth: () => void;
}

export function Navbar({
  character,
  user,
  soundEnabled,
  onToggleSound,
  onLogout,
  onOpenShortcuts,
  onOpenAuth
}: NavbarProps) {
  const xpPercent = character
    ? Math.min(100, Math.round((character.currentXp / Math.max(1, character.xpNeeded)) * 100))
    : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0e1017]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Crest */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-lg font-bold tracking-wider text-amber-100">LIFE RPG</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO V1.0
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-sans hidden sm:block">Real-World Mastery Progression</p>
          </div>
        </div>

        {/* Center: Character Quick Stats (Level & XP Bar) */}
        {character && (
          <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">LVL</span>
              <span className="text-base font-extrabold text-amber-400 font-cinzel">{character.level}</span>
            </div>

            {/* XP Bar */}
            <div className="w-44 flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-semibold text-neutral-300">
                <span>XP</span>
                <span className="text-amber-300/90 font-mono">
                  {character.currentXp} / {character.xpNeeded} ({xpPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right: Currency, Streaks, Audio, Account */}
        <div className="flex items-center gap-3">
          {character ? (
            <>
              {/* Streak Multiplier Badge */}
              <div
                title={`Consecutive Daily Streak: ${character.streak.current} Days. Multiplier: ${character.streak.multiplier}x bonus!`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-500/40 text-orange-300 text-xs font-semibold cursor-help"
              >
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="font-bold">{character.streak.current}d</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-orange-500/20 text-orange-200 border border-orange-400/20">
                  {character.streak.multiplier}x
                </span>
              </div>

              {/* Gold Counter */}
              <div
                title="Your earned Gold bounty. Spend in the Armory or on real-world rewards!"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-help"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="font-bold font-mono text-sm">{character.gold}</span>
                <span className="text-[11px] text-amber-400/80">G</span>
              </div>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Mute Game Sounds' : 'Enable Game Audio (Chimes & Fanfare)'}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors"
                aria-label="Toggle sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>

              {/* Keyboard Shortcuts Dialog Trigger */}
              <button
                type="button"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts & Hotkeys"
                className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              {/* Profile & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-neutral-200">{user?.username || character.name}</p>
                  <p className="text-[10px] text-neutral-400 truncate max-w-[110px]">{character.classTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out of current character"
                  className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm shadow-md transition-all font-sans"
            >
              <UserIcon className="w-4 h-4" />
              <span>Adventurer Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
