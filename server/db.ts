import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  Character,
  CharacterStats,
  Quest,
  ShopItem,
  CustomReward,
  ActivityLog,
  AttributeKey,
  CompletionResult,
  QuestModifier,
  CharacterClassKey
} from '../src/types.ts';

// Helper to determine a writable directory for database storage.
// On Vercel / AWS Lambda, the root project directory is read-only, so we fallback to /tmp.
function resolveStoragePath(): { dir: string; file: string; writable: boolean } {
  // If explicitly in Vercel or AWS Lambda, use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    const tmpDir = path.join('/tmp', 'life_rpg_data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return { dir: tmpDir, file: path.join(tmpDir, 'db.json'), writable: true };
    } catch (e) {
      console.warn('Unable to create /tmp directory on serverless runtime:', e);
      return { dir: tmpDir, file: path.join(tmpDir, 'db.json'), writable: false };
    }
  }

  // Standard environment: try local data directory
  const localDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return { dir: localDir, file: path.join(localDir, 'db.json'), writable: true };
  } catch {
    // Read-only filesystem detected, fallback to /tmp
    const tmpDir = path.join('/tmp', 'life_rpg_data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return { dir: tmpDir, file: path.join(tmpDir, 'db.json'), writable: true };
    } catch {
      return { dir: tmpDir, file: path.join(tmpDir, 'db.json'), writable: false };
    }
  }
}

const storageConfig = resolveStoragePath();
const DATA_DIR = storageConfig.dir;
const DB_FILE = storageConfig.file;

export interface StoredUser extends User {
  passwordHash: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  characters: Character[];
  quests: Quest[];
  shopItems: ShopItem[];
  customRewards: CustomReward[];
  activityLogs: ActivityLog[];
}

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
    name: 'Broadsword of Iron Will',
    description: 'Forged from tempered iron. Refuses to buckle under heavy lifts.',
    slot: 'weapon',
    cost: 220,
    icon: 'Hammer',
    bonusStat: 'str',
    bonusValue: 10,
    bonusPercentXp: 8,
    rarity: 'epic'
  },
  {
    id: 'wpn-4',
    name: 'Excalibur of Hyperfocus',
    description: 'Legendary blade capable of cutting through all digital distractions.',
    slot: 'weapon',
    cost: 500,
    icon: 'Zap',
    bonusStat: 'dis',
    bonusValue: 18,
    bonusPercentXp: 15,
    rarity: 'legendary'
  },
  {
    id: 'hlm-1',
    name: 'Novice Leather Band',
    description: 'Keeps the sweat out of your eyes during intense focus sessions.',
    slot: 'helmet',
    cost: 30,
    icon: 'Eye',
    bonusStat: 'vit',
    bonusValue: 2,
    rarity: 'common'
  },
  {
    id: 'hlm-2',
    name: "Scholar's Monocle",
    description: 'A polished brass monocle revealing hidden logic in tough documentation.',
    slot: 'helmet',
    cost: 130,
    icon: 'Glasses',
    bonusStat: 'int',
    bonusValue: 7,
    bonusPercentXp: 6,
    rarity: 'rare'
  },
  {
    id: 'hlm-3',
    name: 'Crown of Sovereign Presence',
    description: 'Bestows a commanding aura during presentations and team scrums.',
    slot: 'helmet',
    cost: 350,
    icon: 'Crown',
    bonusStat: 'cha',
    bonusValue: 14,
    rarity: 'epic'
  },
  {
    id: 'arm-1',
    name: "Traveler's Linen Tunic",
    description: 'Light, breathable, and suitable for starting a new adventure.',
    slot: 'armor',
    cost: 35,
    icon: 'Shirt',
    bonusStat: 'dis',
    bonusValue: 2,
    rarity: 'common'
  },
  {
    id: 'arm-2',
    name: 'Mythril Vest of Endurance',
    description: 'Weave that absorbs mental fatigue and prevents early burnout.',
    slot: 'armor',
    cost: 190,
    icon: 'Shield',
    bonusStat: 'vit',
    bonusValue: 9,
    bonusPercentXp: 7,
    rarity: 'epic'
  },
  {
    id: 'acc-1',
    name: 'Golden Ring of Midas',
    description: 'Enchanted ring that attracts additional gold bounty from completed quests.',
    slot: 'accessory',
    cost: 160,
    icon: 'Sparkles',
    bonusStat: 'cha',
    bonusValue: 5,
    rarity: 'rare'
  },
  {
    id: 'acc-2',
    name: 'Phoenix Chrono-Pendant',
    description: 'Glows with temporal fire. Grants unwavering daily streak fortitude.',
    slot: 'accessory',
    cost: 420,
    icon: 'Flame',
    bonusStat: 'dis',
    bonusValue: 12,
    bonusPercentXp: 10,
    rarity: 'legendary'
  }
];

