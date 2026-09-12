import { Crown, Sparkles, Shield, ArrowRight } from 'lucide-react';
import type { Character } from '../types.ts';

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number;
  character: Character;
  onClose: () => void;
}

export function LevelUpModal({
  isOpen,
  newLevel,
  character,
  onClose
}: LevelUpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#181b28] to-[#0d0f17] border-2 border-amber-500/60 rounded-3xl p-7 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col items-center gap-5 overflow-hidden">
        {/* Radiance background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Level Up Crest */}
        <div className="relative mt-2">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-1 shadow-2xl shadow-amber-500/40 animate-bounce">
            <div className="w-full h-full rounded-[22px] bg-[#12141f] flex flex-col items-center justify-center">
              <Crown className="w-10 h-10 text-amber-400" />
            </div>
          </div>
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-xs font-mono tracking-wider shadow-md">
            LEVEL {newLevel}
          </div>
        </div>

        {/* Titles */}
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 font-cinzel">
            Triumph Achieved
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white mt-1">
            LEVEL UP!
          </h2>
          <p className="text-sm font-semibold text-amber-200/90 mt-1">
            Unlocked Title: <span className="underline decoration-amber-400/50">{character.classTitle}</span>
          </p>
          <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto">
            Your daily consistency has manifested in tangible virtual power. All primary attributes have increased!
          </p>
        </div>

        {/* Stat Rewards Grid */}
        <div className="w-full grid grid-cols-5 gap-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex flex-col items-center p-1.5 rounded-xl bg-red-950/20 border border-red-500/20">
            <span className="text-[10px] font-bold text-red-400">STR</span>
            <span className="text-xs font-extrabold text-white mt-0.5">+{character.stats.str}</span>
            <span className="text-[9px] text-emerald-400 font-bold">+1</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-xl bg-blue-950/20 border border-blue-500/20">
            <span className="text-[10px] font-bold text-blue-400">INT</span>
            <span className="text-xs font-extrabold text-white mt-0.5">+{character.stats.int}</span>
            <span className="text-[9px] text-emerald-400 font-bold">+1</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-400">VIT</span>
            <span className="text-xs font-extrabold text-white mt-0.5">+{character.stats.vit}</span>
            <span className="text-[9px] text-emerald-400 font-bold">+1</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-400">DIS</span>
            <span className="text-xs font-extrabold text-white mt-0.5">+{character.stats.dis}</span>
            <span className="text-[9px] text-emerald-400 font-bold">+1</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <span className="text-[10px] font-bold text-purple-400">CHA</span>
            <span className="text-xs font-extrabold text-white mt-0.5">+{character.stats.cha}</span>
            <span className="text-[9px] text-emerald-400 font-bold">+1</span>
          </div>
        </div>

        {/* Claim CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-black font-cinzel font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
        >
          <span>Claim Glory & Return</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
