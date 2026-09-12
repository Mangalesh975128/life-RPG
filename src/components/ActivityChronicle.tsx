import { Scroll, Sparkles, Trophy, ShoppingBag, ShieldCheck, Clock } from 'lucide-react';
import type { ActivityLog } from '../types.ts';

interface ActivityChronicleProps {
  logs: ActivityLog[];
}

export function ActivityChronicle({ logs }: ActivityChronicleProps) {
  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'level_up':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'item_bought':
      case 'item_equipped':
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case 'streak_extended':
        return <Sparkles className="w-4 h-4 text-orange-400" />;
      case 'reward_redeemed':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-[#12151f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold font-cinzel text-white tracking-wide">
            Activity Chronicle & Audit Log
          </h2>
        </div>
        <span className="text-xs text-neutral-400 font-mono">
          {logs.length} Recorded Milestones
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-neutral-500 text-xs">
          No entries recorded yet. Begin your quests to write history!
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {logs.map(log => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            const dateStr = new Date(log.timestamp).toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr} at {timeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {log.xpGained !== undefined && (
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      +{log.xpGained} XP
                    </span>
                  )}
                  {log.goldChange !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        log.goldChange >= 0 ? 'text-amber-300' : 'text-red-400'
                      }`}
                    >
                      {log.goldChange > 0 ? `+${log.goldChange}` : log.goldChange} G
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