export function calculateXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.45));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'life_rpg_salt_2026').digest('hex');
}

export class Database {
  private data: DatabaseSchema;
  private isPersistable: boolean;

  constructor() {
    this.isPersistable = storageConfig.writable;

    try {
      if (this.isPersistable && !fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('Cannot create data directory, running in-memory:', e);
      this.isPersistable = false;
    }

    let loaded = false;
    if (this.isPersistable && fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all top-level keys exist
        this.data.users = this.data.users || [];
        this.data.characters = this.data.characters || [];
        this.data.quests = this.data.quests || [];
        this.data.shopItems = this.data.shopItems && this.data.shopItems.length ? this.data.shopItems : DEFAULT_SHOP_ITEMS;
        this.data.customRewards = this.data.customRewards || [];
        this.data.activityLogs = this.data.activityLogs || [];
        loaded = true;
      } catch (err) {
        console.warn('Failed to parse existing db.json, reinitializing default data:', err);
      }
    }

    if (!loaded) {
      this.data = this.createInitialData();
      this.persist();
    }
  }

  private persist() {
    if (!this.isPersistable) return;
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.warn('Failed to persist database to disk (continuing in-memory):', err);
      // Mark as non-persistable if permissions were denied
      this.isPersistable = false;
    }
  }

  private createInitialData(): DatabaseSchema {
    const demoUserId = 'demo-user-1';
    const demoPasswordHash = hashPassword('adventurer123');

    const demoUser: StoredUser = {
      id: demoUserId,
      username: 'ShadowKnight',
      email: 'adventurer@liferpg.realm',
      passwordHash: demoPasswordHash,
      createdAt: new Date().toISOString()
    };

    const demoCharacter: Character = {
      userId: demoUserId,
      name: 'Valerius',
      classTitle: 'Blade of Discipline',
      avatarIcon: 'ShieldAlert',
      level: 3,
      currentXp: 180,
      xpNeeded: calculateXpForLevel(3),
      gold: 145,
      stats: {
        str: 14,
        int: 18,
        vit: 12,
        dis: 16,
        cha: 10
      },
      streak: {
        current: 5,
        highest: 9,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        multiplier: 1.15
      },
      inventory: ['wpn-1', 'arm-1'],
      equipped: {
        weapon: 'wpn-1',
        armor: 'arm-1'
      },
      completedCount: 28,
      unspentStatPoints: 5,
      characterClass: 'warrior',
      bossesDefeated: 0
    };

    const now = new Date();
    const demoQuests: Quest[] = [
      {
        id: 'quest-1',
        userId: demoUserId,
        title: 'Complete 45 min Gym Hypertrophy Workout',
        notes: 'Bench press, dumbbell incline, tricep dips. Hydrate thoroughly.',
        difficulty: 'hard',
        attribute: 'str',
        type: 'daily',
        xpReward: 120,
        goldReward: 60,
        completed: false,
        streak: 4,
        dueDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString()
      },
      {
        id: 'quest-2',
        userId: demoUserId,
        title: 'Review System Design & Solve 2 LeetCode Mediums',
        notes: 'Graph traversal and dynamic programming memoization.',
        difficulty: 'epic',
        attribute: 'int',
        type: 'daily',
        xpReward: 250,
        goldReward: 120,
        completed: false,
        streak: 7,
        dueDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString()
      },
      {
        id: 'quest-3',
        userId: demoUserId,
        title: 'Drink 2.5 Liters of Clean Spring Water',
        notes: 'Fill tumbler 3 times before evening.',
        difficulty: 'easy',
        attribute: 'vit',
        type: 'habit',
        xpReward: 35,
        goldReward: 15,
        completed: true,
        completedAt: now.toISOString(),
        streak: 12,
        createdAt: now.toISOString()
      },
      {
        id: 'quest-4',
        userId: demoUserId,
        title: 'Morning 15-Minute Meditation & Gratitude Journal',
        notes: 'Quiet diaphragmatic breathing without checking phone first.',
        difficulty: 'medium',
        attribute: 'dis',
        type: 'daily',
        xpReward: 65,
        goldReward: 30,
        completed: true,
        completedAt: now.toISOString(),
        streak: 5,
        dueDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString()
      },
      {
        id: 'quest-5',
        userId: demoUserId,
        title: 'Catch up with a Mentor or Teammate on Voice Call',
        notes: 'Exchange feedback on architectural roadmap and share encouragement.',
        difficulty: 'medium',
        attribute: 'cha',
        type: 'bounty',
        xpReward: 70,
        goldReward: 35,
        completed: false,
        createdAt: now.toISOString()
      }
    ];

    const demoCustomRewards: CustomReward[] = [
      {
        id: 'reward-1',
        userId: demoUserId,
        title: '1 Hour Guilt-Free Video Game Session',
        cost: 90,
        icon: 'Gamepad2',
        timesRedeemed: 4
      },
      {
        id: 'reward-2',
        userId: demoUserId,
        title: 'Artisan Espresso & Pastry at Local Cafe',
        cost: 140,
        icon: 'Coffee',
        timesRedeemed: 2
      },
      {
        id: 'reward-3',
        userId: demoUserId,
        title: 'Weekend Sci-Fi Movie Night',
        cost: 200,
        icon: 'Film',
        timesRedeemed: 1
      }
    ];

    const demoLogs: ActivityLog[] = [
      {
        id: 'log-1',
        userId: demoUserId,
        type: 'quest_completed',
        description: 'Completed "Drink 2.5 Liters of Clean Spring Water" (+35 XP, +15 Gold)',
        xpGained: 35,
        goldChange: 15,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'log-2',
        userId: demoUserId,
        type: 'quest_completed',
        description: 'Completed "Morning 15-Minute Meditation & Gratitude Journal" (+65 XP, +30 Gold)',
        xpGained: 65,
        goldChange: 30,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'log-3',
        userId: demoUserId,
        type: 'streak_extended',
        description: 'Maintained 5-day active streak! 1.15x multiplier active.',
        timestamp: new Date().toISOString()
      }
    ];

    return {
      users: [demoUser],
      characters: [demoCharacter],
      quests: demoQuests,
      shopItems: DEFAULT_SHOP_ITEMS,
      customRewards: demoCustomRewards,
      activityLogs: demoLogs
    };
  }

  // --- Auth & Users ---
  getUserById(id: string): StoredUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmailOrUsername(identifier: string): StoredUser | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
  }

  createUser(username: string, email: string, password: string): { user: User; character: Character } {
    const existing = this.getUserByEmailOrUsername(email) || this.getUserByEmailOrUsername(username);
    if (existing) {
      throw new Error('User with this username or email already exists');
    }

    const userId = 'usr-' + crypto.randomUUID();
    const newUser: StoredUser = {
      id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    const newChar: Character = {
      userId,
      name: username.trim(),
      classTitle: 'Apprentice Novice',
      avatarIcon: 'Shield',
      level: 1,
      currentXp: 0,
      xpNeeded: calculateXpForLevel(1),
      gold: 50, // Starting gold
      stats: {
        str: 10,
        int: 10,
        vit: 10,
        dis: 10,
        cha: 10
      },
      streak: {
        current: 1,
        highest: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        multiplier: 1.0
      },
      inventory: ['wpn-1'],
      equipped: {
        weapon: 'wpn-1'
      },
      completedCount: 0
    };

    // Starter starter quests
    const starterQuests: Quest[] = [
      {
        id: 'qst-' + crypto.randomUUID(),
        userId,
        title: 'Drink a glass of cold water upon waking',
        notes: 'Hydrate cells immediately after sleep.',
        difficulty: 'easy',
        attribute: 'vit',
        type: 'daily',
        xpReward: 30,
        goldReward: 10,
        completed: false,
        streak: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      },
      {
        id: 'qst-' + crypto.randomUUID(),
        userId,
        title: 'Deep focus study or coding sprint (30 mins)',
        notes: 'Zero phone, zero social feeds.',
        difficulty: 'medium',
        attribute: 'int',
        type: 'daily',
        xpReward: 60,
        goldReward: 25,
        completed: false,
        streak: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      },
      {
        id: 'qst-' + crypto.randomUUID(),
        userId,
        title: '15 pushups & core posture stretch',
        notes: 'Awaken muscles and straighten back.',
        difficulty: 'easy',
        attribute: 'str',
        type: 'habit',
        xpReward: 30,
        goldReward: 10,
        completed: false,
        streak: 0,
        createdAt: new Date().toISOString()
      }
    ];

    this.data.users.push(newUser);
    this.data.characters.push(newChar);
    this.data.quests.push(...starterQuests);
    this.persist();

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, character: newChar };
  }

  verifyCredentials(identifier: string, password: string): { user: User; character: Character } | null {
    const user = this.getUserByEmailOrUsername(identifier);
    if (!user) return null;
    if (user.passwordHash !== hashPassword(password)) return null;

    const char = this.getCharacter(user.id);
    if (!char) return null;

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, character: char };
  }

  // --- Character ---
  getCharacter(userId: string): Character | undefined {
    return this.data.characters.find(c => c.userId === userId);
  }

  updateCharacter(character: Character) {
    const idx = this.data.characters.findIndex(c => c.userId === character.userId);
    if (idx !== -1) {
      this.data.characters[idx] = character;
      this.persist();
    }
  }

  // --- Quests CRUD ---
  getQuests(userId: string): Quest[] {
    return this.data.quests.filter(q => q.userId === userId);
  }

  createQuest(userId: string, data: {
    title: string;
    notes?: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'epic';
    attribute: AttributeKey;
    type: 'daily' | 'habit' | 'bounty';
    dueDate?: string;
    modifier?: QuestModifier;
  }): Quest {
    if (!data.title || !data.title.trim()) {
      throw new Error('Quest title is required');
    }

    const rewards: Record<string, { xp: number; gold: number }> = {
      easy: { xp: 35, gold: 12 },
      medium: { xp: 70, gold: 30 },
      hard: { xp: 140, gold: 65 },
      epic: { xp: 280, gold: 140 }
    };

    const baseReward = rewards[data.difficulty] || rewards.medium;
    let xp = baseReward.xp;
    let gold = baseReward.gold;

    if (data.modifier === 'doom_clock') {
      xp = Math.round(xp * 1.5);
      gold = Math.round(gold * 1.5);
    } else if (data.modifier === 'iron_man') {
      xp = Math.round(xp * 2.0);
      gold = Math.round(gold * 2.0);
    }

    const newQuest: Quest = {
      id: 'qst-' + crypto.randomUUID(),
      userId,
      title: data.title.trim(),
      notes: data.notes?.trim() || '',
      difficulty: data.difficulty,
      attribute: data.attribute,
      type: data.type,
      modifier: data.modifier || 'none',
      xpReward: xp,
      goldReward: gold,
      completed: false,
      streak: 0,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString()
    };

    this.data.quests.unshift(newQuest);
    this.persist();
    return newQuest;
  }

  updateQuest(userId: string, questId: string, updates: Partial<Quest>): Quest {
    const q = this.data.quests.find(item => item.id === questId && item.userId === userId);
    if (!q) {
      throw new Error('Quest not found');
    }

    if (updates.title !== undefined) {
      if (!updates.title.trim()) throw new Error('Quest title cannot be empty');
      q.title = updates.title.trim();
    }
    if (updates.notes !== undefined) q.notes = updates.notes;
    if (updates.difficulty !== undefined) {
      q.difficulty = updates.difficulty;
      const rewards: Record<string, { xp: number; gold: number }> = {
        easy: { xp: 35, gold: 12 },
        medium: { xp: 70, gold: 30 },
        hard: { xp: 140, gold: 65 },
        epic: { xp: 280, gold: 140 }
      };
      const r = rewards[updates.difficulty] || rewards.medium;
      q.xpReward = r.xp;
      q.goldReward = r.gold;
    }
    if (updates.attribute !== undefined) q.attribute = updates.attribute;
    if (updates.type !== undefined) q.type = updates.type;
    if (updates.dueDate !== undefined) q.dueDate = updates.dueDate;

    this.persist();
    return q;
  }

  deleteQuest(userId: string, questId: string): boolean {
    const idx = this.data.quests.findIndex(item => item.id === questId && item.userId === userId);
    if (idx === -1) return false;
    this.data.quests.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- RPG Progression Engine: Complete Quest (Server-Authoritative Anti-Cheat) ---
  completeQuest(userId: string, questId: string): CompletionResult {
    const quest = this.data.quests.find(q => q.id === questId && q.userId === userId);
    if (!quest) throw new Error('Quest not found');
    if (quest.completed) throw new Error('Quest is already completed');

    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');

    // 1. Calculate Gear XP and Gold bonuses
    let xpPercentBonus = 0;
    const equippedItemIds = Object.values(character.equipped).filter(Boolean) as string[];
    const equippedItems = this.data.shopItems.filter(item => equippedItemIds.includes(item.id));
    for (const item of equippedItems) {
      if (item.bonusPercentXp) {
        xpPercentBonus += item.bonusPercentXp;
      }
    }

    // 2. Daily Streak Multiplier Calculation
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = character.streak.lastActiveDate;
    let newCurrentStreak = character.streak.current;

    if (!lastActive) {
      newCurrentStreak = 1;
    } else if (lastActive === today) {
      // already active today, preserve streak
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastActive === yesterday) {
        newCurrentStreak += 1;
      } else {
        // missed day, reset streak to 1
        newCurrentStreak = 1;
      }
    }

    let multiplier = 1.0;
    if (newCurrentStreak >= 7) multiplier = 1.30;
    else if (newCurrentStreak >= 3) multiplier = 1.15;

    character.streak = {
      current: newCurrentStreak,
      highest: Math.max(newCurrentStreak, character.streak.highest),
      lastActiveDate: today,
      multiplier
    };

    // 3. Compute Earned XP & Gold
    const baseMultiplier = multiplier * (1 + xpPercentBonus / 100);
    const xpEarned = Math.round(quest.xpReward * baseMultiplier);
    const goldEarned = Math.round(quest.goldReward * multiplier);

    // 4. Update Character Stats & Inventory
    character.gold += goldEarned;
    character.completedCount += 1;

    // Stat attribution (e.g. gym increases STR)
    const statGained: AttributeKey = quest.attribute;
    character.stats[statGained] = (character.stats[statGained] || 10) + 1;

    // 5. Non-linear Level Up Check
    let currentXp = character.currentXp + xpEarned;
    let level = character.level;
    let xpNeeded = calculateXpForLevel(level);
    let leveledUp = false;

    while (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      level += 1;
      xpNeeded = calculateXpForLevel(level);
      leveledUp = true;
      // Bonus stats on level up!
      character.stats.str += 1;
      character.stats.int += 1;
      character.stats.vit += 1;
      character.stats.dis += 1;
      character.stats.cha += 1;
      character.unspentStatPoints = (character.unspentStatPoints || 0) + 3;
    }

    if (quest.modifier === 'titan_trial') {
      character.unspentStatPoints = (character.unspentStatPoints || 0) + 2;
    }

    character.level = level;
    character.currentXp = currentXp;
    character.xpNeeded = xpNeeded;

    // Update dynamic Class Title based on dominant stat
    character.classTitle = this.computeClassTitle(character.level, character.stats);

    // 6. Mark Quest Completed
    quest.completed = true;
    quest.completedAt = new Date().toISOString();
    quest.streak = (quest.streak || 0) + 1;

    // 7. Activity Log
    const log: ActivityLog = {
      id: 'log-' + crypto.randomUUID(),
      userId,
      type: leveledUp ? 'level_up' : 'quest_completed',
      description: leveledUp
        ? `Leveled up to Level ${level} "${character.classTitle}"! Completed "${quest.title}" (+${xpEarned} XP, +${goldEarned} Gold)`
        : `Completed "${quest.title}" (+${xpEarned} XP, +${goldEarned} Gold, +1 ${statGained.toUpperCase()})`,
      xpGained: xpEarned,
      goldChange: goldEarned,
      timestamp: new Date().toISOString()
    };

    this.data.activityLogs.unshift(log);
    if (this.data.activityLogs.length > 100) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 100);
    }

    this.updateCharacter(character);
    this.persist();

    return {
      quest,
      character,
      leveledUp,
      newLevel: leveledUp ? level : undefined,
      xpEarned,
      goldEarned,
      streakMultiplier: multiplier,
      log
    };
  }

  uncompleteQuest(userId: string, questId: string): { quest: Quest; character: Character } {
    const quest = this.data.quests.find(q => q.id === questId && q.userId === userId);
    if (!quest) throw new Error('Quest not found');
    if (!quest.completed) throw new Error('Quest is not completed');

    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');

    quest.completed = false;
    delete quest.completedAt;
    if (quest.streak && quest.streak > 0) quest.streak -= 1;

    // Deduct base rewards safely
    character.gold = Math.max(0, character.gold - quest.goldReward);
    character.currentXp = Math.max(0, character.currentXp - quest.xpReward);
    character.completedCount = Math.max(0, character.completedCount - 1);

    this.updateCharacter(character);
    this.persist();

    return { quest, character };
  }

  private computeClassTitle(level: number, stats: CharacterStats): string {
    const dominant = (Object.keys(stats) as AttributeKey[]).reduce((a, b) =>
      stats[a] > stats[b] ? a : b
    );

    const prefix = level >= 10 ? 'Archon' : level >= 6 ? 'Champion' : level >= 3 ? 'Adept' : 'Initiate';

    const titles: Record<AttributeKey, string> = {
      str: `${prefix} of Might`,
      int: `${prefix} of Arcane Lore`,
      vit: `${prefix} of the Wilds`,
      dis: `${prefix} of Iron Will`,
      cha: `${prefix} of the Realm`
    };

    return titles[dominant] || `${prefix} Adventurer`;
  }

  // --- Shop & Inventory ---
  getShopItems(): ShopItem[] {
    return this.data.shopItems;
  }

  buyItem(userId: string, itemId: string): { character: Character; item: ShopItem } {
    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');

    const item = this.data.shopItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    if (character.inventory.includes(itemId)) {
      throw new Error('Item is already in your inventory');
    }

    if (character.gold < item.cost) {
      throw new Error(`Insufficient gold! You need ${item.cost} G, but have ${character.gold} G.`);
    }

    character.gold -= item.cost;
    character.inventory.push(itemId);

    // Auto-equip if slot is empty
    if (!character.equipped[item.slot]) {
      character.equipped[item.slot] = item.id;
      character.stats[item.bonusStat] += item.bonusValue;
    }

    const log: ActivityLog = {
      id: 'log-' + crypto.randomUUID(),
      userId,
      type: 'item_bought',
      description: `Purchased "${item.name}" for ${item.cost} Gold`,
      goldChange: -item.cost,
      timestamp: new Date().toISOString()
    };
    this.data.activityLogs.unshift(log);

    this.updateCharacter(character);
    this.persist();

    return { character, item };
  }

  equipItem(userId: string, itemId: string): Character {
    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');

    const item = this.data.shopItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    if (!character.inventory.includes(itemId)) {
      throw new Error('You do not own this item');
    }

    // Unequip currently equipped item in this slot if any
    const currentEquippedId = character.equipped[item.slot];
    if (currentEquippedId) {
      const currentItem = this.data.shopItems.find(i => i.id === currentEquippedId);
      if (currentItem) {
        character.stats[currentItem.bonusStat] = Math.max(1, character.stats[currentItem.bonusStat] - currentItem.bonusValue);
      }
    }

    character.equipped[item.slot] = item.id;
    character.stats[item.bonusStat] += item.bonusValue;

    const log: ActivityLog = {
      id: 'log-' + crypto.randomUUID(),
      userId,
      type: 'item_equipped',
      description: `Equipped "${item.name}" (+${item.bonusValue} ${item.bonusStat.toUpperCase()})`,
      timestamp: new Date().toISOString()
    };
    this.data.activityLogs.unshift(log);

    this.updateCharacter(character);
    this.persist();
    return character;
  }

  unequipItem(userId: string, slot: string): Character {
    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');

    const validSlot = slot as keyof typeof character.equipped;
    const currentEquippedId = character.equipped[validSlot];
    if (currentEquippedId) {
      const currentItem = this.data.shopItems.find(i => i.id === currentEquippedId);
      if (currentItem) {
        character.stats[currentItem.bonusStat] = Math.max(1, character.stats[currentItem.bonusStat] - currentItem.bonusValue);
      }
      delete character.equipped[validSlot];
      this.updateCharacter(character);
      this.persist();
    }

    return character;
  }

  // --- Custom Real-World Rewards ---
  getCustomRewards(userId: string): CustomReward[] {
    return this.data.customRewards.filter(r => r.userId === userId);
  }

  createCustomReward(userId: string, title: string, cost: number, icon: string): CustomReward {
    if (!title || !title.trim()) throw new Error('Reward title is required');
    if (cost <= 0) throw new Error('Reward cost must be at least 1 Gold');

    const newReward: CustomReward = {
      id: 'rwd-' + crypto.randomUUID(),
      userId,
      title: title.trim(),
      cost,
      icon: icon || 'Gift',
      timesRedeemed: 0
    };

    this.data.customRewards.push(newReward);
    this.persist();
    return newReward;
  }

  redeemCustomReward(userId: string, rewardId: string): { character: Character; reward: CustomReward } {
    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');

    const reward = this.data.customRewards.find(r => r.id === rewardId && r.userId === userId);
    if (!reward) throw new Error('Reward not found');

    if (character.gold < reward.cost) {
      throw new Error(`Insufficient gold! You need ${reward.cost} G, but have ${character.gold} G.`);
    }

    character.gold -= reward.cost;
    reward.timesRedeemed += 1;

    const log: ActivityLog = {
      id: 'log-' + crypto.randomUUID(),
      userId,
      type: 'reward_redeemed',
      description: `Redeemed real-world reward "${reward.title}" (-${reward.cost} Gold)`,
      goldChange: -reward.cost,
      timestamp: new Date().toISOString()
    };
    this.data.activityLogs.unshift(log);

    this.updateCharacter(character);
    this.persist();

    return { character, reward };
  }

  deleteCustomReward(userId: string, rewardId: string): boolean {
    const idx = this.data.customRewards.findIndex(r => r.id === rewardId && r.userId === userId);
    if (idx === -1) return false;
    this.data.customRewards.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Logs ---
  getActivityLogs(userId: string): ActivityLog[] {
    return this.data.activityLogs.filter(l => l.userId === userId);
  }

  // --- RPG Stat & Class Methods ---
  allocateStat(userId: string, attribute: AttributeKey): Character {
    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');
    if (!character.unspentStatPoints || character.unspentStatPoints <= 0) {
      throw new Error('No unspent stat points available');
    }
    character.unspentStatPoints -= 1;
    character.stats[attribute] = (character.stats[attribute] || 10) + 1;
    this.updateCharacter(character);
    this.persist();
    return character;
  }

  setCharacterClass(userId: string, characterClass: CharacterClassKey): Character {
    const character = this.getCharacter(userId);
    if (!character) throw new Error('Character not found');
    character.characterClass = characterClass;
    this.updateCharacter(character);
    this.persist();
    return character;
  }
}

export const db = new Database();
