import type { ShopItem, Quest } from '../types.ts';

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'wpn-1',
    name: 'Apprentice Wooden Sword',
    description: 'Carved from sturdy oak. Good for swinging during morning warmups.',
    slot: 'weapon',
    cost: 40,
    icon: 'Sword',
    bonusStat: 'str',
    bonusValue: 2,
    rarity: 'common'
  },
  {
    id: 'wpn-2',
    name: 'Quicksilver Quill',
    description: 'A glowing feather nib that sharpens reasoning and lines of code.',
    slot: 'weapon',
    cost: 110,
    icon: 'Feather',
    bonusStat: 'int',
    bonusValue: 6,
    bonusPercentXp: 5,
    rarity: 'rare'
  },
  {
    id: 'wpn-3',
    name: 'Runebound Claymore',
    description: 'Forged in dragonfire, hums with unyielding discipline.',
    slot: 'weapon',
    cost: 320,
    icon: 'Sparkles',
    bonusStat: 'dis',
    bonusValue: 12,
    bonusPercentXp: 10,
    rarity: 'epic'
  },
  {
    id: 'arm-1',
    name: 'Leather Padded Tunic',
    description: 'Comfortable, breathable attire suited for deep work and light jogging.',
    slot: 'armor',
    cost: 50,
    icon: 'Shield',
    bonusStat: 'vit',
    bonusValue: 3,
    rarity: 'common'
  },
  {
    id: 'arm-2',
    name: 'Mythril Chainmail',
    description: 'Deflects the arrows of lethargy and fatigue.',
    slot: 'armor',
    cost: 160,
    icon: 'ShieldAlert',
    bonusStat: 'vit',
    bonusValue: 8,
    rarity: 'rare'
  },
  {
    id: 'arm-3',
    name: 'Celestial Robes of Focus',
    description: 'Woven from aurora threads. Grants serene emotional equanimity.',
    slot: 'armor',
    cost: 450,
    icon: 'Crown',
    bonusStat: 'dis',
    bonusValue: 14,
    bonusPercentXp: 12,
    rarity: 'legendary'
  },
  {
    id: 'hlm-1',
    name: 'Iron Circlet of Mindfulness',
    description: 'Anchors awareness into the present moment.',
    slot: 'helmet',
    cost: 95,
    icon: 'Eye',
    bonusStat: 'int',
    bonusValue: 5,
    rarity: 'rare'
  },
  {
    id: 'hlm-2',
    name: 'Golden Diadem of Majesty',
    description: 'Radiates charisma in negotiations and team endeavors.',
    slot: 'helmet',
    cost: 280,
    icon: 'Sparkles',
    bonusStat: 'cha',
    bonusValue: 10,
    bonusPercentXp: 15,
    rarity: 'epic'
  },
  {
    id: 'acc-1',
    name: 'Chronos Pocket Watch',
    description: 'Slows the perception of time during deep flow states.',
    slot: 'accessory',
    cost: 130,
    icon: 'Clock',
    bonusStat: 'dis',
    bonusValue: 6,
    bonusPercentXp: 8,
    rarity: 'rare'
  },
  {
    id: 'acc-2',
    name: 'Ring of Sovereign Resilience',
    description: 'Guarantees unbreakable stamina even on exhausting days.',
    slot: 'accessory',
    cost: 390,
    icon: 'Zap',
    bonusStat: 'vit',
    bonusValue: 12,
    bonusPercentXp: 10,
    rarity: 'legendary'
  }
];

export const DEFAULT_STARTER_QUESTS: Quest[] = [
  {
    id: 'quest-start-1',
    userId: 'demo-user-1',
    title: 'Hydrate & Morning Sunlight ☀️',
    notes: 'Drink a glass of water and get 10 minutes of direct morning sunlight to set circadian rhythm.',
    difficulty: 'easy',
    attribute: 'vit',
    type: 'daily',
    xpReward: 35,
    goldReward: 20,
    completed: false,
    streak: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'quest-start-2',
    userId: 'demo-user-1',
    title: '90-Minute Deep Work Sprint 💻',
    notes: 'Close all social media, put phone on Do Not Disturb, and execute high-priority work with total focus.',
    difficulty: 'hard',
    attribute: 'int',
    type: 'daily',
    modifier: 'boss_bane',
    xpReward: 140,
    goldReward: 80,
    completed: false,
    streak: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'quest-start-3',
    userId: 'demo-user-1',
    title: 'Defeat Procrastination Wyrm 🐉',
    notes: 'Eliminate that one lingering chore or message you have delayed for over 48 hours.',
    difficulty: 'epic',
    attribute: 'dis',
    type: 'bounty',
    modifier: 'iron_man',
    xpReward: 300,
    goldReward: 160,
    completed: false,
    streak: 0,
    createdAt: new Date().toISOString()
  }
];
