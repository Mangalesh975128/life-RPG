#  Life RPG — Real-World Mastery Progression

A full-stack Life RPG web application translating mundane daily routines, tasks, and habits into an engaging virtual progression system featuring non-linear leveling, attribute growth, streak multipliers, equipment forging, and custom real-world reward redemption.

---

##  Core Features & Architecture

### 1. Robust Full-Stack Architecture & Database Persistence
- **Backend**: Node.js + Express API server (`server.ts`) operating on port 3000.
- **Persistent Database**: Synchronous file-backed persistent database (`/data/db.json`) maintaining users, character attributes, equipment inventories, quests, and historical audit logs. **Zero reliance on transient client-only storage.**
- **User Authentication**: Secure credentials verification, multi-tenant data isolation (each adventurer only accesses their own contracts and gear), and instant **Demo Hero Mode** for frictionless evaluation.

### 2. Server-Authoritative Anti-Cheat Progression Engine
- Progression math cannot be manipulated from the browser console.
- **Non-Linear Leveling Formula**:
  $$\text{XP Required for Level } L = \lfloor 100 \times L^{1.45} \rfloor$$
  *Level 1 $\rightarrow$ 100 XP, Level 2 $\rightarrow$ 273 XP, Level 3 $\rightarrow$ 492 XP, Level 5 $\rightarrow$ 1,032 XP.*
- **Character Attributes**:
  - **STR (Strength)**: Fitness, athletic lifting, physical health.
  - **INT (Intellect)**: Deep coding sprints, research, books, system architecture.
  - **VIT (Vitality)**: Sleep hygiene, water hydration, nutrition.
  - **DIS (Discipline)**: Focus routines, resisting digital distractions, consistency.
  - **CHA (Charisma)**: Team leadership, community collaboration, networking.
- **Daily Streak Combos**:
  - Days 1–2: $1.0\times$ base multiplier
  - Days 3–6: $1.15\times$ multiplier
  - Days 7+: $1.30\times$ multiplier ("On Fire" aura)

### 3. Grand Bazaar & Economy
- **Virtual Armory**: Forge and equip weapons, armor, helmets, and relics granting passive stat boosts and percentage XP amplifiers.
- **Real-World Guilt-Free Vouchers**: Custom user-defined rewards (e.g. *1 Hour Video Games*, *Artisan Espresso*, *Movie Night*) redeemable exclusively through earned Gold bounty.

### 4. Tactile UX & Micro-Interactions
- Procedural **Web Audio API** sound engine (quest complete chords, level up fanfare, coin jingles, equip clicks).
- Celebratory particle fireworks via `canvas-confetti`.
- Optimistic UI transitions with automatic rollback on error.
- Full keyboard accessibility (`N` for new quest, `1-3` tab navigation, `M` to toggle audio, `?` for shortcuts).

---

##  Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation & Execution
```bash
# 1. Clone repository
git clone <repo-url>
cd life-rpg

# 2. Install dependencies
npm install

# 3. Launch full-stack development server (Express backend + Vite)
npm run dev

# Application will be accessible at http://localhost:3000
```

### Production Build & Launch
```bash
npm run build
npm start
```

---

