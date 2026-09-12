export type AttributeKey = 'str' | 'int' | 'vit' | 'dis' | 'cha';

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic';
export type QuestType = 'daily' | 'habit' | 'bounty';
export type QuestModifier = 'doom_clock' | 'iron_man' | 'boss_bane' | 'titan_trial' | 'none';
export type CharacterClassKey = 'warrior' | 'mage' | 'rogue' | 'paladin';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface CharacterStats {
  str: number; // Strength (Fitness, Gym, Physical)
  int: number; // Intellect (Coding, Reading, Studying)
  vit: number; // Vitality (Sleep, Water, Nutrition)
  dis: number; // Discipline (Focus, Morning Routine, Organization)
  cha: number; // Charisma (Social, Communication, Collaboration)
}

export interface StreakInfo {
  current: number;
  highest: number;
  lastActiveDate: string | null;
  multiplier: number; // e.g. 1.0, 1.15, 1.3
}

export interface EquippedGear {
  weapon?: string; // item id
  armor?: string;
  helmet?: string;
  accessory?: string;
}

export interface Character {
  userId: string;
  name: string;
  classTitle: string;
  characterClass?: CharacterClassKey;
  avatarIcon: string;
  level: number;
  currentXp: number;
  xpNeeded: number;
  gold: number;
  stats: CharacterStats;
  streak: StreakInfo;
  inventory: string[]; // item ids
  equipped: EquippedGear;
  completedCount: number;
  unspentStatPoints?: number;
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  bossesDefeated?: number;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  difficulty: QuestDifficulty;
  attribute: AttributeKey;
  type: QuestType;
  modifier?: QuestModifier;
  doomDeadlineHours?: number;
  xpReward: number;
  goldReward: number;
  completed: boolean;
  completedAt?: string;
  streak?: number;
  dueDate?: string;
  createdAt: string;
}

export interface BossEncounter {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  lore: string;
  avatar: string;
  maxHp: number;
  currentHp: number;
  level: number;
  element: 'fire' | 'void' | 'chaos' | 'shadow';
  weakness: AttributeKey;
  rewardGold: number;
  rewardXp: number;
  badgeTitle: string;
  enrageThreshold: number; // percentage, e.g. 30
  attackPower: number;
}

export type ItemSlot = 'weapon' | 'armor' | 'helmet' | 'accessory';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  slot: ItemSlot;
  cost: number;
  icon: string;
  bonusStat: AttributeKey;
  bonusValue: number;
  bonusPercentXp?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface CustomReward {
  id: string;
  userId: string;
  title: string;
  cost: number;
  icon: string;
  timesRedeemed: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'quest_completed' | 'level_up' | 'item_bought' | 'item_equipped' | 'reward_redeemed' | 'streak_extended';
  description: string;
  xpGained?: number;
  goldChange?: number;
  timestamp: string;
}

export interface CompletionResult {
  quest: Quest;
  character: Character;
  leveledUp: boolean;
  newLevel?: number;
  xpEarned: number;
  goldEarned: number;
  streakMultiplier: number;
  log: ActivityLog;
}

export interface AuthResponse {
  token: string;
  user: User;
  character: Character;
}
