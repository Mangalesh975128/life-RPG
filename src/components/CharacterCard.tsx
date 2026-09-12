import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Sword,
  Heart,
  Brain,
  Flame,
  Users,
  X,
  Info,
  Zap,
  Plus,
  ChevronDown,
  Crosshair,
  Award
} from 'lucide-react';
import type { Character, ShopItem, AttributeKey, CharacterClassKey } from '../types.ts';
import { ATTRIBUTES } from '../utils/attributes.ts';
import { calculateDerivedCombatStats } from '../utils/combat.ts';
import { CLASS_ARCHETYPES } from '../data/bosses.ts';

interface CharacterCardProps {
  character: Character;
  shopItems: ShopItem[];
  onUnequip: (slot: string) => void;
  onNavigateToShop: () => void;
  onAllocateStat?: (attribute: AttributeKey) => void;
  onChangeClass?: (newClass: CharacterClassKey) => void;
}

export function CharacterCard({
  character,
  shopItems,
  onUnequip,
  onNavigateToShop,
  onAllocateStat,
  onChangeClass
}: CharacterCardProps) {
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const xpPercent = Math.min(
    100,
    Math.round((character.currentXp / Math.max(1, character.xpNeeded)) * 100)
  );

  const combatStats = calculateDerivedCombatStats(character, shopItems);
  const activeClass = CLASS_ARCHETYPES[character.characterClass || 'warrior'] || CLASS_ARCHETYPES.warrior;
  const unspentPoints = character.unspentStatPoints || 0;

  // Map equipped items
  const equippedWeapon = shopItems.find(i => i.id === character.equipped.weapon);
  const equippedArmor = shopItems.find(i => i.id === character.equipped.armor);
  const equippedHelmet = shopItems.find(i => i.id === character.equipped.helmet);
  const equippedAccessory = shopItems.find(i => i.id === character.equipped.accessory);

  const statIcons: Record<string, any> = {
    str: Sword,
    int: Brain,
    vit: Heart,
    dis: Flame,
    cha: Users
  };

  return (
    <div className="bg-[#12151f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-5 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header: Avatar + Title + Level */}
      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {/* Dynamic Animated Avatar with Pixel Crest & Aura */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600/40 via-neutral-900 to-amber-400/30 border-2 border-amber-500/60 flex items-center justify-center shadow-lg shadow-amber-500/20 relative overflow-hidden">
              {/* Subtle animated run/breathe sprite */}
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl filter drop-shadow animate-bounce">🦕</span>
                <span className="text-xl filter drop-shadow -ml-2 -mt-2">⚔️</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black font-mono shadow-md border border-amber-300">
              L{character.level}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-cinzel text-white tracking-wide">{character.name}</h2>
            </div>
            <p className="text-xs text-amber-300 font-semibold">{character.classTitle}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Completed <span className="text-neutral-200 font-bold">{character.completedCount}</span> Quests
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Streak</span>
          <div className="flex items-center justify-end gap-1 text-orange-400 font-bold text-sm">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>{character.streak.current} Days</span>
          </div>
          <span className="text-[10px] text-neutral-500 block">Best: {character.streak.highest}d</span>
        </div>
      </div>

      {/* Class Archetype Spec Selector */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-neutral-400 uppercase tracking-wider font-bold text-[10px] flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Class Archetype Specialization
          </span>
          <button
            type="button"
            onClick={() => setIsClassDropdownOpen(prev => !prev)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Change</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activeClass.icon}</span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{activeClass.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {activeClass.perkTitle}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 line-clamp-1">{activeClass.perkDescription}</p>
            </div>
          </div>
        </div>

        {/* Dropdown Options */}
        {isClassDropdownOpen && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-[#171b28] border border-amber-500/40 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 backdrop-blur-md">
            {Object.values(CLASS_ARCHETYPES).map(cls => (
              <button
                key={cls.key}
                type="button"
                onClick={() => {
                  onChangeClass?.(cls.key);
                  setIsClassDropdownOpen(false);
                }}
                className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition-all ${
                  cls.key === character.characterClass
                    ? 'bg-amber-500/20 border border-amber-500/50'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-xl">{cls.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{cls.name}</span>
                    <span className="text-[9px] text-amber-300 uppercase">{cls.primaryStat} spec</span>
                  </div>
                  <p className="text-[10px] text-neutral-300 mt-0.5">{cls.perkDescription}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Combat Power & RPG Parameters Panel */}
      <div className="bg-gradient-to-br from-neutral-900 via-[#161a27] to-[#12151f] rounded-xl p-3 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Combat RPG Prowess
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            HP {combatStats.maxHp} / {combatStats.maxHp}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-black/30 rounded-lg p-1.5 border border-red-500/20">
            <span className="text-[9px] uppercase font-bold text-red-400 block">ATK</span>
            <span className="text-xs font-black font-mono text-white">{combatStats.attackPower}</span>
          </div>
          <div className="bg-black/30 rounded-lg p-1.5 border border-blue-500/20">
            <span className="text-[9px] uppercase font-bold text-blue-400 block">DEF</span>
            <span className="text-xs font-black font-mono text-white">{combatStats.defense}</span>
          </div>
          <div className="bg-black/30 rounded-lg p-1.5 border border-indigo-500/20">
            <span className="text-[9px] uppercase font-bold text-indigo-400 block">MAX MP</span>
            <span className="text-xs font-black font-mono text-white">{combatStats.maxMp}</span>
          </div>
          <div className="bg-black/30 rounded-lg p-1.5 border border-amber-500/20">
            <span className="text-[9px] uppercase font-bold text-amber-400 block">CRIT</span>
            <span className="text-xs font-black font-mono text-white">{combatStats.critChance}%</span>
          </div>
        </div>
      </div>

      {/* Level & XP Gauge */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-neutral-300 flex items-center gap-1.5 font-cinzel tracking-wider">
            Level {character.level} Progression
          </span>
          <span className="text-amber-400 font-mono text-[11px]">
            {character.currentXp} / {character.xpNeeded} XP ({xpPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {/* Unspent Stat Points Banner */}
      {unspentPoints > 0 && (
        <div className="bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border border-amber-500/50 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-lg shadow-amber-500/10 animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-amber-200">
                {unspentPoints} Unspent Stat Point{unspentPoints > 1 ? 's' : ''}!
              </p>
              <p className="text-[10px] text-neutral-300">Click "+" below to empower attributes</p>
            </div>
          </div>
        </div>
      )}

      {/* Attributes Breakdown */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-cinzel">
            Character Attributes
          </h3>
          <span className="text-[10px] text-neutral-500">Boosted by Quests & Points</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {(Object.keys(ATTRIBUTES) as (keyof typeof ATTRIBUTES)[]).map(key => {
            const attr = ATTRIBUTES[key];
            const val = character.stats[key] || 10;
            const Icon = statIcons[key] || Sparkles;

            return (
              <div
                key={key}
                className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                title={`${attr.fullName}: ${attr.description}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: `${attr.color}15`,
                      borderColor: `${attr.color}40`,
                      color: attr.color
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-200">{attr.fullName}</span>
                    <span className="text-[10px] text-neutral-400 block -mt-0.5">{attr.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, val * 4)}%`,
                        backgroundColor: attr.color
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold font-mono text-neutral-100 min-w-[24px] text-right">
                    {val}
                  </span>

                  {unspentPoints > 0 && onAllocateStat && (
                    <button
                      type="button"
                      onClick={() => onAllocateStat(key)}
                      title={`Add 1 point to ${attr.name}`}
                      className="w-6 h-6 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30 transition-transform active:scale-95 ml-1"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-cinzel">
            Equipped Armory
          </h3>
          <button
            type="button"
            onClick={onNavigateToShop}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors"
          >
            Visit Shop &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Weapon Slot */}
          <EquippedSlotCard
            slotName="Weapon"
            item={equippedWeapon}
            onUnequip={() => onUnequip('weapon')}
            onEmptyClick={onNavigateToShop}
          />
          {/* Armor Slot */}
          <EquippedSlotCard
            slotName="Armor"
            item={equippedArmor}
            onUnequip={() => onUnequip('armor')}
            onEmptyClick={onNavigateToShop}
          />
          {/* Helmet Slot */}
          <EquippedSlotCard
            slotName="Helmet"
            item={equippedHelmet}
            onUnequip={() => onUnequip('helmet')}
            onEmptyClick={onNavigateToShop}
          />
          {/* Accessory Slot */}
          <EquippedSlotCard
            slotName="Accessory"
            item={equippedAccessory}
            onUnequip={() => onUnequip('accessory')}
            onEmptyClick={onNavigateToShop}
          />
        </div>
      </div>
    </div>
  );
}

function EquippedSlotCard({
  slotName,
  item,
  onUnequip,
  onEmptyClick
}: {
  slotName: string;
  item?: ShopItem;
  onUnequip: () => void;
  onEmptyClick: () => void;
}) {
  if (!item) {
    return (
      <button
        type="button"
        onClick={onEmptyClick}
        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-white/10 hover:border-amber-500/40 bg-white/[0.02] hover:bg-white/[0.04] text-center transition-all group"
      >
        <span className="text-[10px] uppercase font-bold text-neutral-500 group-hover:text-amber-400/80">
          {slotName}
        </span>
        <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200 mt-0.5">
          + Equip Item
        </span>
      </button>
    );
  }

  const rarityColors: Record<string, string> = {
    common: 'border-neutral-500/40 text-neutral-300',
    rare: 'border-blue-500/50 text-blue-300',
    epic: 'border-purple-500/50 text-purple-300',
    legendary: 'border-amber-500/60 text-amber-300'
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-2.5 rounded-xl bg-white/[0.04] border ${
        rarityColors[item.rarity] || 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block">
            {slotName}
          </span>
          <p className="text-xs font-bold text-white truncate max-w-[100px]" title={item.name}>
            {item.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onUnequip}
          title={`Unequip ${item.name}`}
          className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          aria-label={`Unequip ${item.name}`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className="text-amber-400 font-semibold font-mono">
          +{item.bonusValue} {item.bonusStat.toUpperCase()}
        </span>
        {item.bonusPercentXp && (
          <span className="text-emerald-400 font-mono">+{item.bonusPercentXp}% XP</span>
        )}
      </div>
    </div>
  );
}
