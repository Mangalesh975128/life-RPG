// server/app.ts
import express from "express";
import crypto2 from "crypto";

// server/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
function resolveStoragePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    const tmpDir = path.join("/tmp", "life_rpg_data");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return { dir: tmpDir, file: path.join(tmpDir, "db.json"), writable: true };
    } catch (e) {
      console.warn("Unable to create /tmp directory on serverless runtime:", e);
      return { dir: tmpDir, file: path.join(tmpDir, "db.json"), writable: false };
    }
  }
  const localDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".write-test");
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    return { dir: localDir, file: path.join(localDir, "db.json"), writable: true };
  } catch {
    const tmpDir = path.join("/tmp", "life_rpg_data");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return { dir: tmpDir, file: path.join(tmpDir, "db.json"), writable: true };
    } catch {
      return { dir: tmpDir, file: path.join(tmpDir, "db.json"), writable: false };
    }
  }
}
var storageConfig = resolveStoragePath();
var DATA_DIR = storageConfig.dir;
var DB_FILE = storageConfig.file;
var DEFAULT_SHOP_ITEMS = [
  {
    id: "wpn-1",
    name: "Apprentice Wooden Sword",
    description: "Carved from sturdy oak. Good for swinging during morning warmups.",
    slot: "weapon",
    cost: 40,
    icon: "Sword",
    bonusStat: "str",
    bonusValue: 2,
    rarity: "common"
  },
  {
    id: "wpn-2",
    name: "Quicksilver Quill",
    description: "A glowing feather nib that sharpens reasoning and lines of code.",
    slot: "weapon",
    cost: 110,
    icon: "Feather",
    bonusStat: "int",
    bonusValue: 6,
    bonusPercentXp: 5,
    rarity: "rare"
  },
  {
    id: "wpn-3",
    name: "Broadsword of Iron Will",
    description: "Forged from tempered iron. Refuses to buckle under heavy lifts.",
    slot: "weapon",
    cost: 220,
    icon: "Hammer",
    bonusStat: "str",
    bonusValue: 10,
    bonusPercentXp: 8,
    rarity: "epic"
  },
  {
    id: "wpn-4",
    name: "Excalibur of Hyperfocus",
    description: "Legendary blade capable of cutting through all digital distractions.",
    slot: "weapon",
    cost: 500,
    icon: "Zap",
    bonusStat: "dis",
    bonusValue: 18,
    bonusPercentXp: 15,
    rarity: "legendary"
  },
  {
    id: "hlm-1",
    name: "Novice Leather Band",
    description: "Keeps the sweat out of your eyes during intense focus sessions.",
    slot: "helmet",
    cost: 30,
    icon: "Eye",
    bonusStat: "vit",
    bonusValue: 2,
    rarity: "common"
  },
  {
    id: "hlm-2",
    name: "Scholar's Monocle",
    description: "A polished brass monocle revealing hidden logic in tough documentation.",
    slot: "helmet",
    cost: 130,
    icon: "Glasses",
    bonusStat: "int",
    bonusValue: 7,
    bonusPercentXp: 6,
    rarity: "rare"
  },
  {
    id: "hlm-3",
    name: "Crown of Sovereign Presence",
    description: "Bestows a commanding aura during presentations and team scrums.",
    slot: "helmet",
    cost: 350,
    icon: "Crown",
    bonusStat: "cha",
    bonusValue: 14,
    rarity: "epic"
  },
  {
    id: "arm-1",
    name: "Traveler's Linen Tunic",
    description: "Light, breathable, and suitable for starting a new adventure.",
    slot: "armor",
    cost: 35,
    icon: "Shirt",
    bonusStat: "dis",
    bonusValue: 2,
    rarity: "common"
  },
  {
    id: "arm-2",
    name: "Mythril Vest of Endurance",
    description: "Weave that absorbs mental fatigue and prevents early burnout.",
    slot: "armor",
    cost: 190,
    icon: "Shield",
    bonusStat: "vit",
    bonusValue: 9,
    bonusPercentXp: 7,
    rarity: "epic"
  },
  {
    id: "acc-1",
    name: "Golden Ring of Midas",
    description: "Enchanted ring that attracts additional gold bounty from completed quests.",
    slot: "accessory",
    cost: 160,
    icon: "Sparkles",
    bonusStat: "cha",
    bonusValue: 5,
    rarity: "rare"
  },
  {
    id: "acc-2",
    name: "Phoenix Chrono-Pendant",
    description: "Glows with temporal fire. Grants unwavering daily streak fortitude.",
    slot: "accessory",
    cost: 420,
    icon: "Flame",
    bonusStat: "dis",
    bonusValue: 12,
    bonusPercentXp: 10,
    rarity: "legendary"
  }
];
function calculateXpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.45));
}
function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "life_rpg_salt_2026").digest("hex");
}
var Database = class {
  constructor() {
    this.isPersistable = storageConfig.writable;
    try {
      if (this.isPersistable && !fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn("Cannot create data directory, running in-memory:", e);
      this.isPersistable = false;
    }
    let loaded = false;
    if (this.isPersistable && fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        this.data.users = this.data.users || [];
        this.data.characters = this.data.characters || [];
        this.data.quests = this.data.quests || [];
        this.data.shopItems = this.data.shopItems && this.data.shopItems.length ? this.data.shopItems : DEFAULT_SHOP_ITEMS;
        this.data.customRewards = this.data.customRewards || [];
        this.data.activityLogs = this.data.activityLogs || [];
        loaded = true;
      } catch (err) {
        console.warn("Failed to parse existing db.json, reinitializing default data:", err);
      }
    }
    if (!loaded) {
      this.data = this.createInitialData();
      this.persist();
    }
  }
  persist() {
    if (!this.isPersistable) return;
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.warn("Failed to persist database to disk (continuing in-memory):", err);
      this.isPersistable = false;
    }
  }
  createInitialData() {
    const demoUserId = "demo-user-1";
    const demoPasswordHash = hashPassword("adventurer123");
    const demoUser = {
      id: demoUserId,
      username: "ShadowKnight",
      email: "adventurer@liferpg.realm",
      passwordHash: demoPasswordHash,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const demoCharacter = {
      userId: demoUserId,
      name: "Valerius",
      classTitle: "Blade of Discipline",
      avatarIcon: "ShieldAlert",
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
        lastActiveDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        multiplier: 1.15
      },
      inventory: ["wpn-1", "arm-1"],
      equipped: {
        weapon: "wpn-1",
        armor: "arm-1"
      },
      completedCount: 28,
      unspentStatPoints: 5,
      characterClass: "warrior",
      bossesDefeated: 0
    };
    const now = /* @__PURE__ */ new Date();
    const demoQuests = [
      {
        id: "quest-1",
        userId: demoUserId,
        title: "Complete 45 min Gym Hypertrophy Workout",
        notes: "Bench press, dumbbell incline, tricep dips. Hydrate thoroughly.",
        difficulty: "hard",
        attribute: "str",
        type: "daily",
        xpReward: 120,
        goldReward: 60,
        completed: false,
        streak: 4,
        dueDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString()
      },
      {
        id: "quest-2",
        userId: demoUserId,
        title: "Review System Design & Solve 2 LeetCode Mediums",
        notes: "Graph traversal and dynamic programming memoization.",
        difficulty: "epic",
        attribute: "int",
        type: "daily",
        xpReward: 250,
        goldReward: 120,
        completed: false,
        streak: 7,
        dueDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString()
      },
      {
        id: "quest-3",
        userId: demoUserId,
        title: "Drink 2.5 Liters of Clean Spring Water",
        notes: "Fill tumbler 3 times before evening.",
        difficulty: "easy",
        attribute: "vit",
        type: "habit",
        xpReward: 35,
        goldReward: 15,
        completed: true,
        completedAt: now.toISOString(),
        streak: 12,
        createdAt: now.toISOString()
      },
      {
        id: "quest-4",
        userId: demoUserId,
        title: "Morning 15-Minute Meditation & Gratitude Journal",
        notes: "Quiet diaphragmatic breathing without checking phone first.",
        difficulty: "medium",
        attribute: "dis",
        type: "daily",
        xpReward: 65,
        goldReward: 30,
        completed: true,
        completedAt: now.toISOString(),
        streak: 5,
        dueDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString()
      },
      {
        id: "quest-5",
        userId: demoUserId,
        title: "Catch up with a Mentor or Teammate on Voice Call",
        notes: "Exchange feedback on architectural roadmap and share encouragement.",
        difficulty: "medium",
        attribute: "cha",
        type: "bounty",
        xpReward: 70,
        goldReward: 35,
        completed: false,
        createdAt: now.toISOString()
      }
    ];
    const demoCustomRewards = [
      {
        id: "reward-1",
        userId: demoUserId,
        title: "1 Hour Guilt-Free Video Game Session",
        cost: 90,
        icon: "Gamepad2",
        timesRedeemed: 4
      },
      {
        id: "reward-2",
        userId: demoUserId,
        title: "Artisan Espresso & Pastry at Local Cafe",
        cost: 140,
        icon: "Coffee",
        timesRedeemed: 2
      },
      {
        id: "reward-3",
        userId: demoUserId,
        title: "Weekend Sci-Fi Movie Night",
        cost: 200,
        icon: "Film",
        timesRedeemed: 1
      }
    ];
    const demoLogs = [
      {
        id: "log-1",
        userId: demoUserId,
        type: "quest_completed",
        description: 'Completed "Drink 2.5 Liters of Clean Spring Water" (+35 XP, +15 Gold)',
        xpGained: 35,
        goldChange: 15,
        timestamp: new Date(Date.now() - 36e5 * 2).toISOString()
      },
      {
        id: "log-2",
        userId: demoUserId,
        type: "quest_completed",
        description: 'Completed "Morning 15-Minute Meditation & Gratitude Journal" (+65 XP, +30 Gold)',
        xpGained: 65,
        goldChange: 30,
        timestamp: new Date(Date.now() - 36e5).toISOString()
      },
      {
        id: "log-3",
        userId: demoUserId,
        type: "streak_extended",
        description: "Maintained 5-day active streak! 1.15x multiplier active.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
  getUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  getUserByEmailOrUsername(identifier) {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
  }
  createUser(username, email, password) {
    const existing = this.getUserByEmailOrUsername(email) || this.getUserByEmailOrUsername(username);
    if (existing) {
      throw new Error("User with this username or email already exists");
    }
    const userId = "usr-" + crypto.randomUUID();
    const newUser = {
      id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const newChar = {
      userId,
      name: username.trim(),
      classTitle: "Apprentice Novice",
      avatarIcon: "Shield",
      level: 1,
      currentXp: 0,
      xpNeeded: calculateXpForLevel(1),
      gold: 50,
      // Starting gold
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
        lastActiveDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        multiplier: 1
      },
      inventory: ["wpn-1"],
      equipped: {
        weapon: "wpn-1"
      },
      completedCount: 0
    };
    const starterQuests = [
      {
        id: "qst-" + crypto.randomUUID(),
        userId,
        title: "Drink a glass of cold water upon waking",
        notes: "Hydrate cells immediately after sleep.",
        difficulty: "easy",
        attribute: "vit",
        type: "daily",
        xpReward: 30,
        goldReward: 10,
        completed: false,
        streak: 0,
        dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "qst-" + crypto.randomUUID(),
        userId,
        title: "Deep focus study or coding sprint (30 mins)",
        notes: "Zero phone, zero social feeds.",
        difficulty: "medium",
        attribute: "int",
        type: "daily",
        xpReward: 60,
        goldReward: 25,
        completed: false,
        streak: 0,
        dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "qst-" + crypto.randomUUID(),
        userId,
        title: "15 pushups & core posture stretch",
        notes: "Awaken muscles and straighten back.",
        difficulty: "easy",
        attribute: "str",
        type: "habit",
        xpReward: 30,
        goldReward: 10,
        completed: false,
        streak: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    this.data.users.push(newUser);
    this.data.characters.push(newChar);
    this.data.quests.push(...starterQuests);
    this.persist();
    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, character: newChar };
  }
  verifyCredentials(identifier, password) {
    const user = this.getUserByEmailOrUsername(identifier);
    if (!user) return null;
    if (user.passwordHash !== hashPassword(password)) return null;
    const char = this.getCharacter(user.id);
    if (!char) return null;
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, character: char };
  }
  // --- Character ---
  getCharacter(userId) {
    return this.data.characters.find((c) => c.userId === userId);
  }
  updateCharacter(character) {
    const idx = this.data.characters.findIndex((c) => c.userId === character.userId);
    if (idx !== -1) {
      this.data.characters[idx] = character;
      this.persist();
    }
  }
  // --- Quests CRUD ---
  getQuests(userId) {
    return this.data.quests.filter((q) => q.userId === userId);
  }
  createQuest(userId, data) {
    if (!data.title || !data.title.trim()) {
      throw new Error("Quest title is required");
    }
    const rewards = {
      easy: { xp: 35, gold: 12 },
      medium: { xp: 70, gold: 30 },
      hard: { xp: 140, gold: 65 },
      epic: { xp: 280, gold: 140 }
    };
    const baseReward = rewards[data.difficulty] || rewards.medium;
    let xp = baseReward.xp;
    let gold = baseReward.gold;
    if (data.modifier === "doom_clock") {
      xp = Math.round(xp * 1.5);
      gold = Math.round(gold * 1.5);
    } else if (data.modifier === "iron_man") {
      xp = Math.round(xp * 2);
      gold = Math.round(gold * 2);
    }
    const newQuest = {
      id: "qst-" + crypto.randomUUID(),
      userId,
      title: data.title.trim(),
      notes: data.notes?.trim() || "",
      difficulty: data.difficulty,
      attribute: data.attribute,
      type: data.type,
      modifier: data.modifier || "none",
      xpReward: xp,
      goldReward: gold,
      completed: false,
      streak: 0,
      dueDate: data.dueDate,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.quests.unshift(newQuest);
    this.persist();
    return newQuest;
  }
  updateQuest(userId, questId, updates) {
    const q = this.data.quests.find((item) => item.id === questId && item.userId === userId);
    if (!q) {
      throw new Error("Quest not found");
    }
    if (updates.title !== void 0) {
      if (!updates.title.trim()) throw new Error("Quest title cannot be empty");
      q.title = updates.title.trim();
    }
    if (updates.notes !== void 0) q.notes = updates.notes;
    if (updates.difficulty !== void 0) {
      q.difficulty = updates.difficulty;
      const rewards = {
        easy: { xp: 35, gold: 12 },
        medium: { xp: 70, gold: 30 },
        hard: { xp: 140, gold: 65 },
        epic: { xp: 280, gold: 140 }
      };
      const r = rewards[updates.difficulty] || rewards.medium;
      q.xpReward = r.xp;
      q.goldReward = r.gold;
    }
    if (updates.attribute !== void 0) q.attribute = updates.attribute;
    if (updates.type !== void 0) q.type = updates.type;
    if (updates.dueDate !== void 0) q.dueDate = updates.dueDate;
    this.persist();
    return q;
  }
  deleteQuest(userId, questId) {
    const idx = this.data.quests.findIndex((item) => item.id === questId && item.userId === userId);
    if (idx === -1) return false;
    this.data.quests.splice(idx, 1);
    this.persist();
    return true;
  }
  // --- RPG Progression Engine: Complete Quest (Server-Authoritative Anti-Cheat) ---
  completeQuest(userId, questId) {
    const quest = this.data.quests.find((q) => q.id === questId && q.userId === userId);
    if (!quest) throw new Error("Quest not found");
    if (quest.completed) throw new Error("Quest is already completed");
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    let xpPercentBonus = 0;
    const equippedItemIds = Object.values(character.equipped).filter(Boolean);
    const equippedItems = this.data.shopItems.filter((item) => equippedItemIds.includes(item.id));
    for (const item of equippedItems) {
      if (item.bonusPercentXp) {
        xpPercentBonus += item.bonusPercentXp;
      }
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const lastActive = character.streak.lastActiveDate;
    let newCurrentStreak = character.streak.current;
    if (!lastActive) {
      newCurrentStreak = 1;
    } else if (lastActive === today) {
    } else {
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      if (lastActive === yesterday) {
        newCurrentStreak += 1;
      } else {
        newCurrentStreak = 1;
      }
    }
    let multiplier = 1;
    if (newCurrentStreak >= 7) multiplier = 1.3;
    else if (newCurrentStreak >= 3) multiplier = 1.15;
    character.streak = {
      current: newCurrentStreak,
      highest: Math.max(newCurrentStreak, character.streak.highest),
      lastActiveDate: today,
      multiplier
    };
    const baseMultiplier = multiplier * (1 + xpPercentBonus / 100);
    const xpEarned = Math.round(quest.xpReward * baseMultiplier);
    const goldEarned = Math.round(quest.goldReward * multiplier);
    character.gold += goldEarned;
    character.completedCount += 1;
    const statGained = quest.attribute;
    character.stats[statGained] = (character.stats[statGained] || 10) + 1;
    let currentXp = character.currentXp + xpEarned;
    let level = character.level;
    let xpNeeded = calculateXpForLevel(level);
    let leveledUp = false;
    while (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      level += 1;
      xpNeeded = calculateXpForLevel(level);
      leveledUp = true;
      character.stats.str += 1;
      character.stats.int += 1;
      character.stats.vit += 1;
      character.stats.dis += 1;
      character.stats.cha += 1;
      character.unspentStatPoints = (character.unspentStatPoints || 0) + 3;
    }
    if (quest.modifier === "titan_trial") {
      character.unspentStatPoints = (character.unspentStatPoints || 0) + 2;
    }
    character.level = level;
    character.currentXp = currentXp;
    character.xpNeeded = xpNeeded;
    character.classTitle = this.computeClassTitle(character.level, character.stats);
    quest.completed = true;
    quest.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    quest.streak = (quest.streak || 0) + 1;
    const log = {
      id: "log-" + crypto.randomUUID(),
      userId,
      type: leveledUp ? "level_up" : "quest_completed",
      description: leveledUp ? `Leveled up to Level ${level} "${character.classTitle}"! Completed "${quest.title}" (+${xpEarned} XP, +${goldEarned} Gold)` : `Completed "${quest.title}" (+${xpEarned} XP, +${goldEarned} Gold, +1 ${statGained.toUpperCase()})`,
      xpGained: xpEarned,
      goldChange: goldEarned,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
      newLevel: leveledUp ? level : void 0,
      xpEarned,
      goldEarned,
      streakMultiplier: multiplier,
      log
    };
  }
  uncompleteQuest(userId, questId) {
    const quest = this.data.quests.find((q) => q.id === questId && q.userId === userId);
    if (!quest) throw new Error("Quest not found");
    if (!quest.completed) throw new Error("Quest is not completed");
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    quest.completed = false;
    delete quest.completedAt;
    if (quest.streak && quest.streak > 0) quest.streak -= 1;
    character.gold = Math.max(0, character.gold - quest.goldReward);
    character.currentXp = Math.max(0, character.currentXp - quest.xpReward);
    character.completedCount = Math.max(0, character.completedCount - 1);
    this.updateCharacter(character);
    this.persist();
    return { quest, character };
  }
  computeClassTitle(level, stats) {
    const dominant = Object.keys(stats).reduce(
      (a, b) => stats[a] > stats[b] ? a : b
    );
    const prefix = level >= 10 ? "Archon" : level >= 6 ? "Champion" : level >= 3 ? "Adept" : "Initiate";
    const titles = {
      str: `${prefix} of Might`,
      int: `${prefix} of Arcane Lore`,
      vit: `${prefix} of the Wilds`,
      dis: `${prefix} of Iron Will`,
      cha: `${prefix} of the Realm`
    };
    return titles[dominant] || `${prefix} Adventurer`;
  }
  // --- Shop & Inventory ---
  getShopItems() {
    return this.data.shopItems;
  }
  buyItem(userId, itemId) {
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    const item = this.data.shopItems.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    if (character.inventory.includes(itemId)) {
      throw new Error("Item is already in your inventory");
    }
    if (character.gold < item.cost) {
      throw new Error(`Insufficient gold! You need ${item.cost} G, but have ${character.gold} G.`);
    }
    character.gold -= item.cost;
    character.inventory.push(itemId);
    if (!character.equipped[item.slot]) {
      character.equipped[item.slot] = item.id;
      character.stats[item.bonusStat] += item.bonusValue;
    }
    const log = {
      id: "log-" + crypto.randomUUID(),
      userId,
      type: "item_bought",
      description: `Purchased "${item.name}" for ${item.cost} Gold`,
      goldChange: -item.cost,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.activityLogs.unshift(log);
    this.updateCharacter(character);
    this.persist();
    return { character, item };
  }
  equipItem(userId, itemId) {
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    const item = this.data.shopItems.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    if (!character.inventory.includes(itemId)) {
      throw new Error("You do not own this item");
    }
    const currentEquippedId = character.equipped[item.slot];
    if (currentEquippedId) {
      const currentItem = this.data.shopItems.find((i) => i.id === currentEquippedId);
      if (currentItem) {
        character.stats[currentItem.bonusStat] = Math.max(1, character.stats[currentItem.bonusStat] - currentItem.bonusValue);
      }
    }
    character.equipped[item.slot] = item.id;
    character.stats[item.bonusStat] += item.bonusValue;
    const log = {
      id: "log-" + crypto.randomUUID(),
      userId,
      type: "item_equipped",
      description: `Equipped "${item.name}" (+${item.bonusValue} ${item.bonusStat.toUpperCase()})`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.activityLogs.unshift(log);
    this.updateCharacter(character);
    this.persist();
    return character;
  }
  unequipItem(userId, slot) {
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    const validSlot = slot;
    const currentEquippedId = character.equipped[validSlot];
    if (currentEquippedId) {
      const currentItem = this.data.shopItems.find((i) => i.id === currentEquippedId);
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
  getCustomRewards(userId) {
    return this.data.customRewards.filter((r) => r.userId === userId);
  }
  createCustomReward(userId, title, cost, icon) {
    if (!title || !title.trim()) throw new Error("Reward title is required");
    if (cost <= 0) throw new Error("Reward cost must be at least 1 Gold");
    const newReward = {
      id: "rwd-" + crypto.randomUUID(),
      userId,
      title: title.trim(),
      cost,
      icon: icon || "Gift",
      timesRedeemed: 0
    };
    this.data.customRewards.push(newReward);
    this.persist();
    return newReward;
  }
  redeemCustomReward(userId, rewardId) {
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    const reward = this.data.customRewards.find((r) => r.id === rewardId && r.userId === userId);
    if (!reward) throw new Error("Reward not found");
    if (character.gold < reward.cost) {
      throw new Error(`Insufficient gold! You need ${reward.cost} G, but have ${character.gold} G.`);
    }
    character.gold -= reward.cost;
    reward.timesRedeemed += 1;
    const log = {
      id: "log-" + crypto.randomUUID(),
      userId,
      type: "reward_redeemed",
      description: `Redeemed real-world reward "${reward.title}" (-${reward.cost} Gold)`,
      goldChange: -reward.cost,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.activityLogs.unshift(log);
    this.updateCharacter(character);
    this.persist();
    return { character, reward };
  }
  deleteCustomReward(userId, rewardId) {
    const idx = this.data.customRewards.findIndex((r) => r.id === rewardId && r.userId === userId);
    if (idx === -1) return false;
    this.data.customRewards.splice(idx, 1);
    this.persist();
    return true;
  }
  // --- Logs ---
  getActivityLogs(userId) {
    return this.data.activityLogs.filter((l) => l.userId === userId);
  }
  // --- RPG Stat & Class Methods ---
  allocateStat(userId, attribute) {
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    if (!character.unspentStatPoints || character.unspentStatPoints <= 0) {
      throw new Error("No unspent stat points available");
    }
    character.unspentStatPoints -= 1;
    character.stats[attribute] = (character.stats[attribute] || 10) + 1;
    this.updateCharacter(character);
    this.persist();
    return character;
  }
  setCharacterClass(userId, characterClass) {
    const character = this.getCharacter(userId);
    if (!character) throw new Error("Character not found");
    character.characterClass = characterClass;
    this.updateCharacter(character);
    this.persist();
    return character;
  }
};
var db = new Database();

// server/app.ts
var sessions = /* @__PURE__ */ new Map();
var DEMO_TOKEN = "demo-token-master-adventurer";
sessions.set(DEMO_TOKEN, "demo-user-1");
function generateToken(userId) {
  const token = `lrpg_${crypto2.randomUUID()}_${Date.now()}`;
  sessions.set(token, userId);
  return token;
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const queryToken = req.query.token;
    if (queryToken && sessions.has(queryToken)) {
      req.userId = sessions.get(queryToken);
      return next();
    }
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const userId = sessions.get(token);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Session expired or invalid" });
    return;
  }
  req.userId = userId;
  next();
}
function createApp() {
  const app2 = express();
  app2.use(express.json());
  app2.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  const apiRouter = express.Router();
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", serverless: Boolean(process.env.VERCEL), timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  apiRouter.post("/auth/signup", (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }
      if (password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters long" });
      }
      const { user, character } = db.createUser(username, email, password);
      const token = generateToken(user.id);
      res.status(201).json({ token, user, character });
    } catch (err) {
      res.status(400).json({ error: err.message || "Registration failed" });
    }
  });
  apiRouter.post("/auth/login", (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: "Identifier and password are required" });
      }
      const result = db.verifyCredentials(identifier, password);
      if (!result) {
        return res.status(401).json({ error: "Invalid username/email or password" });
      }
      const token = generateToken(result.user.id);
      res.json({ token, user: result.user, character: result.character });
    } catch (err) {
      res.status(500).json({ error: "Login error" });
    }
  });
  apiRouter.post("/auth/demo", (req, res) => {
    try {
      let demoUser = db.getUserById("demo-user-1");
      let demoChar = db.getCharacter("demo-user-1");
      if (!demoUser || !demoChar) {
        const created = db.createUser("ShadowKnight", "adventurer@liferpg.realm", "adventurer123");
        demoUser = db.getUserById(created.user.id);
        demoChar = created.character;
      }
      const token = DEMO_TOKEN;
      const { passwordHash: _, ...safeUser } = demoUser;
      res.json({ token, user: safeUser, character: demoChar });
    } catch (err) {
      console.error("Demo auth error:", err);
      res.status(500).json({ error: "Failed to initialize demo session" });
    }
  });
  apiRouter.get("/auth/me", authMiddleware, (req, res) => {
    const user = db.getUserById(req.userId);
    const character = db.getCharacter(req.userId);
    if (!user || !character) {
      return res.status(404).json({ error: "User or character not found" });
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, character });
  });
  apiRouter.get("/character", authMiddleware, (req, res) => {
    const character = db.getCharacter(req.userId);
    if (!character) return res.status(404).json({ error: "Character not found" });
    res.json(character);
  });
  apiRouter.post("/character/allocate-stat", authMiddleware, (req, res) => {
    try {
      const { attribute } = req.body;
      if (!attribute) return res.status(400).json({ error: "Attribute required" });
      const character = db.allocateStat(req.userId, attribute);
      res.json({ character });
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to allocate stat point" });
    }
  });
  apiRouter.post("/character/class", authMiddleware, (req, res) => {
    try {
      const { characterClass } = req.body;
      if (!characterClass) return res.status(400).json({ error: "Character class required" });
      const character = db.setCharacterClass(req.userId, characterClass);
      res.json({ character });
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to set character class" });
    }
  });
  apiRouter.get("/quests", authMiddleware, (req, res) => {
    const quests = db.getQuests(req.userId);
    res.json(quests);
  });
  apiRouter.post("/quests", authMiddleware, (req, res) => {
    try {
      const { title, notes, difficulty, attribute, type, dueDate, modifier } = req.body;
      const quest = db.createQuest(req.userId, {
        title,
        notes,
        difficulty: difficulty || "medium",
        attribute: attribute || "str",
        type: type || "daily",
        dueDate,
        modifier
      });
      res.status(201).json(quest);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to create quest" });
    }
  });
  apiRouter.put("/quests/:id", authMiddleware, (req, res) => {
    try {
      const quest = db.updateQuest(req.userId, req.params.id, req.body);
      res.json(quest);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to update quest" });
    }
  });
  apiRouter.delete("/quests/:id", authMiddleware, (req, res) => {
    const success = db.deleteQuest(req.userId, req.params.id);
    if (!success) return res.status(404).json({ error: "Quest not found" });
    res.json({ success: true });
  });
  apiRouter.post("/quests/:id/complete", authMiddleware, (req, res) => {
    try {
      const result = db.completeQuest(req.userId, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to complete quest" });
    }
  });
  apiRouter.post("/quests/:id/uncomplete", authMiddleware, (req, res) => {
    try {
      const result = db.uncompleteQuest(req.userId, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to uncomplete quest" });
    }
  });
  apiRouter.get("/shop/items", (req, res) => {
    res.json(db.getShopItems());
  });
  apiRouter.post("/shop/buy", authMiddleware, (req, res) => {
    try {
      const { itemId } = req.body;
      if (!itemId) return res.status(400).json({ error: "Item ID required" });
      const result = db.buyItem(req.userId, itemId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || "Purchase failed" });
    }
  });
  apiRouter.post("/shop/equip", authMiddleware, (req, res) => {
    try {
      const { itemId } = req.body;
      if (!itemId) return res.status(400).json({ error: "Item ID required" });
      const character = db.equipItem(req.userId, itemId);
      res.json({ character });
    } catch (err) {
      res.status(400).json({ error: err.message || "Equip failed" });
    }
  });
  apiRouter.post("/shop/unequip", authMiddleware, (req, res) => {
    try {
      const { slot } = req.body;
      if (!slot) return res.status(400).json({ error: "Slot required" });
      const character = db.unequipItem(req.userId, slot);
      res.json({ character });
    } catch (err) {
      res.status(400).json({ error: err.message || "Unequip failed" });
    }
  });
  apiRouter.get("/custom-rewards", authMiddleware, (req, res) => {
    res.json(db.getCustomRewards(req.userId));
  });
  apiRouter.post("/custom-rewards", authMiddleware, (req, res) => {
    try {
      const { title, cost, icon } = req.body;
      const reward = db.createCustomReward(req.userId, title, Number(cost), icon);
      res.status(201).json(reward);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to create reward" });
    }
  });
  apiRouter.post("/custom-rewards/:id/redeem", authMiddleware, (req, res) => {
    try {
      const result = db.redeemCustomReward(req.userId, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to redeem reward" });
    }
  });
  apiRouter.delete("/custom-rewards/:id", authMiddleware, (req, res) => {
    const success = db.deleteCustomReward(req.userId, req.params.id);
    if (!success) return res.status(404).json({ error: "Reward not found" });
    res.json({ success: true });
  });
  apiRouter.get("/logs", authMiddleware, (req, res) => {
    res.json(db.getActivityLogs(req.userId));
  });
  app2.use("/api", apiRouter);
  app2.use(apiRouter);
  app2.use((err, req, res, next) => {
    console.error("API Error handler caught:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });
  return app2;
}
var app = createApp();

// api/index.ts
app.default = app;
var index_default = app;
export {
  index_default as default
};
