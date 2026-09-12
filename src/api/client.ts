import type {
  Character,
  Quest,
  ShopItem,
  CustomReward,
  ActivityLog,
  CompletionResult,
  AuthResponse,
  AttributeKey,
  QuestDifficulty,
  QuestType,
  QuestModifier,
  CharacterClassKey
} from '../types.ts';
import { DEFAULT_SHOP_ITEMS, DEFAULT_STARTER_QUESTS } from '../data/defaultData.ts';

const TOKEN_KEY = 'life_rpg_auth_token';
const OFFLINE_CHAR_KEY = 'life_rpg_local_character';
const OFFLINE_QUESTS_KEY = 'life_rpg_local_quests';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Fallback initial data if server/serverless is starting or unreachable
function getFallbackCharacter(): Character {
  try {
    const saved = localStorage.getItem(OFFLINE_CHAR_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore
  }
  const initial: Character = {
    userId: 'demo-user-1',
    name: 'ShadowKnight',
    classTitle: 'Novice Adventurer',
    avatarIcon: 'Crown',
    level: 3,
    currentXp: 140,
    xpNeeded: 250,
    gold: 240,
    streak: {
      current: 4,
      highest: 7,
      lastActiveDate: new Date().toISOString().split('T')[0],
      multiplier: 1.2
    },
    stats: {
      str: 16,
      int: 14,
      vit: 15,
      dis: 12,
      cha: 11
    },
    inventory: ['wpn-1', 'arm-1'],
    equipped: {
      weapon: 'wpn-1',
      armor: 'arm-1'
    },
    unspentStatPoints: 2,
    characterClass: 'warrior',
    bossesDefeated: 0,
    completedCount: 12
  };
  try {
    localStorage.setItem(OFFLINE_CHAR_KEY, JSON.stringify(initial));
  } catch {
    // Ignore
  }
  return initial;
}

function saveLocalCharacter(char: Character) {
  try {
    localStorage.setItem(OFFLINE_CHAR_KEY, JSON.stringify(char));
  } catch {
    // Ignore
  }
}

function getFallbackQuests(): Quest[] {
  try {
    const saved = localStorage.getItem(OFFLINE_QUESTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore
  }
  return DEFAULT_STARTER_QUESTS;
}

function saveLocalQuests(quests: Quest[]) {
  try {
    localStorage.setItem(OFFLINE_QUESTS_KEY, JSON.stringify(quests));
  } catch {
    // Ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // If response was not JSON (e.g., HTML error page from Vercel)
      if (response.status === 404) {
        errorMsg = 'API endpoint not found (404)';
      } else if (response.status >= 500) {
        errorMsg = 'Life RPG server is warming up or temporarily unreachable. Retrying with local game session...';
      }
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async loginDemo(): Promise<AuthResponse> {
    try {
      const res = await request<AuthResponse>('/api/auth/demo', { method: 'POST' });
      setStoredToken(res.token);
      saveLocalCharacter(res.character);
      return res;
    } catch (err) {
      console.warn('API /api/auth/demo unavailable, activating resilient offline session:', err);
      const fallbackToken = 'demo-token-master-adventurer';
      setStoredToken(fallbackToken);
      const character = getFallbackCharacter();
      return {
        token: fallbackToken,
        user: {
          id: 'demo-user-1',
          username: 'ShadowKnight',
          email: 'adventurer@liferpg.realm',
          createdAt: new Date().toISOString()
        },
        character
      };
    }
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(res.token);
    saveLocalCharacter(res.character);
    return res;
  },

  async signup(username: string, email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setStoredToken(res.token);
    saveLocalCharacter(res.character);
    return res;
  },

  async getMe(): Promise<{ user: any; character: Character }> {
    try {
      const res = await request<{ user: any; character: Character }>('/api/auth/me');
      saveLocalCharacter(res.character);
      return res;
    } catch (err) {
      console.warn('getMe network error, returning cached session:', err);
      const character = getFallbackCharacter();
      return {
        user: {
          id: 'demo-user-1',
          username: character.name,
          email: 'adventurer@liferpg.realm',
          createdAt: new Date().toISOString()
        },
        character
      };
    }
  },

  // Character
  async getCharacter(): Promise<Character> {
    try {
      const char = await request<Character>('/api/character');
      saveLocalCharacter(char);
      return char;
    } catch {
      return getFallbackCharacter();
    }
  },

  async allocateStat(attribute: AttributeKey): Promise<{ character: Character }> {
    try {
      const res = await request<{ character: Character }>('/api/character/allocate-stat', {
        method: 'POST',
        body: JSON.stringify({ attribute }),
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      // Local calculation fallback
      const char = getFallbackCharacter();
      if ((char.unspentStatPoints || 0) > 0) {
        char.unspentStatPoints = (char.unspentStatPoints || 0) - 1;
        char.stats[attribute] = (char.stats[attribute] || 10) + 1;
        saveLocalCharacter(char);
      }
      return { character: char };
    }
  },

  async setCharacterClass(characterClass: CharacterClassKey): Promise<{ character: Character }> {
    try {
      const res = await request<{ character: Character }>('/api/character/class', {
        method: 'POST',
        body: JSON.stringify({ characterClass }),
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      const char = getFallbackCharacter();
      char.characterClass = characterClass;
      saveLocalCharacter(char);
      return { character: char };
    }
  },

  // Quests CRUD
  async getQuests(): Promise<Quest[]> {
    try {
      const quests = await request<Quest[]>('/api/quests');
      saveLocalQuests(quests);
      return quests;
    } catch {
      return getFallbackQuests();
    }
  },

  async createQuest(data: {
    title: string;
    notes?: string;
    difficulty: QuestDifficulty;
    attribute: AttributeKey;
    type: QuestType;
    dueDate?: string;
    modifier?: QuestModifier;
  }): Promise<Quest> {
    try {
      const quest = await request<Quest>('/api/quests', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const current = getFallbackQuests();
      saveLocalQuests([quest, ...current]);
      return quest;
    } catch {
      // Fallback local quest creation
      const localQuest: Quest = {
        id: `local-quest-${Date.now()}`,
        userId: 'demo-user-1',
        title: data.title,
        notes: data.notes,
        difficulty: data.difficulty,
        attribute: data.attribute,
        type: data.type,
        dueDate: data.dueDate,
        modifier: data.modifier,
        xpReward: 50,
        goldReward: 25,
        completed: false,
        streak: 0,
        createdAt: new Date().toISOString()
      };
      const current = getFallbackQuests();
      saveLocalQuests([localQuest, ...current]);
      return localQuest;
    }
  },

  async updateQuest(id: string, updates: Partial<Quest>): Promise<Quest> {
    try {
      return await request<Quest>(`/api/quests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch {
      const current = getFallbackQuests();
      const updated = current.map(q => (q.id === id ? { ...q, ...updates } : q));
      saveLocalQuests(updated);
      return updated.find(q => q.id === id) as Quest;
    }
  },

  async deleteQuest(id: string): Promise<{ success: boolean }> {
    try {
      return await request(`/api/quests/${id}`, {
        method: 'DELETE',
      });
    } catch {
      const current = getFallbackQuests();
      saveLocalQuests(current.filter(q => q.id !== id));
      return { success: true };
    }
  },

  // RPG Progression Engine: Complete Quest
  async completeQuest(id: string): Promise<CompletionResult> {
    try {
      const res = await request<CompletionResult>(`/api/quests/${id}/complete`, {
        method: 'POST',
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      // Local offline completion calculation
      const currentQuests = getFallbackQuests();
      const quest = currentQuests.find(q => q.id === id);
      const character = getFallbackCharacter();
      if (!quest) throw new Error('Quest not found');

      quest.completed = true;
      quest.streak = (quest.streak || 0) + 1;
      character.completedCount = (character.completedCount || 0) + 1;
      character.gold += quest.goldReward;
      character.currentXp += quest.xpReward;
      character.stats[quest.attribute] = (character.stats[quest.attribute] || 10) + 1;

      let leveledUp = false;
      let newLevel = character.level;
      if (character.currentXp >= character.xpNeeded) {
        character.level += 1;
        character.currentXp -= character.xpNeeded;
        character.xpNeeded = Math.round(character.xpNeeded * 1.35);
        character.unspentStatPoints = (character.unspentStatPoints || 0) + 3;
        leveledUp = true;
        newLevel = character.level;
      }

      saveLocalCharacter(character);
      saveLocalQuests(currentQuests);

      const log: ActivityLog = {
        id: `log-${Date.now()}`,
        userId: 'demo-user-1',
        type: 'quest_completed',
        description: `Completed "${quest.title}" (+${quest.xpReward} XP, +${quest.goldReward} Gold)`,
        xpGained: quest.xpReward,
        goldChange: quest.goldReward,
        timestamp: new Date().toISOString()
      };

      return {
        quest,
        character,
        leveledUp,
        newLevel,
        xpEarned: quest.xpReward,
        goldEarned: quest.goldReward,
        streakMultiplier: character.streak.multiplier || 1.0,
        log
      };
    }
  },

  async uncompleteQuest(id: string): Promise<{ quest: Quest; character: Character }> {
    try {
      const res = await request<{ quest: Quest; character: Character }>(`/api/quests/${id}/uncomplete`, {
        method: 'POST',
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      const currentQuests = getFallbackQuests();
      const quest = currentQuests.find(q => q.id === id);
      const character = getFallbackCharacter();
      if (quest) {
        quest.completed = false;
        saveLocalQuests(currentQuests);
      }
      return { quest: quest!, character };
    }
  },

  // Shop & Gear
  async getShopItems(): Promise<ShopItem[]> {
    try {
      return await request<ShopItem[]>('/api/shop/items');
    } catch {
      return DEFAULT_SHOP_ITEMS;
    }
  },

  async buyItem(itemId: string): Promise<{ character: Character; item: ShopItem }> {
    try {
      const res = await request<{ character: Character; item: ShopItem }>('/api/shop/buy', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      const character = getFallbackCharacter();
      const item = DEFAULT_SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');
      if (character.gold < item.cost) throw new Error('Not enough gold');
      character.gold -= item.cost;
      character.equipped[item.slot] = item.id;
      saveLocalCharacter(character);
      return { character, item };
    }
  },

  async equipItem(itemId: string): Promise<{ character: Character }> {
    try {
      const res = await request<{ character: Character }>('/api/shop/equip', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      const character = getFallbackCharacter();
      const item = DEFAULT_SHOP_ITEMS.find(i => i.id === itemId);
      if (item) {
        character.equipped[item.slot] = item.id;
        saveLocalCharacter(character);
      }
      return { character };
    }
  },

  async unequipItem(slot: string): Promise<{ character: Character }> {
    try {
      const res = await request<{ character: Character }>('/api/shop/unequip', {
        method: 'POST',
        body: JSON.stringify({ slot }),
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      const character = getFallbackCharacter();
      (character.equipped as any)[slot] = undefined;
      saveLocalCharacter(character);
      return { character };
    }
  },

  // Custom Real-World Rewards
  async getCustomRewards(): Promise<CustomReward[]> {
    try {
      return await request('/api/custom-rewards');
    } catch {
      return [];
    }
  },

  async createCustomReward(title: string, cost: number, icon: string): Promise<CustomReward> {
    try {
      return await request('/api/custom-rewards', {
        method: 'POST',
        body: JSON.stringify({ title, cost, icon }),
      });
    } catch {
      return {
        id: `reward-${Date.now()}`,
        userId: 'demo-user-1',
        title,
        cost,
        icon,
        timesRedeemed: 0
      };
    }
  },

  async redeemCustomReward(id: string): Promise<{ character: Character; reward: CustomReward }> {
    try {
      const res = await request<{ character: Character; reward: CustomReward }>(`/api/custom-rewards/${id}/redeem`, {
        method: 'POST',
      });
      saveLocalCharacter(res.character);
      return res;
    } catch {
      const character = getFallbackCharacter();
      return {
        character,
        reward: {
          id,
          userId: 'demo-user-1',
          title: 'Reward Redeemed',
          cost: 20,
          icon: 'Coffee',
          timesRedeemed: 1
        }
      };
    }
  },

  async deleteCustomReward(id: string): Promise<{ success: boolean }> {
    try {
      return await request(`/api/custom-rewards/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true };
    }
  },

  // Logs
  async getLogs(): Promise<ActivityLog[]> {
    try {
      return await request('/api/logs');
    } catch {
      return [];
    }
  },
};
