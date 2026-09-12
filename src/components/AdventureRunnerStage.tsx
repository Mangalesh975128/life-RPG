import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Flame,
  Sparkles,
  Zap,
  Moon,
  Sun,
  CloudRain,
  Compass,
  ArrowUp,
  Volume2,
  VolumeX,
  ShieldAlert,
  Trophy,
  ChevronRight,
  Gamepad2
} from 'lucide-react';
import { soundFX } from '../utils/audio.ts';
import type { Character, Quest } from '../types.ts';

export type RunnerStyle = 'knight_dino' | 'dino_rider' | 'cyber_dino' | 'wizard_dino';
export type WeatherType = 'clear' | 'fireflies' | 'rain' | 'embers';

interface AdventureRunnerStageProps {
  character: Character;
  completedQuestsCount: number;
  totalQuestsCount: number;
  lastQuestCompletedTrigger?: { id: string; title: string; xp: number; gold: number; time: number } | null;
  onCoinCollected?: (amount: number) => void;
  onOpenArcade?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

interface TrailItem {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'gem' | 'obstacle' | 'monster' | 'chest';
  collected: boolean;
  defeated: boolean;
  size: number;
}

export function AdventureRunnerStage({
  character,
  completedQuestsCount,
  totalQuestsCount,
  lastQuestCompletedTrigger,
  onCoinCollected,
  onOpenArcade
}: AdventureRunnerStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Customization states
  const [runnerStyle, setRunnerStyle] = useState<RunnerStyle>('dino_rider');
  const [weather, setWeather] = useState<WeatherType>('fireflies');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'sunset' | 'dawn'>('night');
  const [distanceMeters, setDistanceMeters] = useState<number>(340);
  const [isJumpingState, setIsJumpingState] = useState<boolean>(false);
  const [scoreCoins, setScoreCoins] = useState<number>(0);
  const [isSlashActive, setIsSlashActive] = useState<boolean>(false);
  const [slashMessage, setSlashMessage] = useState<string | null>(null);

  // Internal physics & animation loop refs
  const stateRef = useRef({
    heroY: 0,
    heroVy: 0,
    isGrounded: true,
    runFrame: 0,
    slashTimer: 0,
    parallaxX: 0,
    speed: 2.5,
    items: [] as TrailItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    weatherParticles: [] as { x: number; y: number; speed: number; size: number }[],
    lastSpawn: 0,
    lastTime: 0,
    jumpRequested: false
  });

  // Calculate expedition progress
  const expeditionProgress = totalQuestsCount > 0
    ? Math.min(100, Math.round((completedQuestsCount / totalQuestsCount) * 100))
    : 0;

  // Determine biome based on level
  const getBiome = (level: number) => {
    if (level < 3) return { name: 'Verdant Wilds', bg: '#081412', accent: '#10b981', hill: '#0f291e' };
    if (level < 6) return { name: 'Sunken Amber Ruins', bg: '#171109', accent: '#f59e0b', hill: '#2c1e0e' };
    if (level < 9) return { name: 'Obsidian Magma Forge', bg: '#180a0a', accent: '#ef4444', hill: '#2e1212' };
    return { name: 'Astral Void Citadel', bg: '#0d0a1a', accent: '#8b5cf6', hill: '#1a1333' };
  };

  const biome = getBiome(character.level);

  // Jump handler
  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.isGrounded) {
      s.heroVy = -11.5;
      s.isGrounded = false;
      setIsJumpingState(true);
      soundFX.playJump();

      // Footstep jump dust
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          x: 100 + (Math.random() * 20 - 10),
          y: 180,
          vx: -(Math.random() * 2 + 1),
          vy: -(Math.random() * 2),
          color: '#fbbf24',
          size: Math.random() * 3 + 1,
          alpha: 0.9,
          life: 0,
          maxLife: 20
        });
      }
    }
  }, []);

  // Trigger slash & victory when lastQuestCompletedTrigger updates
  useEffect(() => {
    if (!lastQuestCompletedTrigger) return;
    const s = stateRef.current;
    s.slashTimer = 45; // ~0.75s slash attack state
    setIsSlashActive(true);
    setSlashMessage(`+${lastQuestCompletedTrigger.xp} XP • +${lastQuestCompletedTrigger.gold} G`);
    soundFX.playSlash();

    // Spawn celebratory chest / monster that gets sliced!
    const targetX = 140;
    for (let i = 0; i < 25; i++) {
      s.particles.push({
        x: targetX,
        y: 150 + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        color: i % 2 === 0 ? '#fbbf24' : '#60a5fa',
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: 40
      });
    }

    // Add floating combat text
    s.floatingTexts.push({
      id: Math.random().toString(),
      text: `⚔️ QUEST SLAIN! +${lastQuestCompletedTrigger.xp} XP`,
      x: 120,
      y: 120,
      color: '#fbbf24',
      alpha: 1,
      vy: -1.2
    });

    const timer = setTimeout(() => {
      setIsSlashActive(false);
      setSlashMessage(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [lastQuestCompletedTrigger]);

  // Keyboard shortcut listener: Space or Up arrow to jump
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleJump]);

  // Main 60fps Canvas Game / Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const s = stateRef.current;

    // Adjust speed based on streak
    s.speed = character.streak.multiplier >= 1.3 ? 3.8 : character.streak.multiplier >= 1.15 ? 3.0 : 2.4;

    // Initialize weather particles if empty
    if (s.weatherParticles.length === 0) {
      for (let i = 0; i < 40; i++) {
        s.weatherParticles.push({
          x: Math.random() * 800,
          y: Math.random() * 220,
          speed: Math.random() * 1.5 + 0.5,
          size: Math.random() * 2.5 + 1
        });
      }
    }

    const groundY = 180; // Baseline ground
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      const w = canvas.width;
      const h = canvas.height;

      // Increment distance & animation counter
      s.parallaxX += s.speed;
      s.runFrame += s.speed * 0.08;
      setDistanceMeters(prev => prev + 0.15);

      // --- 1. Background Gradient ---
      let skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (timeOfDay === 'night') {
        skyGrad.addColorStop(0, biome.bg);
        skyGrad.addColorStop(0.7, '#07090e');
        skyGrad.addColorStop(1, '#05060a');
      } else if (timeOfDay === 'sunset') {
        skyGrad.addColorStop(0, '#2d142c');
        skyGrad.addColorStop(0.5, '#511845');
        skyGrad.addColorStop(1, '#1b112c');
      } else {
        // Dawn
        skyGrad.addColorStop(0, '#0f2027');
        skyGrad.addColorStop(0.6, '#203a43');
        skyGrad.addColorStop(1, '#2c5364');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // --- 2. Distant Celestial Body (Moon/Sun) & Stars ---
      ctx.save();
      if (timeOfDay === 'night') {
        // Glowing Crescent / Full Moon
        ctx.shadowColor = biome.accent;
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w - 90, 45, 20, 0, Math.PI * 2);
        ctx.fill();

        // Stars
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 25; i++) {
          const starX = ((i * 47) - (s.parallaxX * 0.05)) % w;
          const actualX = starX < 0 ? starX + w : starX;
          const starY = (i * 19) % 90;
          ctx.fillRect(actualX, starY, (i % 2) + 1, (i % 2) + 1);
        }
      } else if (timeOfDay === 'sunset') {
        // Red Giant Sun
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#fdba74';
        ctx.beginPath();
        ctx.arc(w - 110, 60, 28, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- 3. Parallax Mountain Peaks / Ruins (Far Layer) ---
      ctx.fillStyle = biome.hill;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      const farStep = 90;
      const farOffset = (s.parallaxX * 0.2) % farStep;
      for (let x = -farStep; x < w + farStep; x += farStep) {
        const peakHeight = 45 + Math.sin(x * 0.02) * 25;
        ctx.lineTo(x - farOffset, groundY - peakHeight);
        ctx.lineTo(x + farStep * 0.5 - farOffset, groundY - 15);
      }
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // --- 4. Midground Castle Spire & Ancient Pillars ---
      ctx.fillStyle = 'rgba(18, 24, 38, 0.75)';
      const midStep = 180;
      const midOffset = (s.parallaxX * 0.5) % midStep;
      for (let x = -midStep; x < w + midStep; x += midStep) {
        const pillarX = x - midOffset;
        ctx.fillRect(pillarX + 40, groundY - 55, 16, 55);
        ctx.fillRect(pillarX + 36, groundY - 60, 24, 6);
        // Crystal flame on top
        ctx.fillStyle = biome.accent;
        ctx.fillRect(pillarX + 46, groundY - 65, 4, 5);
        ctx.fillStyle = 'rgba(18, 24, 38, 0.75)';
      }

      // --- 5. Foreground Path & Cobblestone Terrain ---
      // Ground base
      ctx.fillStyle = '#10131d';
      ctx.fillRect(0, groundY, w, h - groundY);

      // Glowing Path Trim Line
      ctx.strokeStyle = biome.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // Fast-moving ground texture / cobblestone blocks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      const groundStep = 30;
      const groundOffset = (s.parallaxX * 1.5) % groundStep;
      for (let x = -groundStep; x < w + groundStep; x += groundStep) {
        ctx.fillRect(x - groundOffset, groundY + 8, 18, 4);
        ctx.fillRect(x - groundOffset + 12, groundY + 22, 14, 3);
      }

      // --- 6. Physics: Hero & Dino Jumping ---
      s.heroVy += 0.55; // Gravity
      s.heroY += s.heroVy;

      if (s.heroY >= 0) {
        s.heroY = 0;
        s.heroVy = 0;
        if (!s.isGrounded) {
          s.isGrounded = true;
          setIsJumpingState(false);
        }
      }

      // Footstep dust generation when grounded
      if (s.isGrounded && Math.random() < 0.25) {
        s.particles.push({
          x: 95,
          y: groundY - 2,
          vx: -(Math.random() * 2 + 1),
          vy: -Math.random() * 1.2,
          color: 'rgba(245, 158, 11, 0.5)',
          size: Math.random() * 2.5 + 1,
          alpha: 0.8,
          life: 0,
          maxLife: 15
        });
      }

      // Decrement slash timer
      if (s.slashTimer > 0) {
        s.slashTimer--;
      }

      // --- 7. Spawn & Update Collectible Orbs & Obstacles ---
      if (time - s.lastSpawn > 1800) {
        s.lastSpawn = time;
        const isAirItem = Math.random() > 0.45;
        s.items.push({
          id: Math.random(),
          x: w + 20,
          y: isAirItem ? groundY - 45 - Math.random() * 25 : groundY - 14,
          type: Math.random() > 0.3 ? 'coin' : 'gem',
          collected: false,
          defeated: false,
          size: 14
        });
      }

      // Update and draw items
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.x -= s.speed * 1.4;

        // Collision check with Hero (hero bounds approx x: 80..130, y: groundY - 50 + heroY .. groundY + heroY)
        const heroLeft = 85;
        const heroRight = 135;
        const heroTop = groundY - 50 + s.heroY;
        const heroBottom = groundY + s.heroY;

        if (
          !item.collected &&
          item.x > heroLeft &&
          item.x < heroRight &&
          item.y > heroTop &&
          item.y < heroBottom + 10
        ) {
          item.collected = true;
          soundFX.playCollect();
          setScoreCoins(c => c + 1);
          if (onCoinCollected) onCoinCollected(1);

          // Add floating text
          s.floatingTexts.push({
            id: Math.random().toString(),
            text: '+1 Gold',
            x: item.x,
            y: item.y - 10,
            color: '#fbbf24',
            alpha: 1,
            vy: -1
          });

          // Burst particles
          for (let p = 0; p < 8; p++) {
            s.particles.push({
              x: item.x,
              y: item.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#fef08a',
              size: 2.5,
              alpha: 1,
              life: 0,
              maxLife: 20
            });
          }
        }

        // Draw item if alive & on screen
        if (!item.collected && item.x > -30) {
          ctx.save();
          if (item.type === 'coin') {
            // Golden Coin with rotating shine
            const bob = Math.sin(time * 0.008 + item.id) * 3;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(item.x, item.y + bob, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#b45309';
            ctx.fillRect(item.x - 1, item.y + bob - 3, 2, 6);
          } else {
            // Mana Gem
            const bob = Math.sin(time * 0.01 + item.id) * 4;
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#93c5fd';
            ctx.beginPath();
            ctx.moveTo(item.x, item.y + bob - 7);
            ctx.lineTo(item.x + 5, item.y + bob);
            ctx.lineTo(item.x, item.y + bob + 7);
            ctx.lineTo(item.x - 5, item.y + bob);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        // Remove off-screen items
        if (item.x < -40 || item.collected) {
          s.items.splice(i, 1);
        }
      }

      // --- 8. RENDER RUNNER: DINO & HERO ---
      const heroBaseX = 100;
      const heroBaseY = groundY + s.heroY;
      const legPhase = Math.sin(s.runFrame);

      ctx.save();

      if (runnerStyle === 'dino_rider') {
        // === MODE 1: HERO RIDING VALIANT RAPTOR DINO ===
        const dinoX = heroBaseX;
        const dinoY = heroBaseY;

        // Dino Body & Tail (Green/Amber prehistoric dino)
        ctx.fillStyle = '#15803d'; // Forest green raptor body
        ctx.beginPath();
        ctx.ellipse(dinoX + 12, dinoY - 22, 20, 13, 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Dino Tail with dynamic waggle
        const tailBob = Math.cos(s.runFrame) * 4;
        ctx.beginPath();
        ctx.moveTo(dinoX - 6, dinoY - 24);
        ctx.quadraticCurveTo(dinoX - 25, dinoY - 28 + tailBob, dinoX - 35, dinoY - 34 + tailBob);
        ctx.lineTo(dinoX - 22, dinoY - 18);
        ctx.closePath();
        ctx.fill();

        // Dino Neck & Big Head (Classic Dino Runner profile!)
        ctx.beginPath();
        ctx.moveTo(dinoX + 22, dinoY - 26);
        ctx.lineTo(dinoX + 30, dinoY - 42); // Neck up
        ctx.lineTo(dinoX + 44, dinoY - 42); // Snout top
        ctx.lineTo(dinoX + 44, dinoY - 32); // Snout front
        ctx.lineTo(dinoX + 32, dinoY - 28); // Jaw
        ctx.lineTo(dinoX + 24, dinoY - 20);
        ctx.closePath();
        ctx.fill();

        // Dino Eye
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(dinoX + 36, dinoY - 39, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(dinoX + 37, dinoY - 38, 1.5, 1.5);

        // Dino Cute Belly accent
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.ellipse(dinoX + 14, dinoY - 17, 12, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dino Running Legs (Alternating gallop)
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Leg 1
        ctx.beginPath();
        ctx.moveTo(dinoX + 8, dinoY - 14);
        ctx.lineTo(dinoX + 10 + legPhase * 8, dinoY - 6);
        ctx.lineTo(dinoX + 14 + legPhase * 11, dinoY);
        ctx.stroke();

        // Leg 2
        ctx.beginPath();
        ctx.moveTo(dinoX + 18, dinoY - 14);
        ctx.lineTo(dinoX + 16 - legPhase * 8, dinoY - 6);
        ctx.lineTo(dinoX + 12 - legPhase * 11, dinoY);
        ctx.stroke();

        // --- HERO RIDER MOUNTED ATOP ---
        const riderX = dinoX + 10;
        const riderY = dinoY - 32;

        // Rider Cape flapping behind
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(riderX - 4, riderY - 14);
        ctx.lineTo(riderX - 18 - Math.sin(s.runFrame) * 4, riderY - 8);
        ctx.lineTo(riderX - 16 - Math.sin(s.runFrame) * 6, riderY - 2);
        ctx.lineTo(riderX - 4, riderY - 4);
        ctx.closePath();
        ctx.fill();

        // Rider Torso / Steel Armor
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(riderX - 5, riderY - 14, 10, 13);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(riderX - 2, riderY - 10, 4, 4); // Golden crest

        // Rider Knight Helmet & Visor
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(riderX, riderY - 19, 7, 0, Math.PI * 2);
        ctx.fill();
        // Visor slit glowing cyan
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(riderX + 1, riderY - 20, 5, 2);

        // Weapon / Sword in hand
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (s.slashTimer > 0) {
          // Slash swing forward!
          ctx.moveTo(riderX + 4, riderY - 8);
          ctx.lineTo(riderX + 28, riderY - 18);
        } else {
          // Resting blade upright
          ctx.moveTo(riderX + 4, riderY - 8);
          ctx.lineTo(riderX + 16, riderY - 24);
        }
        ctx.stroke();
      } else {
        // === MODE 2: HERO RUNNING WITH DINO PET COMPANION ===
        // 1. Dino Pet running slightly ahead or behind
        const petX = heroBaseX + 38;
        const petY = heroBaseY;

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(petX, petY - 12, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mini Dino Head
        ctx.beginPath();
        ctx.arc(petX + 10, petY - 16, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(petX + 11, petY - 18, 2, 2);

        // Mini dino tail
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(petX - 8, petY - 13);
        ctx.lineTo(petX - 16, petY - 18 + Math.sin(s.runFrame * 1.5) * 3);
        ctx.lineTo(petX - 8, petY - 9);
        ctx.closePath();
        ctx.fill();

        // Mini dino bouncy feet
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(petX - 2, petY - 6);
        ctx.lineTo(petX - 2 + legPhase * 5, petY);
        ctx.moveTo(petX + 5, petY - 6);
        ctx.lineTo(petX + 5 - legPhase * 5, petY);
        ctx.stroke();

        // 2. The Adventurer
        // Flapping cape
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(heroBaseX - 6, heroBaseY - 32);
        ctx.lineTo(heroBaseX - 22 - Math.sin(s.runFrame) * 6, heroBaseY - 24);
        ctx.lineTo(heroBaseX - 18 - Math.sin(s.runFrame) * 8, heroBaseY - 12);
        ctx.lineTo(heroBaseX - 4, heroBaseY - 16);
        ctx.closePath();
        ctx.fill();

        // Body
        ctx.fillStyle = '#475569';
        ctx.fillRect(heroBaseX - 6, heroBaseY - 32, 12, 18);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(heroBaseX - 2, heroBaseY - 26, 4, 6);

        // Head / Helmet
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(heroBaseX, heroBaseY - 38, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(heroBaseX + 1, heroBaseY - 39, 6, 2.5);

        // Running Legs
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(heroBaseX - 2, heroBaseY - 14);
        ctx.lineTo(heroBaseX - 2 + legPhase * 10, heroBaseY);
        ctx.moveTo(heroBaseX + 4, heroBaseY - 14);
        ctx.lineTo(heroBaseX + 4 - legPhase * 10, heroBaseY);
        ctx.stroke();

        // Sword
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (s.slashTimer > 0) {
          ctx.moveTo(heroBaseX + 6, heroBaseY - 24);
          ctx.lineTo(heroBaseX + 32, heroBaseY - 28);
        } else {
          ctx.moveTo(heroBaseX + 6, heroBaseY - 22);
          ctx.lineTo(heroBaseX + 16, heroBaseY - 38);
        }
        ctx.stroke();
      }

      // --- 9. Slash Energy Shockwave if attacking ---
      if (s.slashTimer > 0) {
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(heroBaseX + 24, heroBaseY - 25, 28, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();

        // Slashed monster / phantom explosion effect
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('CRITICAL SLASH!', heroBaseX + 45, heroBaseY - 45);
        ctx.restore();
      }

      ctx.restore();

      // --- 10. Weather & Atmospheric Particles ---
      ctx.save();
      if (weather === 'fireflies') {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        s.weatherParticles.forEach(p => {
          p.x -= s.speed * 0.5;
          p.y += Math.sin(time * 0.003 + p.x) * 0.5;
          if (p.x < 0) p.x = w;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (weather === 'rain') {
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
        ctx.lineWidth = 1.5;
        s.weatherParticles.forEach(p => {
          p.x -= s.speed * 1.5 + 2;
          p.y += p.speed * 4 + 4;
          if (p.x < 0) p.x = w;
          if (p.y > groundY) p.y = 0;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 4, p.y + 10);
          ctx.stroke();
        });
      } else if (weather === 'embers') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 8;
        s.weatherParticles.forEach(p => {
          p.x -= s.speed * 0.8 + 1;
          p.y -= 0.8;
          if (p.x < 0) p.x = w;
          if (p.y < 0) p.y = groundY;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
      }
      ctx.restore();

      // --- 11. Burst Particles Update & Draw ---
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;

        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // --- 12. Floating Text System (Combat / Reward Numbers) ---
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;

        ctx.save();
        ctx.font = 'bold 11px Cinzel, monospace, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.alpha <= 0) {
          s.floatingTexts.splice(i, 1);
        }
      }

      // Loop
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [biome, runnerStyle, weather, timeOfDay, character.streak.multiplier, onCoinCollected]);

  // Responsive canvas resize handling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = 200;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-[#080a10] shadow-2xl transition-all select-none"
    >
      {/* Top Overlay Banner: Biome, Odometer, Controls */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Biome Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="text-xs font-bold font-cinzel text-amber-300">
              {biome.name}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              (Lvl {character.level})
            </span>
          </div>

          {/* Odometer Distance */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-neutral-300">
            <span className="text-neutral-500">Expedition:</span>
            <span className="text-white font-bold">{Math.floor(distanceMeters)}m</span>
          </div>

          {/* Streak Boost Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-950/40 border border-orange-500/30 text-[10px] font-bold text-orange-400">
            <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
            <span>{character.streak.multiplier}x Sprint</span>
          </div>
        </div>

        {/* Interactive Customization Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Style Mode Toggle */}
          <button
            type="button"
            onClick={() => setRunnerStyle(s => (s === 'dino_rider' ? 'knight_dino' : 'dino_rider'))}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-neutral-200 font-semibold text-[11px] transition-colors"
            title="Toggle Hero & Dino Mode"
          >
            {runnerStyle === 'dino_rider' ? '🦕 Dino Rider' : '⚔️ Hero & Dino Pet'}
          </button>

          {/* Weather Toggle */}
          <button
            type="button"
            onClick={() =>
              setWeather(w => (w === 'fireflies' ? 'rain' : w === 'rain' ? 'embers' : 'fireflies'))
            }
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-neutral-300 transition-colors"
            title={`Weather: ${weather}`}
          >
            {weather === 'fireflies' ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            ) : weather === 'rain' ? (
              <CloudRain className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-red-400" />
            )}
          </button>

          {/* Time of Day Toggle */}
          <button
            type="button"
            onClick={() =>
              setTimeOfDay(t => (t === 'night' ? 'sunset' : t === 'sunset' ? 'dawn' : 'night'))
            }
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-neutral-300 transition-colors"
            title={`Atmosphere: ${timeOfDay}`}
          >
            {timeOfDay === 'night' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Tiny Arcades Trigger Button */}
          {onOpenArcade && (
            <button
              type="button"
              onClick={onOpenArcade}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/30 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition-all shadow-sm"
              title="Open Tiny Arcade Mini-Games"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Tiny Arcades</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Runner Stage Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleJump}
        className="w-full h-[200px] block cursor-pointer active:brightness-110"
        title="Click or press Space to Jump!"
      />

      {/* Bottom Bar: Quest Milestone Bar & Quick Jump Button */}
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-3 pointer-events-auto">
        {/* Daily Expedition Milestone Bar */}
        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-amber-300 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Expedition:</span>
          </div>

          <div className="flex-1 relative h-2.5 bg-black/60 rounded-full border border-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-700 rounded-full"
              style={{ width: `${expeditionProgress}%` }}
            />
          </div>

          <span className="text-[11px] font-mono font-bold text-neutral-300 shrink-0">
            {completedQuestsCount}/{totalQuestsCount} Quests ({expeditionProgress}%)
          </span>
        </div>

        {/* Interactive Jump Button (Great for mobile & mouse users!) */}
        <button
          type="button"
          onClick={handleJump}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-cinzel shadow-lg shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Leap [Space]</span>
        </button>
      </div>

      {/* Slash Event Announcement Overlay */}
      {isSlashActive && slashMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 animate-bounce">
          <div className="px-4 py-2 rounded-2xl bg-black/80 border-2 border-amber-400 text-amber-300 font-cinzel font-black text-sm shadow-2xl flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>{slashMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
