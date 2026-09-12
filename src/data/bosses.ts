import type { BossEncounter, AttributeKey } from '../types.ts';

export const INITIAL_BOSSES: BossEncounter[] = [
  {
    id: 'boss-procrastination-wyrm',
    name: 'Ignis, the Procrastination Wyrm',
    title: 'Draconic Devourer of Hours',
    subtitle: 'Tier I World Threat',
    lore: 'A subterranean dragon of smoldering embers that lulls ambitious adventurers into a sleepy stupor of "I\'ll do it tomorrow". It breathes smoke that obscures priorities.',
    avatar: '🐉',
    maxHp: 650,
    currentHp: 650,
    level: 3,
    element: 'fire',
    weakness: 'dis', // Discipline quells procrastination
    rewardGold: 180,
    rewardXp: 450,
    badgeTitle: 'Wyrmbane of Willpower',
    enrageThreshold: 30,
    attackPower: 18
  },
  {
    id: 'boss-distraction-gorgon',
    name: 'Medusa of Digital Distraction',
    title: 'The Notification Hydra',
    subtitle: 'Tier II World Threat',
    lore: 'Her serpentine hair consists of countless endless scroll feeds, red notification pings, and short video clips. A single glance shatters four hours of deep flow.',
    avatar: '🐍',
    maxHp: 1100,
    currentHp: 1100,
    level: 6,
    element: 'shadow',
    weakness: 'int', // Intellect pierces illusions
    rewardGold: 360,
    rewardXp: 850,
    badgeTitle: 'Mindwarden of Deep Work',
    enrageThreshold: 25,
    attackPower: 28
  },
  {
    id: 'boss-burnout-titan',
    name: 'The Obsidian Titan of Burnout',
    title: 'Colossus of Neglected Rest',
    subtitle: 'Tier III Calamity',
    lore: 'An ancient monolithic giant forged when mortal champions ignore sleep, nutrition, and recovery. His ground-stomp inflicts heavy mental fatigue and paralysis.',
    avatar: '🗿',
    maxHp: 1800,
    currentHp: 1800,
    level: 10,
    element: 'void',
    weakness: 'vit', // Vitality & sleep crumble this titan
    rewardGold: 700,
    rewardXp: 1600,
    badgeTitle: 'Titan Crusher of Vitality',
    enrageThreshold: 20,
    attackPower: 45
  },
  {
    id: 'boss-imposter-spectre',
    name: 'Phantasm of Imposter Syndrome',
    title: 'The Mirror of False Doubt',
    subtitle: 'Tier IV Abyssal Wraith',
    lore: 'A shadowy wraith that whispers that your achievements are mere luck and that exposure is imminent. Pierced through by unwavering Strength and Charisma.',
    avatar: '👤',
    maxHp: 2600,
    currentHp: 2600,
    level: 15,
    element: 'chaos',
    weakness: 'cha', // Charisma & confidence dispel doubt
    rewardGold: 1200,
    rewardXp: 3000,
    badgeTitle: 'Sovereign of Unshakable Faith',
    enrageThreshold: 20,
    attackPower: 65
  },
  {
    id: 'boss-chaos-leviathan',
    name: 'Leviathan of Chronic Disorganization',
    title: 'The Primordial Chaos Maalstrom',
    subtitle: 'Apex Mythic Behemoth',
    lore: 'The ultimate boss of untracked debts, lost papers, missed meetings, and messy desktops. Conquering it brings absolute zen mastery to your daily life.',
    avatar: '🐙',
    maxHp: 3800,
    currentHp: 3800,
    level: 20,
    element: 'void',
    weakness: 'str',
    rewardGold: 2500,
    rewardXp: 6000,
    badgeTitle: 'Master of Absolute Order',
    enrageThreshold: 15,
    attackPower: 90
  }
];

export interface ClassArchetype {
  key: 'warrior' | 'mage' | 'rogue' | 'paladin';
  name: string;
  role: string;
  icon: string;
  color: string;
  primaryStat: AttributeKey;
  perkTitle: string;
  perkDescription: string;
  skillName: string;
  skillManaCost: number;
  skillDescription: string;
}

export const CLASS_ARCHETYPES: Record<string, ClassArchetype> = {
  warrior: {
    key: 'warrior',
    name: 'Iron Berserker',
    role: 'Physical Titan & Relentless Executioner',
    icon: '⚔️',
    color: '#ef4444',
    primaryStat: 'str',
    perkTitle: 'Brutal Cleave',
    perkDescription: '+25% ATK damage to bosses; +15% Gold on Strength & physical quests.',
    skillName: 'Whirlwind Strike',
    skillManaCost: 25,
    skillDescription: 'Deals 2.5x Attack Damage to the current Boss immediately!'
  },
  mage: {
    key: 'mage',
    name: 'Arcane Chronomancer',
    role: 'Intellect Savant & Deep Worker',
    icon: '🧙‍♂️',
    color: '#3b82f6',
    primaryStat: 'int',
    perkTitle: 'Mind Over Matter',
    perkDescription: '+25% XP on Intellect, coding, and study quests; +20 Max Mana.',
    skillName: 'Pyroclastic Burst',
    skillManaCost: 30,
    skillDescription: 'Channels raw mental energy for 3.0x Spell Damage with weakness burn.'
  },
  rogue: {
    key: 'rogue',
    name: 'Shadow Infiltrator',
    role: 'Critical Strike & High Speed Finisher',
    icon: '🗡️',
    color: '#eab308',
    primaryStat: 'dis',
    perkTitle: 'Lethal Precision',
    perkDescription: '+20% Critical Strike chance; 35% chance to double gold loot on quest claim.',
    skillName: 'Assassinate',
    skillManaCost: 20,
    skillDescription: 'Strikes the Boss for an automatic Critical Strike (2x to 4x damage)!'
  },
  paladin: {
    key: 'paladin',
    name: 'Solar Templar',
    role: 'Vitality Guardian & Unbreakable Shield',
    icon: '🛡️',
    color: '#10b981',
    primaryStat: 'vit',
    perkTitle: 'Aegis of Resilience',
    perkDescription: '+35% Max Health; protects daily streak from accidental break once per week.',
    skillName: 'Holy Smite & Heal',
    skillManaCost: 25,
    skillDescription: 'Deals 1.8x Divine Damage and restores 40 HP to your character.'
  }
};
