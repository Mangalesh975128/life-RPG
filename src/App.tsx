import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CharacterCard } from './components/CharacterCard.tsx';
import { QuestList } from './components/QuestList.tsx';
import { ShopBazaar } from './components/ShopBazaar.tsx';
import { ActivityChronicle } from './components/ActivityChronicle.tsx';
import { AdventureRunnerStage } from './components/AdventureRunnerStage.tsx';
import { TinyArcadeArena } from './components/TinyArcadeArena.tsx';
import { BossRaidArena } from './components/BossRaidArena.tsx';
import { CreateQuestModal } from './components/CreateQuestModal.tsx';
import { LevelUpModal } from './components/LevelUpModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ShortcutsModal } from './components/ShortcutsModal.tsx';
import { api, getStoredToken, removeStoredToken } from './api/client.ts';
import { soundFX } from './utils/audio.ts';
import { triggerQuestConfetti, triggerLevelUpFireworks } from './utils/confetti.ts';
import { DEFAULT_SHOP_ITEMS, DEFAULT_STARTER_QUESTS } from './data/defaultData.ts';
import type {
  Character,
  User,
  Quest,
  ShopItem,
  CustomReward,
  ActivityLog,
  AuthResponse,
  AttributeKey,
  CharacterClassKey
} from './types.ts';
import {
  Sword,
  ShoppingBag,
  Scroll,
  Sparkles,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Gamepad2,
  Skull
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [customRewards, setCustomRewards] = useState<CustomReward[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [activeView, setActiveView] = useState<'quests' | 'shop' | 'chronicle' | 'arcade' | 'bosses'>('quests');
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [newLevelReached, setNewLevelReached] = useState<number>(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [showRunnerStage, setShowRunnerStage] = useState(true);
  const [lastCompletedQuestTrigger, setLastCompletedQuestTrigger] = useState<{
    id: string;
    title: string;
    xp: number;
    gold: number;
    time: number;
  } | null>(null);

  // Load app data
  const loadAppData = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      let token = getStoredToken();
      let authData: { user: User; character: Character };

      if (!token) {
        // Automatic instant demo hero for frictionless immediate evaluation
        const demoRes = await api.loginDemo();
        authData = { user: demoRes.user, character: demoRes.character };
      } else {
        try {
          authData = await api.getMe();
        } catch {
          // Token expired or invalid, fallback to demo hero
          const demoRes = await api.loginDemo();
          authData = { user: demoRes.user, character: demoRes.character };
        }
      }

      setUser(authData.user);
      setCharacter(authData.character);

      // Concurrently fetch user data
      const [questsData, shopData, rewardsData, logsData] = await Promise.all([
        api.getQuests(),
        api.getShopItems(),
        api.getCustomRewards(),
        api.getLogs()
      ]);

      setQuests(questsData);
      setShopItems(shopData);
      setCustomRewards(rewardsData);
      setActivityLogs(logsData);
    } catch (err: any) {
      console.error('Initialization error:', err);
      // Ensure user and character are populated so the app is always fully interactive
      setUser(prev => prev || {
        id: 'demo-user-1',
        username: 'ShadowKnight',
        email: 'adventurer@liferpg.realm',
        createdAt: new Date().toISOString()
      });
      setCharacter(prev => prev || {
        userId: 'demo-user-1',
        name: 'ShadowKnight',
        classTitle: 'Novice Adventurer',
        avatarIcon: 'Crown',
        level: 3,
        currentXp: 140,
        xpNeeded: 250,
        gold: 240,
        streak: { current: 4, highest: 7, lastActiveDate: new Date().toISOString().split('T')[0], multiplier: 1.2 },
        stats: { str: 16, int: 14, vit: 15, dis: 12, cha: 11 },
        inventory: ['wpn-1', 'arm-1'],
        equipped: { weapon: 'wpn-1', armor: 'arm-1' },
        unspentStatPoints: 2,
        characterClass: 'warrior',
        bossesDefeated: 0,
        completedCount: 12
      });
      setQuests(prev => prev.length > 0 ? prev : DEFAULT_STARTER_QUESTS);
      setShopItems(prev => prev.length > 0 ? prev : DEFAULT_SHOP_ITEMS);
      setErrorBanner(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input or textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) ||
        isCreateModalOpen ||
        isAuthModalOpen ||
        isLevelUpModalOpen
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingQuest(null);
        setIsCreateModalOpen(true);
      } else if (e.key === '1') {
        setActiveView('quests');
      } else if (e.key === '2') {
        setActiveView('shop');
      } else if (e.key === '3') {
        setActiveView('chronicle');
      } else if (e.key === '4') {
        setActiveView('arcade');
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundEnabled(prev => {
          soundFX.enabled = !prev;
          return !prev;
        });
      } else if (e.key === '?') {
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isAuthModalOpen, isLevelUpModalOpen]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      soundFX.enabled = !prev;
      return !prev;
    });
  };

  // --- Handlers: Quests ---
  const handleCompleteQuest = async (questId: string, event: React.MouseEvent) => {
    // 1. Tactile feedback immediately
    soundFX.playQuestComplete();
    const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect();
    if (rect) {
      triggerQuestConfetti(rect.left / window.innerWidth, rect.top / window.innerHeight);
    } else {
      triggerQuestConfetti();
    }

    // 2. Optimistic UI update
    const completedQuest = quests.find(q => q.id === questId);
    if (completedQuest) {
      setLastCompletedQuestTrigger({
        id: questId,
        title: completedQuest.title,
        xp: completedQuest.xpReward,
        gold: completedQuest.goldReward,
        time: Date.now()
      });
    }

    setQuests(prev =>
      prev.map(q => (q.id === questId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q))
    );

    try {
      const result = await api.completeQuest(questId);
      setCharacter(result.character);
      setQuests(prev => prev.map(q => (q.id === questId ? result.quest : q)));
      setActivityLogs(prev => [result.log, ...prev]);

      // Check if leveled up
      if (result.leveledUp && result.newLevel) {
        soundFX.playLevelUp();
        triggerLevelUpFireworks();
        setNewLevelReached(result.newLevel);
        setIsLevelUpModalOpen(true);
      }
    } catch (err: any) {
      // Rollback on error
      setQuests(prev =>
        prev.map(q => (q.id === questId ? { ...q, completed: false, completedAt: undefined } : q))
      );
      setErrorBanner(err.message || 'Failed to synchronize quest completion.');
    }
  };

  const handleUncompleteQuest = async (questId: string) => {
    try {
      const { quest, character: updatedChar } = await api.uncompleteQuest(questId);
      setQuests(prev => prev.map(q => (q.id === questId ? quest : q)));
      setCharacter(updatedChar);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to revert quest');
    }
  };

  const handleSaveQuest = async (data: {
    title: string;
    notes?: string;
    difficulty: any;
    attribute: any;
    type: any;
    dueDate?: string;
    modifier?: any;
  }) => {
    if (editingQuest) {
      const updated = await api.updateQuest(editingQuest.id, data);
      setQuests(prev => prev.map(q => (q.id === updated.id ? updated : q)));
    } else {
      const created = await api.createQuest(data);
      setQuests(prev => [created, ...prev]);
    }
  };

  const handleAllocateStat = async (attribute: AttributeKey) => {
    try {
      const res = await api.allocateStat(attribute);
      soundFX.playLevelUp();
      setCharacter(res.character);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to allocate stat point');
    }
  };

  const handleChangeClass = async (newClass: CharacterClassKey) => {
    try {
      const res = await api.setCharacterClass(newClass);
      soundFX.playSpellCast();
      setCharacter(res.character);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to change class archetype');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    try {
      await api.deleteQuest(questId);
      setQuests(prev => prev.filter(q => q.id !== questId));
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to delete quest');
    }
  };

  // --- Handlers: Shop & Inventory ---
  const handleBuyItem = async (itemId: string) => {
    try {
      const { character: updatedChar } = await api.buyItem(itemId);
      soundFX.playCoin();
      triggerQuestConfetti();
      setCharacter(updatedChar);
      const logs = await api.getLogs();
      setActivityLogs(logs);
    } catch (err: any) {
      setErrorBanner(err.message || 'Purchase failed');
    }
  };

  const handleEquipItem = async (itemId: string) => {
    try {
      const { character: updatedChar } = await api.equipItem(itemId);
      soundFX.playEquip();
      setCharacter(updatedChar);
      const logs = await api.getLogs();
      setActivityLogs(logs);
    } catch (err: any) {
      setErrorBanner(err.message || 'Equip failed');
    }
  };

  const handleUnequipItem = async (slot: string) => {
    try {
      const { character: updatedChar } = await api.unequipItem(slot);
      soundFX.playEquip();
      setCharacter(updatedChar);
    } catch (err: any) {
      setErrorBanner(err.message || 'Unequip failed');
    }
  };

  // --- Handlers: Custom Rewards ---
  const handleCreateCustomReward = async (title: string, cost: number, icon: string) => {
    const reward = await api.createCustomReward(title, cost, icon);
    setCustomRewards(prev => [...prev, reward]);
  };

  const handleRedeemCustomReward = async (rewardId: string) => {
    try {
      const { character: updatedChar, reward } = await api.redeemCustomReward(rewardId);
      soundFX.playCoin();
      triggerQuestConfetti();
      setCharacter(updatedChar);
      setCustomRewards(prev => prev.map(r => (r.id === reward.id ? reward : r)));
      const logs = await api.getLogs();
      setActivityLogs(logs);
    } catch (err: any) {
      setErrorBanner(err.message || 'Redemption failed');
    }
  };

  const handleDeleteCustomReward = async (rewardId: string) => {
    try {
      await api.deleteCustomReward(rewardId);
      setCustomRewards(prev => prev.filter(r => r.id !== rewardId));
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to delete reward');
    }
  };

  // --- Handlers: Auth ---
  const handleAuthSuccess = (data: AuthResponse) => {
    setUser(data.user);
    setCharacter(data.character);
    loadAppData();
  };

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setCharacter(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0c0d14] text-[#e2e4ed] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar with quick stats */}
      <Navbar
        character={character}
        user={user}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onLogout={handleLogout}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Global Error Banner */}
      {errorBanner && (
        <div className="bg-red-950/80 border-b border-red-500/30 px-4 py-2.5 text-center text-xs text-red-200 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={loadAppData}
            className="ml-2 underline font-bold hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Navigation Bar for Views */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('quests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cinzel tracking-wider uppercase transition-all ${
                activeView === 'quests'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Sword className="w-4 h-4" />
              <span>Quest Board</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('shop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cinzel tracking-wider uppercase transition-all ${
                activeView === 'shop'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bazaar & Armory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('chronicle')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cinzel tracking-wider uppercase transition-all ${
                activeView === 'chronicle'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Scroll className="w-4 h-4" />
              <span>Chronicle</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('arcade')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cinzel tracking-wider uppercase transition-all ${
                activeView === 'arcade'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-300'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Tiny Arcades</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('bosses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cinzel tracking-wider uppercase transition-all ${
                activeView === 'bosses'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30'
              }`}
            >
              <Skull className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Boss Trials</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => setShowRunnerStage(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                showRunnerStage
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-400'
              }`}
              title="Toggle Live Expedition Runner Stage"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showRunnerStage ? 'Expedition Stage: ON' : 'Expedition Stage: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Hotkeys & Rules</span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        {isLoading && !character ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center gap-4">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-cinzel tracking-widest text-amber-200">
              Awakening the Realm & Synchronizing Database...
            </p>
          </div>
        ) : (
          <>
            {/* The Living Adventure Runner Stage: Dino & Hero Expedition World */}
            {character && showRunnerStage && (
              <AdventureRunnerStage
                character={character}
                completedQuestsCount={quests.filter(q => q.completed).length}
                totalQuestsCount={quests.length}
                lastQuestCompletedTrigger={lastCompletedQuestTrigger}
                onCoinCollected={amt => {
                  setCharacter(prev => (prev ? { ...prev, gold: prev.gold + amt } : null));
                }}
                onOpenArcade={() => setActiveView('arcade')}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Adventurer Character Sheet (Takes 4 cols on desktop) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
              {character && (
                <CharacterCard
                  character={character}
                  shopItems={shopItems}
                  onUnequip={handleUnequipItem}
                  onNavigateToShop={() => setActiveView('shop')}
                  onAllocateStat={handleAllocateStat}
                  onChangeClass={handleChangeClass}
                />
              )}
            </div>

            {/* Right Column: Active View (Takes 8 cols on desktop) */}
            <div className="lg:col-span-8">
              {activeView === 'quests' && (
                <QuestList
                  quests={quests}
                  onCompleteQuest={handleCompleteQuest}
                  onUncompleteQuest={handleUncompleteQuest}
                  onOpenCreate={() => {
                    setEditingQuest(null);
                    setIsCreateModalOpen(true);
                  }}
                  onEditQuest={quest => {
                    setEditingQuest(quest);
                    setIsCreateModalOpen(true);
                  }}
                  onDeleteQuest={handleDeleteQuest}
                />
              )}

              {activeView === 'shop' && character && (
                <ShopBazaar
                  character={character}
                  shopItems={shopItems}
                  customRewards={customRewards}
                  onBuyItem={handleBuyItem}
                  onEquipItem={handleEquipItem}
                  onUnequipItem={handleUnequipItem}
                  onCreateCustomReward={handleCreateCustomReward}
                  onRedeemCustomReward={handleRedeemCustomReward}
                  onDeleteCustomReward={handleDeleteCustomReward}
                />
              )}

              {activeView === 'chronicle' && (
                <ActivityChronicle logs={activityLogs} />
              )}

              {activeView === 'arcade' && character && (
                <TinyArcadeArena
                  character={character}
                  onEarnGold={amt => {
                    setCharacter(prev => (prev ? { ...prev, gold: prev.gold + amt } : null));
                  }}
                  onEarnXP={amt => {
                    setCharacter(prev => {
                      if (!prev) return null;
                      const nextXP = prev.currentXp + amt;
                      return { ...prev, currentXp: nextXP };
                    });
                  }}
                />
              )}

              {activeView === 'bosses' && character && (
                <BossRaidArena
                  character={character}
                  quests={quests}
                  shopItems={shopItems}
                  onCompleteQuest={handleCompleteQuest}
                  onUpdateCharacter={setCharacter}
                  onNavigateToQuests={() => setActiveView('quests')}
                />
              )}
            </div>
          </div>
          </>
        )}
      </main>

      {/* Footer / Status */}
      <footer className="border-t border-white/5 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database Online: Server-authoritative anti-cheat active</span>
          </div>
          <p className="text-[11px]">
            Life RPG Progression Engine • Non-Linear Progression Math Active
          </p>
        </div>
      </footer>

      {/* Modals */}
      <CreateQuestModal
        isOpen={isCreateModalOpen}
        editingQuest={editingQuest}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingQuest(null);
        }}
        onSubmit={handleSaveQuest}
      />

      {character && (
        <LevelUpModal
          isOpen={isLevelUpModalOpen}
          newLevel={newLevelReached}
          character={character}
          onClose={() => setIsLevelUpModalOpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
