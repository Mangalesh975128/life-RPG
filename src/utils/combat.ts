import type { Character, ShopItem, BossEncounter, AttributeKey, Quest } from '../types.ts';

export interface DerivedCombatStats {
  maxHp: number;
  maxMp: number;
  attackPower: number;
  defense: number;
  critChance: number;
}

export function calculateDerivedCombatStats(
  character: Character,
  shopItems: ShopItem[]
): DerivedCombatStats {
  const stats = character.stats || { str: 10, int: 10, vit: 10, dis: 10, cha: 10 };
  const equippedItemIds = Object.values(character.equipped || {}).filter(Boolean) as string[];
  const equipped = shopItems.filter(i => equippedItemIds.includes(i.id));

  let weaponBonus = 0;
  let armorBonus = 0;
  let helmetBonus = 0;
  let accessoryBonus = 0;

  for (const item of equipped) {
    if (item.slot === 'weapon') weaponBonus += item.bonusValue;
    if (item.slot === 'armor') armorBonus += item.bonusValue;
    if (item.slot === 'helmet') helmetBonus += item.bonusValue;
    if (item.slot === 'accessory') accessoryBonus += item.bonusValue;
  }

  const isWarrior = character.characterClass === 'warrior';
  const isMage = character.characterClass === 'mage';
  const isRogue = character.characterClass === 'rogue';
  const isPaladin = character.characterClass === 'paladin';

  const maxHp = 120 + (stats.vit * 8) + (armorBonus * 12) + (isPaladin ? 45 : 0);
  const maxMp = 60 + (stats.int * 6) + (accessoryBonus * 8) + (isMage ? 30 : 0);

  const attackPower = 25 + Math.floor(stats.str * 1.8) + Math.floor(stats.int * 1.2) + (weaponBonus * 4) + (isWarrior ? 20 : 0);
  const defense = 12 + Math.floor(stats.vit * 1.4) + (armorBonus * 3);
  const critChance = Math.min(65, 5 + Math.floor(stats.dis * 0.9) + (helmetBonus * 1.5) + (isRogue ? 20 : 0));

  return {
    maxHp,
    maxMp,
    attackPower,
    defense,
    critChance
  };
}

export interface QuestStrikeResult {
  damage: number;
  isCrit: boolean;
  isWeaknessExploit: boolean;
  bonusBossBane: boolean;
}

export function computeQuestBossDamage(
  quest: Quest,
  character: Character,
  boss: BossEncounter,
  combatStats: DerivedCombatStats
): QuestStrikeResult {
  const baseDmg = combatStats.attackPower + (character.level * 8);

  // Difficulty multiplier
  const diffMultiplier: Record<string, number> = {
    easy: 0.8,
    medium: 1.1,
    hard: 1.6,
    epic: 2.4
  };
  let totalDmg = baseDmg * (diffMultiplier[quest.difficulty] || 1.0);

  // Weakness check
  const isWeaknessExploit = quest.attribute === boss.weakness;
  if (isWeaknessExploit) {
    totalDmg *= 1.6;
  }

  // Boss bane modifier check
  const bonusBossBane = quest.modifier === 'boss_bane';
  if (bonusBossBane) {
    totalDmg += 220;
  }

  // Critical strike roll
  const roll = Math.random() * 100;
  const isCrit = roll <= combatStats.critChance;
  if (isCrit) {
    totalDmg *= 1.8;
  }

  return {
    damage: Math.round(totalDmg),
    isCrit,
    isWeaknessExploit,
    bonusBossBane
  };
}
