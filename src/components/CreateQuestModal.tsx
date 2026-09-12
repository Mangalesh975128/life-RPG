import React, { useState, useEffect } from 'react';
import { X, Sparkles, Coins, AlertCircle, Skull, Flame, Clock, Shield, Target } from 'lucide-react';
import type { Quest, AttributeKey, QuestDifficulty, QuestType, QuestModifier } from '../types.ts';
import { ATTRIBUTES } from '../utils/attributes.ts';

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    notes?: string;
    difficulty: QuestDifficulty;
    attribute: AttributeKey;
    type: QuestType;
    dueDate?: string;
    modifier?: QuestModifier;
  }) => Promise<void>;
  editingQuest?: Quest | null;
}

export function CreateQuestModal({
  isOpen,
  onClose,
  onSubmit,
  editingQuest
}: CreateQuestModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium');
  const [attribute, setAttribute] = useState<AttributeKey>('str');
  const [type, setType] = useState<QuestType>('daily');
  const [dueDate, setDueDate] = useState('');
  const [modifier, setModifier] = useState<QuestModifier>('none');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingQuest) {
      setTitle(editingQuest.title);
      setNotes(editingQuest.notes || '');
      setDifficulty(editingQuest.difficulty);
      setAttribute(editingQuest.attribute);
      setType(editingQuest.type);
      setDueDate(editingQuest.dueDate || '');
      setModifier(editingQuest.modifier || 'none');
    } else {
      setTitle('');
      setNotes('');
      setDifficulty('medium');
      setAttribute('str');
      setType('daily');
      setDueDate(new Date().toISOString().slice(0, 10));
      setModifier('none');
    }
    setError('');
  }, [editingQuest, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rewardsByDifficulty: Record<QuestDifficulty, { xp: number; gold: number }> = {
    easy: { xp: 35, gold: 12 },
    medium: { xp: 70, gold: 30 },
    hard: { xp: 140, gold: 65 },
    epic: { xp: 280, gold: 140 }
  };

  let currentReward = { ...rewardsByDifficulty[difficulty] };
  if (modifier === 'doom_clock') {
    currentReward.xp = Math.round(currentReward.xp * 1.5);
    currentReward.gold = Math.round(currentReward.gold * 1.5);
  } else if (modifier === 'iron_man') {
    currentReward.xp = Math.round(currentReward.xp * 2.0);
    currentReward.gold = Math.round(currentReward.gold * 2.0);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an epic title for your quest!');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        title: title.trim(),
        notes: notes.trim() || undefined,
        difficulty,
        attribute,
        type,
        dueDate: dueDate || undefined,
        modifier
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#121520] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col gap-5">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold font-cinzel text-white tracking-wide">
              {editingQuest ? 'Revise Quest Contract' : 'Draft New Quest'}
            </h2>
            <p className="text-xs text-neutral-400">
              Forge a new challenge to earn XP, develop attributes, and fill your treasury.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Quest Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Lift weights at gym, Write 50 lines of clean code, Drink water..."
              className="bg-[#0b0d14] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>

          {/* Notes / Details */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Brief Description / Sub-goals
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes or checklist milestones..."
              className="bg-[#0b0d14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Attribute Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Governing Attribute (Character Stat Boost)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(ATTRIBUTES) as AttributeKey[]).map(key => {
                const attr = ATTRIBUTES[key];
                const isSelected = attribute === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAttribute(key)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${attr.bgBadge} ${attr.borderBadge} ${attr.textBadge} ring-1 ring-white/20`
                        : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: attr.color }}
                    />
                    <div>
                      <span className="text-xs font-bold block">{attr.name}</span>
                      <span className="text-[10px] opacity-75 block truncate">{attr.fullName}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Quest Category
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as QuestType)}
                className="bg-[#0b0d14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="daily">Daily Quest (Resets every day)</option>
                <option value="habit">Habit / Repeatable Action</option>
                <option value="bounty">Epic Bounty (Milestone project)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-[#0b0d14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Difficulty Tier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Difficulty & Effort Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'epic'] as QuestDifficulty[]).map(tier => {
                const isSelected = difficulty === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setDifficulty(tier)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-md'
                        : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strong Problem / Perilous Modifiers */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span>Strong Problem Modifier (Optional Affliction)</span>
              </label>
              <span className="text-[10px] text-neutral-400">High Stakes &bull; Richer Spoils</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModifier('none')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  modifier === 'none'
                    ? 'bg-white/10 border-white/30 text-white ring-1 ring-white/20'
                    : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Standard</span>
                <span className="text-[10px] opacity-70 block">Normal contract</span>
              </button>

              <button
                type="button"
                onClick={() => setModifier('doom_clock')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  modifier === 'doom_clock'
                    ? 'bg-red-950/50 border-red-500 text-red-300 ring-1 ring-red-500/50 shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span className="text-xs font-bold">Doom Clock</span>
                </div>
                <span className="text-[10px] text-red-300/80 block">+50% Gold & XP</span>
              </button>

              <button
                type="button"
                onClick={() => setModifier('iron_man')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  modifier === 'iron_man'
                    ? 'bg-purple-950/50 border-purple-500 text-purple-300 ring-1 ring-purple-500/50 shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Skull className="w-3 h-3 text-purple-400" />
                  <span className="text-xs font-bold">Iron Man</span>
                </div>
                <span className="text-[10px] text-purple-300/80 block">2x Double Bounty!</span>
              </button>

              <button
                type="button"
                onClick={() => setModifier('boss_bane')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  modifier === 'boss_bane'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 ring-1 ring-amber-500/50 shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-bold">Boss Bane</span>
                </div>
                <span className="text-[10px] text-amber-300/80 block">+220 True Boss DMG</span>
              </button>

              <button
                type="button"
                onClick={() => setModifier('titan_trial')}
                className={`p-2 rounded-xl border text-left transition-all col-span-2 sm:col-span-2 ${
                  modifier === 'titan_trial'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-bold">Spartan Titan Trial</span>
                </div>
                <span className="text-[10px] text-emerald-300/80 block">+2 Permanent Attribute Stat Points on completion!</span>
              </button>
            </div>
          </div>

          {/* Reward Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-semibold text-neutral-300">Quest Bounty Reward:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>+{currentReward.xp} XP</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-300 font-mono">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>+{currentReward.gold} G</span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-cinzel font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Inscribing...' : editingQuest ? 'Save Changes' : 'Publish Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
