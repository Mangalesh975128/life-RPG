import type { AttributeKey } from '../types.ts';

export interface AttributeMeta {
  key: AttributeKey;
  name: string;
  fullName: string;
  description: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
  textBadge: string;
  glow: string;
}

export const ATTRIBUTES: Record<AttributeKey, AttributeMeta> = {
  str: {
    key: 'str',
    name: 'STR',
    fullName: 'Strength',
    description: 'Physical prowess, gym workouts, athletic endurance, and bodily health.',
    color: '#ef4444',
    bgBadge: 'bg-red-950/40',
    borderBadge: 'border-red-500/40',
    textBadge: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.25)'
  },
  int: {
    key: 'int',
    name: 'INT',
    fullName: 'Intellect',
    description: 'Deep coding, reading, system architecture, research, and cognitive clarity.',
    color: '#3b82f6',
    bgBadge: 'bg-blue-950/40',
    borderBadge: 'border-blue-500/40',
    textBadge: 'text-blue-400',
    glow: 'rgba(59, 130, 246, 0.25)'
  },
  vit: {
    key: 'vit',
    name: 'VIT',
    fullName: 'Vitality',
    description: 'Sleep hygiene, water hydration, clean nutrition, recovery, and immune stamina.',
    color: '#10b981',
    bgBadge: 'bg-emerald-950/40',
    borderBadge: 'border-emerald-500/40',
    textBadge: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.25)'
  },
  dis: {
    key: 'dis',
    name: 'DIS',
    fullName: 'Discipline',
    description: 'Relentless focus, morning routines, resisting distractions, and habit streaks.',
    color: '#f59e0b',
    bgBadge: 'bg-amber-950/40',
    borderBadge: 'border-amber-500/40',
    textBadge: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  cha: {
    key: 'cha',
    name: 'CHA',
    fullName: 'Charisma',
    description: 'Social networking, public speaking, collaboration, and genuine leadership.',
    color: '#a855f7',
    bgBadge: 'bg-purple-950/40',
    borderBadge: 'border-purple-500/40',
    textBadge: 'text-purple-400',
    glow: 'rgba(168, 85, 247, 0.25)'
  }
};
