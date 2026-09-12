import React, { useState } from 'react';
import {
  Coins,
  Shield,
  Sword,
  Sparkles,
  Gift,
  Check,
  Plus,
  Trash2,
  Lock,
  Zap,
  Flame,
  Crown
} from 'lucide-react';
import type { Character, ShopItem, CustomReward } from '../types.ts';

interface ShopBazaarProps {
  character: Character;
  shopItems: ShopItem[];
  customRewards: CustomReward[];
  onBuyItem: (itemId: string) => Promise<void>;
  onEquipItem: (itemId: string) => Promise<void>;
  onUnequipItem: (slot: string) => Promise<void>;
  onCreateCustomReward: (title: string, cost: number, icon: string) => Promise<void>;
  onRedeemCustomReward: (rewardId: string) => Promise<void>;
  onDeleteCustomReward: (rewardId: string) => Promise<void>;
}

export function ShopBazaar({
  character,
  shopItems,
  customRewards,
  onBuyItem,
  onEquipItem,
  onUnequipItem,
  onCreateCustomReward,
  onRedeemCustomReward,
  onDeleteCustomReward
}: ShopBazaarProps) {
  const [activeTab, setActiveTab] = useState<'armory' | 'rewards' | 'inventory'>('armory');
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(100);
  const [rewardIcon, setRewardIcon] = useState('Gift');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const ownedItems = shopItems.filter(item => character.inventory.includes(item.id));

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim() || rewardCost <= 0) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await onCreateCustomReward(rewardTitle.trim(), rewardCost, rewardIcon);
      setRewardTitle('');
      setRewardCost(100);
      setShowAddRewardModal(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create reward');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Treasury Balance & Tabs */}
      <div className="bg-[#12151f] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-cinzel text-white tracking-wide">
              The Grand Bazaar & Armory
            </h2>
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Economy
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Exchange your quest bounties for enchanted artifacts or redeem guilt-free real-world leisure.
          </p>
        </div>

        {/* Live Gold Counter */}
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 rounded-xl px-4 py-2.5 self-start md:self-auto shadow-inner">
          <Coins className="w-6 h-6 text-amber-400 animate-spin-slow" />
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">
              Available Treasury
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-amber-300">{character.gold}</span>
              <span className="text-xs font-bold text-amber-400">GOLD</span>
            </div>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('armory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-cinzel tracking-wider uppercase transition-all ${
            activeTab === 'armory'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Artifacts & Gear ({shopItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-cinzel tracking-wider uppercase transition-all ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          Real-World Vouchers ({customRewards.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-cinzel tracking-wider uppercase transition-all ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          My Inventory ({ownedItems.length})
        </button>
      </div>

      {/* Tab 1: Armory Gear */}
      {activeTab === 'armory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map(item => {
            const isOwned = character.inventory.includes(item.id);
            const isEquipped = Object.values(character.equipped).includes(item.id);
            const canAfford = character.gold >= item.cost;

            const rarityColors: Record<string, string> = {
              common: 'border-neutral-700 bg-[#121520]',
              rare: 'border-blue-500/40 bg-gradient-to-b from-[#141b2e] to-[#10131d]',
              epic: 'border-purple-500/40 bg-gradient-to-b from-[#20152e] to-[#10131d]',
              legendary: 'border-amber-500/50 bg-gradient-to-b from-[#2a1d13] to-[#10131d]'
            };

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
                  rarityColors[item.rarity] || 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border ${
                        item.rarity === 'legendary'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : item.rarity === 'epic'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : item.rarity === 'rare'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-white/5 text-neutral-300 border-white/10'
                      }`}
                    >
                      {item.rarity} {item.slot}
                    </span>

                    <div className="flex items-center gap-1 font-mono font-bold text-amber-400 text-xs">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{item.cost} G</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold font-cinzel text-white mt-2">{item.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-bold font-mono">
                      +{item.bonusValue} {item.bonusStat.toUpperCase()}
                    </span>
                    {item.bonusPercentXp && (
                      <span className="text-emerald-400 font-bold font-mono">
                        +{item.bonusPercentXp}% XP Boost
                      </span>
                    )}
                  </div>

                  {isOwned ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                        ✓ Owned
                      </span>
                      {isEquipped ? (
                        <button
                          type="button"
                          onClick={() => onUnequipItem(item.slot)}
                          className="px-3 py-2 text-xs font-bold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                        >
                          Unequip
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onEquipItem(item.id)}
                          className="px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl transition-colors"
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyItem(item.id)}
                      className={`w-full py-2.5 rounded-xl font-cinzel font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 cursor-pointer'
                          : 'bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>Forge Item ({item.cost} G)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Requires {item.cost} G</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Custom Real-World Vouchers */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Guilt-free indulgence: Earn video game hours, gourmet treats, or leisure by finishing productive quests!
            </p>
            <button
              type="button"
              onClick={() => setShowAddRewardModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-cinzel shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Voucher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRewards.map(reward => {
              const canRedeem = character.gold >= reward.cost;

              return (
                <div
                  key={reward.id}
                  className="bg-[#12151f] border border-white/10 hover:border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-amber-400 text-sm">
                        <Coins className="w-4 h-4" />
                        <span>{reward.cost} G</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold font-sans text-white mt-3">{reward.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Redeemed {reward.timesRedeemed} times
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canRedeem}
                      onClick={() => onRedeemCustomReward(reward.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        canRedeem
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md cursor-pointer'
                          : 'bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{canRedeem ? 'Redeem Voucher' : `Need ${reward.cost} G`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomReward(reward.id)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                      title="Delete voucher"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Inventory */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-4">
          {ownedItems.length === 0 ? (
            <div className="p-8 text-center bg-[#12151f]/50 border border-dashed border-white/10 rounded-2xl">
              <p className="text-sm text-neutral-400">Your knapsack is empty. Forge items in the Armory!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedItems.map(item => {
                const isEquipped = Object.values(character.equipped).includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-[#12151f] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                          {item.slot}
                        </span>
                        {isEquipped && (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            Equipped
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold font-cinzel text-white mt-2">{item.name}</h3>
                      <p className="text-xs text-neutral-400 mt-1">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        +{item.bonusValue} {item.bonusStat.toUpperCase()}
                      </span>
                      {isEquipped ? (
                        <button
                          type="button"
                          onClick={() => onUnequipItem(item.slot)}
                          className="px-3 py-1.5 text-xs font-bold text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                        >
                          Unequip
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onEquipItem(item.id)}
                          className="px-4 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl transition-colors"
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Custom Reward */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#121520] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold font-cinzel text-white">Create Custom Real-World Reward</h3>
            <p className="text-xs text-neutral-400">
              Give yourself real-world motivation. Tie an activity you love to your in-game gold!
            </p>

            <form onSubmit={handleCreateReward} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Reward Title
                </label>
                <input
                  type="text"
                  required
                  value={rewardTitle}
                  onChange={e => setRewardTitle(e.target.value)}
                  placeholder="e.g. 1 Episode of Anime, Coffee Date, 1hr Video Games"
                  className="bg-[#0b0d14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Gold Cost
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={rewardCost}
                  onChange={e => setRewardCost(Number(e.target.value))}
                  className="bg-[#0b0d14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-cinzel shadow-md transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
