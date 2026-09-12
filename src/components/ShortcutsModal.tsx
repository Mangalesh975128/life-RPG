import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'N', desc: 'Draft a new Quest contract' },
    { key: '1', desc: 'Navigate to Quests Feed' },
    { key: '2', desc: 'Navigate to Grand Bazaar & Armory' },
    { key: '3', desc: 'Navigate to Activity Chronicle' },
    { key: '4', desc: 'Navigate to Tiny Arcade Arena' },
    { key: 'Space / Up', desc: 'Jump / Flap / Action in Tiny Game UI' },
    { key: 'M', desc: 'Toggle Audio sound effects' },
    { key: 'Tab', desc: 'Jump between quest cards & buttons' },
    { key: 'Enter / Space', desc: 'Toggle quest completion or claim rewards' },
    { key: 'Esc', desc: 'Dismiss active dialog or close modal' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121520] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold font-cinzel text-white">Keyboard Navigation & Hotkeys</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400">
          Life RPG is engineered for high-velocity productivity with full keyboard accessibility.
        </p>

        <div className="grid grid-cols-1 gap-2">
          {shortcuts.map(s => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <span className="text-xs text-neutral-300">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-mono font-bold text-amber-300">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
