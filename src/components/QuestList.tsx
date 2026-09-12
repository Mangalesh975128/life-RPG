import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Calendar,
  Flame,
  Sparkles,
  Coins,
  Edit2,
  Trash2,
  Filter,
  Check,
  Undo2,
  Skull,
  Clock,
  Target,
  Shield
} from 'lucide-react';
import type { Quest, AttributeKey, QuestType } from '../types.ts';
import { ATTRIBUTES } from '../utils/attributes.ts';

interface QuestListProps {
  quests: Quest[];
  onCompleteQuest: (questId: string, event: React.MouseEvent) => void;
  onUncompleteQuest: (questId: string) => void;
  onOpenCreate: () => void;
  onEditQuest: (quest: Quest) => void;
  onDeleteQuest: (questId: string) => void;
}

export function QuestList({
  quests,
  onCompleteQuest,
  onUncompleteQuest,
  onOpenCreate,
  onEditQuest,
  onDeleteQuest
}: QuestListProps) {
  const [activeTab, setActiveTab] = useState<'all' | QuestType | 'completed' | 'hardcore'>('all');
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuests = useMemo(() => {
    return quests.filter(q => {
      // Tab filter
      if (activeTab === 'hardcore') {
        if (!q.modifier || q.modifier === 'none') return false;
        if (q.completed) return false;
      } else if (activeTab === 'completed') {
        if (!q.completed) return false;
      } else if (activeTab !== 'all') {
        if (q.type !== activeTab) return false;
        if (q.completed) return false; // In active tabs, hide completed quests to avoid clutter
      } else {
        // 'all' tab shows active quests first
        if (q.completed) return false;
      }

      // Attribute filter
      if (selectedAttribute !== 'all' && q.attribute !== selectedAttribute) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchNotes = q.notes ? q.notes.toLowerCase().includes(query) : false;
        if (!matchTitle && !matchNotes) return false;
      }

      return true;
    });
  }, [quests, activeTab, selectedAttribute, searchQuery]);

  const activeCount = quests.filter(q => !q.completed).length;
  const completedCount = quests.filter(q => q.completed).length;
  const hardcoreCount = quests.filter(q => !q.completed && q.modifier && q.modifier !== 'none').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls Bar: Tabs, Search, and New Quest CTA */}
      <div className="bg-[#12151f] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            Active Quests ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hardcore')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'hardcore'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30'
            }`}
          >
            <Skull className="w-3.5 h-3.5 text-red-400" />
            <span>Strong Problems ({hardcoreCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            Dailies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habit')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'habit'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            Habits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bounty')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bounty'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            Bounties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Action button: Add Quest */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs tracking-wider uppercase font-cinzel shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quest</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
            N
          </span>
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Attribute filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedAttribute('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedAttribute === 'all'
                ? 'bg-white/20 border-white/40 text-white'
                : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Stats
          </button>
          {(Object.keys(ATTRIBUTES) as AttributeKey[]).map(key => {
            const attr = ATTRIBUTES[key];
            const isSelected = selectedAttribute === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedAttribute(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                  isSelected
                    ? `${attr.bgBadge} ${attr.borderBadge} ${attr.textBadge}`
                    : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: attr.color }}
                />
                <span>{attr.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search active quests..."
            className="w-full bg-[#12151f] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Quest Cards Feed */}
      {filteredQuests.length === 0 ? (
        <div className="bg-[#12151f]/50 border border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-cinzel text-white">
              {activeTab === 'completed'
                ? 'No completed quests yet!'
                : 'All quests in this view conquered!'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              {activeTab === 'completed'
                ? 'Check off active tasks to claim XP, gold, and expand your character chronicles.'
                : 'Click "New Quest" to post your next adventure, training routine, or study session.'}
            </p>
          </div>
          {activeTab !== 'completed' && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-sans transition-all"
            >
              + Create First Quest
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={onCompleteQuest}
              onUncomplete={onUncompleteQuest}
              onEdit={onEditQuest}
              onDelete={onDeleteQuest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestCard({
  quest,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete
}: {
  key?: string;
  quest: Quest;
  onComplete: (id: string, e: React.MouseEvent) => void;
  onUncomplete: (id: string) => void;
  onEdit: (q: Quest) => void;
  onDelete: (id: string) => void;
}) {
  const attr = ATTRIBUTES[quest.attribute] || ATTRIBUTES.str;

  const difficultyColors: Record<string, { badge: string; border: string; label: string }> = {
    easy: { badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40', border: 'border-l-emerald-500', label: 'Easy' },
    medium: { badge: 'bg-blue-950/40 text-blue-300 border-blue-500/40', border: 'border-l-blue-500', label: 'Medium' },
    hard: { badge: 'bg-amber-950/40 text-amber-300 border-amber-500/40', border: 'border-l-amber-500', label: 'Hard' },
    epic: { badge: 'bg-purple-950/40 text-purple-300 border-purple-500/40', border: 'border-l-purple-500', label: 'Epic' }
  };

  const diff = difficultyColors[quest.difficulty] || difficultyColors.medium;
  const isHardcore = quest.modifier && quest.modifier !== 'none';

  return (
    <div
      className={`group relative bg-[#12151f] hover:bg-[#161a26] border rounded-2xl p-4 transition-all duration-200 shadow-md ${
        quest.completed
          ? 'opacity-70 border-emerald-500/20'
          : isHardcore
          ? 'border-red-500/40 shadow-red-500/5 ring-1 ring-red-500/20'
          : 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox Trigger */}
        <div className="pt-0.5">
          {quest.completed ? (
            <button
              type="button"
              onClick={() => onUncomplete(quest.id)}
              title="Click to revert / mark active"
              className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all"
              aria-label="Completed quest. Click to revert."
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={e => onComplete(quest.id, e)}
              title="Complete Quest! Claim XP & Gold"
              className="w-7 h-7 rounded-xl bg-white/5 border border-white/20 hover:border-amber-400 hover:bg-amber-500/20 text-transparent hover:text-amber-300 flex items-center justify-center transition-all group-hover:scale-105 active:scale-95"
              aria-label="Mark quest completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${diff.badge}`}
            >
              {diff.label}
            </span>

            {/* Attribute tag */}
            <span
              className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border ${attr.bgBadge} ${attr.borderBadge} ${attr.textBadge}`}
            >
              +{quest.attribute.toUpperCase()} ({attr.name})
            </span>

            {/* Modifier Tag */}
            {quest.modifier === 'doom_clock' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-md bg-red-950/40 border border-red-500/40 animate-pulse">
                <Clock className="w-3 h-3 text-red-400" />
                <span>Doom Clock (+50% Bounty)</span>
              </span>
            )}
            {quest.modifier === 'iron_man' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-purple-300 px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-500/40">
                <Skull className="w-3 h-3 text-purple-400" />
                <span>Iron Man (2x Bounty)</span>
              </span>
            )}
            {quest.modifier === 'boss_bane' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/40">
                <Target className="w-3 h-3 text-amber-400" />
                <span>Boss Bane (+220 Boss DMG)</span>
              </span>
            )}
            {quest.modifier === 'titan_trial' && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/40">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Spartan (+2 Stat Points)</span>
              </span>
            )}

            {/* Type */}
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              {quest.type}
            </span>

            {/* Streak if any */}
            {quest.streak && quest.streak > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 px-1.5 py-0.5 rounded bg-orange-950/30 border border-orange-500/30">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>{quest.streak} Streak</span>
              </span>
            ) : null}
          </div>

          <h3
            className={`text-sm sm:text-base font-bold text-white mt-1.5 break-words font-sans ${
              quest.completed ? 'line-through text-neutral-400' : ''
            }`}
          >
            {quest.title}
          </h3>

          {quest.notes && (
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{quest.notes}</p>
          )}

          {/* Reward Badges */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>+{quest.xpReward} XP</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-amber-300 font-mono">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{quest.goldReward} G</span>
            </div>

            {quest.dueDate && (
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
                <Calendar className="w-3 h-3" />
                <span>{quest.dueDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Actions: Edit & Delete */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {quest.completed ? (
            <button
              type="button"
              onClick={() => onUncomplete(quest.id)}
              title="Revert completion"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-white/5 transition-colors"
              aria-label="Revert quest completion"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEdit(quest)}
              title="Edit quest"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Edit quest"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(quest.id)}
            title="Delete quest"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
            aria-label="Delete quest"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
