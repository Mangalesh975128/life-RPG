import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  Zap,
  Sparkles,
  Sword,
  Shield,
  Heart,
  Skull,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Info,
  RefreshCw,
  Target
} from 'lucide-react';
import type { Character, ShopItem, Quest, BossEncounter, AttributeKey } from '../types.ts';
import { INITIAL_BOSSES, CLASS_ARCHETYPES } from '../data/bosses.ts';
import { calculateDerivedCombatStats, computeQuestBossDamage } from '../utils/combat.ts';
import { ATTRIBUTES } from '../utils/attributes.ts';
import { soundFX } from '../utils/audio.ts';
import { triggerQuestConfetti, triggerLevelUpFireworks } from '../utils/confetti.ts';

interface BossRaidArenaProps {
  character: Character;
  shopItems: ShopItem[];
  quests: Quest[];
  onCompleteQuest: (questId: string, event: React.MouseEvent) => void;
  onUpdateCharacter: (updater: (prev: Character | null) => Character | null) => void;
  onLogActivity?: (desc: string, xp?: number, gold?: number) => void;
  onNavigateToQuests?: () => void;
}

export function BossRaidArena({
  character,
  shopItems,
  quests,
  onCompleteQuest,
  onUpdateCharacter,
  onNavigateToQuests
}: BossRaidArenaProps) {
  // Boss state (stored in localStorage for persistence across reloads)
  const [bosses, setBosses] = useState<BossEncounter[]>(() => {
    try {
      const saved = localStorage.getItem('life_rpg_bosses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_BOSSES;
  });

  const [activeBossIndex, setActiveBossIndex] = useState(0);
  const currentBoss = bosses[activeBossIndex] || bosses[0];

  // Combat status
  const [playerHp, setPlayerHp] = useState<number>(() => {
    const max = 120 + (character.stats.vit * 8);
    return character.hp ?? max;
  });
  const [playerMp, setPlayerMp] = useState<number>(() => {
    const max = 60 + (character.stats.int * 6);
    return character.mp ?? max;
  });

  // Combat visuals
  const [floatingDamage, setFloatingDamage] = useState<{ id: string; text: string; isCrit: boolean; isWeakness: boolean }[]>([]);
  const [bossShake, setBossShake] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([
    `⚔️ You entered the domain of ${currentBoss.name}!`,
    `💡 Tip: Completing real quests deals massive True Damage and exploits boss weaknesses!`
  ]);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [victoryBoss, setVictoryBoss] = useState<BossEncounter | null>(null);

  // Derived stats
  const combatStats = calculateDerivedCombatStats(character, shopItems);
  const activeClass = CLASS_ARCHETYPES[character.characterClass || 'warrior'] || CLASS_ARCHETYPES.warrior;

  // Sync player max HP/MP limits
  useEffect(() => {
    setPlayerHp(prev => Math.min(combatStats.maxHp, Math.max(1, prev)));
    setPlayerMp(prev => Math.min(combatStats.maxMp, Math.max(0, prev)));
  }, [combatStats.maxHp, combatStats.maxMp]);

  // Persist bosses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('life_rpg_bosses', JSON.stringify(bosses));
    } catch {
      // Ignore
    }
  }, [bosses]);

  const addFloatingText = (text: string, isCrit: boolean = false, isWeakness: boolean = false) => {
    const id = `dmg-${Date.now()}-${Math.random()}`;
    setFloatingDamage(prev => [...prev, { id, text, isCrit, isWeakness }]);
    setTimeout(() => {
      setFloatingDamage(prev => prev.filter(item => item.id !== id));
    }, 1200);
  };

  const shakeBossVisual = () => {
    setBossShake(true);
    setTimeout(() => setBossShake(false), 400);
  };

  // 1. Attack action
  const handleHeroicStrike = () => {
    soundFX.playSlash();
    shakeBossVisual();

    // Roll damage
    const roll = Math.random() * 100;
    const isCrit = roll <= combatStats.critChance;
    let dmg = Math.round(combatStats.attackPower * (0.85 + Math.random() * 0.3));
    if (isCrit) {
      dmg = Math.round(dmg * 1.8);
      soundFX.playBossHit();
    }

    addFloatingText(`-${dmg} DMG${isCrit ? ' 💥 CRIT!' : ''}`, isCrit);
    dealDamageToBoss(dmg);

    setCombatLog(prev => [
      `⚔️ You executed a Heroic Strike for ${dmg} damage!${isCrit ? ' (Critical Hit!)' : ''}`,
      ...prev.slice(0, 5)
    ]);

    // Boss retaliates
    handleBossRetaliate();
  };

  // 2. Class Skill action
  const handleCastClassSkill = () => {
    if (playerMp < activeClass.skillManaCost) {
      soundFX.playBlock();
      setCombatLog(prev => [`⚠️ Not enough Mana! Need ${activeClass.skillManaCost} MP.`, ...prev.slice(0, 5)]);
      return;
    }

    soundFX.playSpellCast();
    shakeBossVisual();

    // Spend MP
    setPlayerMp(prev => Math.max(0, prev - activeClass.skillManaCost));

    // Base damage multiplier from skill
    let multiplier = 2.5;
    if (activeClass.key === 'mage') multiplier = 3.2;
    if (activeClass.key === 'rogue') multiplier = 2.8;
    if (activeClass.key === 'paladin') multiplier = 2.0;

    let skillDmg = Math.round(combatStats.attackPower * multiplier);
    const isWeakness = activeClass.primaryStat === currentBoss.weakness;
    if (isWeakness) {
      skillDmg = Math.round(skillDmg * 1.5);
    }

    addFloatingText(`⚡ -${skillDmg} ${activeClass.skillName.toUpperCase()}!`, true, isWeakness);
    dealDamageToBoss(skillDmg);

    if (activeClass.key === 'paladin') {
      setPlayerHp(prev => Math.min(combatStats.maxHp, prev + 40));
    }

    setCombatLog(prev => [
      `✨ You cast ${activeClass.skillName} for ${skillDmg} damage!${isWeakness ? ' (Weakness Exploit!)' : ''}`,
      ...prev.slice(0, 5)
    ]);

    handleBossRetaliate();
  };

  // 3. Alchemical Potion
  const handleDrinkPotion = () => {
    if (character.gold < 15) {
      setCombatLog(prev => [`🪙 Need 15 Gold to brew an Alchemical Restorative Potion!`, ...prev.slice(0, 5)]);
      return;
    }

    soundFX.playCoin();
    onUpdateCharacter(prev => (prev ? { ...prev, gold: Math.max(0, prev.gold - 15) } : null));

    setPlayerHp(prev => Math.min(combatStats.maxHp, prev + 60));
    setPlayerMp(prev => Math.min(combatStats.maxMp, prev + 40));
    addFloatingText(`+60 HP / +40 MP`, false);

    setCombatLog(prev => [
      `🧪 Drank Alchemical Potion (-15 Gold). Restored 60 HP & 40 MP!`,
      ...prev.slice(0, 5)
    ]);
  };

  // Boss retaliates logic
  const handleBossRetaliate = () => {
    setTimeout(() => {
      if (currentBoss.currentHp <= 0) return;

      const rawDmg = currentBoss.attackPower;
      const actualDmg = Math.max(4, Math.round(rawDmg * (1 - combatStats.defense / 150)));

      soundFX.playExplosion();
      setPlayerHp(prev => {
        const next = prev - actualDmg;
        if (next <= 0) {
          setCombatLog(log => [
            `💀 You were overwhelmed by ${currentBoss.name}! Take a breather and regain your strength.`,
            ...log.slice(0, 5)
          ]);
          return 30; // reset to low health
        }
        return next;
      });

      setCombatLog(log => [
        `🩸 ${currentBoss.name} counter-attacked for ${actualDmg} damage! (Reduced by ${combatStats.defense} DEF)`,
        ...log.slice(0, 5)
      ]);
    }, 450);
  };

  // Deal damage to boss and check for victory
  const dealDamageToBoss = (amount: number) => {
    setBosses(prevBosses =>
      prevBosses.map((boss, idx) => {
        if (idx !== activeBossIndex) return boss;
        const newHp = Math.max(0, boss.currentHp - amount);

        if (newHp === 0 && boss.currentHp > 0) {
          // Boss slain!
          setTimeout(() => handleBossVictory(boss), 200);
        }
        return { ...boss, currentHp: newHp };
      })
    );
  };

  const handleBossVictory = (boss: BossEncounter) => {
    soundFX.playLevelUp();
    soundFX.playFanfare();
    triggerLevelUpFireworks();
    triggerQuestConfetti();

    setVictoryBoss(boss);
    setIsVictoryModalOpen(true);

    // Award Boss Bounties
    onUpdateCharacter(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gold: prev.gold + boss.rewardGold,
        currentXp: prev.currentXp + boss.rewardXp,
        bossesDefeated: (prev.bossesDefeated || 0) + 1,
        unspentStatPoints: (prev.unspentStatPoints || 0) + 3 // +3 attribute points for conquering a boss!
      };
    });

    setCombatLog(prev => [
      `🏆 VICTORY! ${boss.name} has been vanquished! Claimed +${boss.rewardGold} Gold, +${boss.rewardXp} XP, and +3 Attribute Points!`,
      ...prev
    ]);
  };

  // Reset/Revive Boss for infinite replayability
  const handleRespawnBoss = () => {
    soundFX.playBossRoar();
    setBosses(prev =>
      prev.map((b, idx) => (idx === activeBossIndex ? { ...b, currentHp: b.maxHp } : b))
    );
    setIsVictoryModalOpen(false);
  };

  const hpPercent = Math.max(0, Math.min(100, Math.round((currentBoss.currentHp / currentBoss.maxHp) * 100)));
  const isEnraged = hpPercent <= currentBoss.enrageThreshold && hpPercent > 0;
  const weakAttr = ATTRIBUTES[currentBoss.weakness] || ATTRIBUTES.dis;

  // Active uncompleted quests that can be completed to deal massive strike
  const activeQuests = quests.filter(q => !q.completed);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Colosseum Header */}
      <div className="bg-[#121520] border border-red-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-red-950/60 border border-red-500/40 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Skull className="w-3 h-3 text-red-400 animate-pulse" />
                Strong Problems: Boss Trials
              </span>
              <span className="text-xs text-neutral-400">
                {currentBoss.subtitle}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black font-cinzel text-white mt-1 tracking-wide">
              {currentBoss.name}
            </h2>
            <p className="text-xs text-neutral-300 max-w-2xl mt-1">
              {currentBoss.lore}
            </p>
          </div>

          {/* Boss Navigation Carousel */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={activeBossIndex === 0}
              onClick={() => setActiveBossIndex(prev => Math.max(0, prev - 1))}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 disabled:opacity-30 transition-all"
              title="Previous Problem Boss"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center px-3">
              <span className="text-xs font-bold text-white block">
                Trial {activeBossIndex + 1} of {bosses.length}
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                Lvl {currentBoss.level} Threat
              </span>
            </div>
            <button
              type="button"
              disabled={activeBossIndex === bosses.length - 1}
              onClick={() => setActiveBossIndex(prev => Math.min(bosses.length - 1, prev + 1))}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 disabled:opacity-30 transition-all"
              title="Next Problem Boss"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Arena Combat Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Boss Battlefield Display (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl min-h-[380px] flex flex-col justify-between">
            {/* Element Background Glow */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-700"
              style={{
                background: currentBoss.element === 'fire'
                  ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, transparent 70%)'
                  : currentBoss.element === 'shadow'
                  ? 'radial-gradient(circle at center, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
              }}
            />

            {/* Top Bar: Boss Weakness & Enrage Tag */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm"
                  style={{
                    backgroundColor: `${weakAttr.color}20`,
                    borderColor: `${weakAttr.color}60`,
                    color: weakAttr.color
                  }}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Vulnerable to: {weakAttr.name.toUpperCase()} (+60% DMG)</span>
                </span>
                {isEnraged && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600/30 border border-red-500 text-red-300 text-xs font-bold animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    <span>ENRAGED PHASE!</span>
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Reward on Defeat
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  +{currentBoss.rewardGold} G &bull; +{currentBoss.rewardXp} XP &bull; +3 Stat Pts
                </span>
              </div>
            </div>

            {/* Center: Boss Avatar Sprite with Floating Damage Numbers */}
            <div className="flex flex-col items-center justify-center my-6 relative z-10">
              {/* Floating Combat Text */}
              <div className="absolute top-0 pointer-events-none flex flex-col items-center">
                {floatingDamage.map(d => (
                  <div
                    key={d.id}
                    className={`font-black font-cinzel text-lg md:text-2xl animate-bounce drop-shadow-md ${
                      d.isCrit ? 'text-yellow-300 scale-125' : d.isWeakness ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    {d.text}
                  </div>
                ))}
              </div>

              {/* Boss Visual Entity */}
              <div
                className={`w-36 h-36 md:w-44 md:h-44 rounded-3xl flex items-center justify-center relative transition-transform select-none ${
                  bossShake ? 'scale-90 animate-shake' : 'hover:scale-105'
                }`}
                style={{
                  background: 'radial-gradient(circle, rgba(30, 35, 50, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
                  boxShadow: isEnraged
                    ? '0 0 35px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.3)'
                    : '0 0 30px rgba(245, 158, 11, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.05)',
                  border: isEnraged ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <span className="text-6xl md:text-7xl filter drop-shadow-2xl">{currentBoss.avatar}</span>

                {/* Status crown or dead indicator */}
                {currentBoss.currentHp === 0 ? (
                  <div className="absolute inset-0 rounded-3xl bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2">
                    <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                    <span className="text-sm font-bold font-cinzel text-white mt-1">SLAIN!</span>
                    <button
                      type="button"
                      onClick={handleRespawnBoss}
                      className="mt-2 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Respawn
                    </button>
                  </div>
                ) : null}
              </div>

              <h3 className="text-base md:text-lg font-bold font-cinzel text-white mt-3">
                {currentBoss.title}
              </h3>
            </div>

            {/* Boss HP Bar */}
            <div className="flex flex-col gap-1.5 relative z-10">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-red-400 flex items-center gap-1">
                  <Skull className="w-3.5 h-3.5" />
                  <span>BOSS HEALTH</span>
                </span>
                <span className="text-white">
                  {currentBoss.currentHp} / {currentBoss.maxHp} HP ({hpPercent}%)
                </span>
              </div>
              <div className="w-full h-4 bg-black/80 rounded-full p-0.5 border border-red-500/30 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 shadow-md ${
                    isEnraged
                      ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 animate-pulse'
                      : 'bg-gradient-to-r from-red-700 via-red-500 to-amber-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Player Active Combat Actions Bar */}
          <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
            {/* Player HP & MP Status */}
            <div className="grid grid-cols-2 gap-4">
              {/* Health */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> Character HP
                  </span>
                  <span className="font-mono text-neutral-300 text-[11px]">
                    {playerHp} / {combatStats.maxHp}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((playerHp / combatStats.maxHp) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Mana */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-blue-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Mana Energy
                  </span>
                  <span className="font-mono text-neutral-300 text-[11px]">
                    {playerMp} / {combatStats.maxMp}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((playerMp / combatStats.maxMp) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Combat Commands */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Heroic Strike */}
              <button
                type="button"
                disabled={currentBoss.currentHp <= 0}
                onClick={handleHeroicStrike}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Sword className="w-4 h-4" />
                <span>Heroic Strike</span>
              </button>

              {/* 2. Special Class Spell */}
              <button
                type="button"
                disabled={currentBoss.currentHp <= 0 || playerMp < activeClass.skillManaCost}
                onClick={handleCastClassSkill}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                title={`${activeClass.skillDescription} (Costs ${activeClass.skillManaCost} MP)`}
              >
                <Zap className="w-4 h-4 text-cyan-300" />
                <span>{activeClass.skillName} ({activeClass.skillManaCost} MP)</span>
              </button>

              {/* 3. Alchemical Potion */}
              <button
                type="button"
                onClick={handleDrinkPotion}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                title="Restores 60 HP and 40 MP for 15 Gold"
              >
                <span>🧪 Restore Potion (15 G)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-World Quest Cannon & Combat Log (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quest Strike Launcher */}
          <div className="bg-[#121520] border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sword className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold font-cinzel text-white uppercase tracking-wider">
                  Real Quest Heavy Artillery
                </h4>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                +{combatStats.attackPower} ATK Base
              </span>
            </div>

            <p className="text-[11px] text-neutral-300">
              Completing real-world quests unleashes colossal blows against <strong className="text-white">{currentBoss.name}</strong>!
            </p>

            {/* Active Quests that can be struck */}
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {activeQuests.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-500 border border-dashed border-white/10 rounded-xl p-4">
                  No active quests available. Draft a quest on the Quest Board to unleash damage!
                </div>
              ) : (
                activeQuests.slice(0, 5).map(q => {
                  const strikePreview = computeQuestBossDamage(q, character, currentBoss, combatStats);
                  const isWeakness = q.attribute === currentBoss.weakness;

                  return (
                    <div
                      key={q.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isWeakness
                          ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
                          : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold uppercase font-mono px-1 rounded bg-white/10 text-neutral-300">
                            {q.attribute.toUpperCase()}
                          </span>
                          {isWeakness && (
                            <span className="text-[9px] font-bold text-amber-400 uppercase font-mono">
                              WEAKNESS!
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white truncate mt-0.5" title={q.title}>
                          {q.title}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          onCompleteQuest(q.id, e);
                          // Inflict massive strike on current boss
                          dealDamageToBoss(strikePreview.damage);
                          soundFX.playBossHit();
                          shakeBossVisual();
                          addFloatingText(
                            `-${strikePreview.damage} QUEST CANNON!`,
                            strikePreview.isCrit,
                            strikePreview.isWeaknessExploit
                          );
                          setCombatLog(log => [
                            `💥 QUEST CANNON: Completed "${q.title}" dealing ${strikePreview.damage} damage to ${currentBoss.name}!`,
                            ...log.slice(0, 5)
                          ]);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] shrink-0 font-sans shadow-sm transition-all"
                        title="Complete task and fire cannon!"
                      >
                        Fire &bull; {strikePreview.damage} DMG
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Combat Log Chronicle */}
          <div className="bg-[#121520] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-2">
            <h4 className="text-[11px] font-bold font-cinzel text-neutral-400 uppercase tracking-wider">
              Battle Chronicle
            </h4>
            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto text-[11px] font-mono scrollbar-thin">
              {combatLog.map((log, index) => (
                <div key={index} className="text-neutral-300 leading-relaxed border-l-2 border-white/10 pl-2">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {isVictoryModalOpen && victoryBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#121520] border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-2xl overflow-hidden flex flex-col items-center gap-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-4xl shadow-lg animate-bounce">
              🏆
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-cinzel">
                Strong Problem Conquered!
              </span>
              <h2 className="text-xl font-black font-cinzel text-white mt-1">
                {victoryBoss.name} Vanquished
              </h2>
              <p className="text-xs text-neutral-300 mt-2">
                You have overthrown this towering monument of procrastination and disorder through real-world courage and consistency!
              </p>
            </div>

            {/* Reward Badges */}
            <div className="grid grid-cols-3 gap-2 w-full p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-neutral-400 uppercase font-mono">Bounty Gold</span>
                <span className="text-sm font-bold text-amber-400 font-mono">+{victoryBoss.rewardGold} G</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-neutral-400 uppercase font-mono">Experience</span>
                <span className="text-sm font-bold text-amber-300 font-mono">+{victoryBoss.rewardXp} XP</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-neutral-400 uppercase font-mono">Stat Points</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">+3 Free Pts</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsVictoryModalOpen(false);
                if (activeBossIndex < bosses.length - 1) {
                  setActiveBossIndex(prev => prev + 1);
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-cinzel font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Advance to Next Trial &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
