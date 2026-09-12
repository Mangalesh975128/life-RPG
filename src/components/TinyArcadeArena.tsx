import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Gamepad2,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  ArrowUp,
  Volume2,
  VolumeX,
  Target,
  Maximize2,
  Coins,
  Medal,
  Award
} from 'lucide-react';
import { soundFX } from '../utils/audio.ts';
import type { Character } from '../types.ts';

export type MiniGameType = 'dino_jump' | 'flappy_dragon' | 'focus_slasher' | 'rune_clicker';

interface TinyArcadeArenaProps {
  character: Character;
  onEarnGold?: (amount: number) => void;
  onEarnXP?: (amount: number) => void;
  onClose?: () => void;
}

export function TinyArcadeArena({ character, onEarnGold, onEarnXP }: TinyArcadeArenaProps) {
  const [selectedGame, setSelectedGame] = useState<MiniGameType>('dino_jump');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<Record<MiniGameType, number>>({
    dino_jump: 120,
    flappy_dragon: 8,
    focus_slasher: 45,
    rune_clicker: 80
  });
  const [goldEarnedThisRound, setGoldEarnedThisRound] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game internal state ref
  const engineRef = useRef({
    score: 0,
    gameLoopId: 0,
    lastTime: 0,
    // Dino jump state
    dino: { x: 50, y: 150, vy: 0, isGrounded: true, width: 32, height: 32, ducking: false },
    dinoCacti: [] as { x: number; y: number; w: number; h: number; type: 'single' | 'double' | 'pterodactyl' }[],
    // Flappy Dragon state
    dragon: { x: 60, y: 100, vy: 0, radius: 14, wingPhase: 0 },
    pipes: [] as { x: number; topH: number; bottomY: number; w: number; passed: boolean }[],
    // Focus Slasher state (Slice falling evil distraction orbs)
    orbs: [] as { id: number; x: number; y: number; vy: number; radius: number; color: string; label: string; sliced: boolean }[],
    // Rune clicker state
    runes: [] as { id: number; x: number; y: number; timer: number; maxTimer: number; active: boolean; symbol: string; xp: number }[],
    // Particles & combat text
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; size: number }[],
    floatingTexts: [] as { text: string; x: number; y: number; vy: number; alpha: number; color: string }[],
    speed: 3
  });

  // Start chosen game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setGoldEarnedThisRound(0);

    const eng = engineRef.current;
    eng.score = 0;
    eng.particles = [];
    eng.floatingTexts = [];
    eng.lastTime = performance.now();

    if (selectedGame === 'dino_jump') {
      eng.dino = { x: 50, y: 150, vy: 0, isGrounded: true, width: 32, height: 32, ducking: false };
      eng.dinoCacti = [
        { x: 380, y: 154, w: 18, h: 28, type: 'single' },
        { x: 580, y: 150, w: 28, h: 32, type: 'double' }
      ];
      eng.speed = 4;
    } else if (selectedGame === 'flappy_dragon') {
      eng.dragon = { x: 60, y: 90, vy: 0, radius: 14, wingPhase: 0 };
      eng.pipes = [
        { x: 300, topH: 55, bottomY: 125, w: 36, passed: false },
        { x: 480, topH: 70, bottomY: 140, w: 36, passed: false }
      ];
    } else if (selectedGame === 'focus_slasher') {
      eng.orbs = [];
      eng.speed = 1.8;
    } else if (selectedGame === 'rune_clicker') {
      eng.runes = [];
    }
  }, [selectedGame]);

  // Primary player interaction: Tap / Space / Click
  const handleAction = useCallback(() => {
    if (!isPlaying) {
      startGame();
      return;
    }
    if (gameOver) {
      startGame();
      return;
    }

    const eng = engineRef.current;

    if (selectedGame === 'dino_jump') {
      if (eng.dino.isGrounded) {
        eng.dino.vy = -10.5;
        eng.dino.isGrounded = false;
        soundFX.playJump();
        // Spawn dust
        for (let i = 0; i < 5; i++) {
          eng.particles.push({
            x: eng.dino.x + 10,
            y: 180,
            vx: -Math.random() * 2 - 1,
            vy: -Math.random() * 1.5,
            color: '#fbbf24',
            life: 0,
            maxLife: 15,
            size: 2
          });
        }
      }
    } else if (selectedGame === 'flappy_dragon') {
      eng.dragon.vy = -6.2;
      soundFX.playFlap();
    }
  }, [isPlaying, gameOver, selectedGame, startGame]);

  // Handle canvas click / slice
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (!isPlaying || gameOver) {
      startGame();
      return;
    }

    const eng = engineRef.current;

    if (selectedGame === 'focus_slasher') {
      // Check if user clicked/sliced an active distraction orb
      let hit = false;
      for (const orb of eng.orbs) {
        if (!orb.sliced) {
          const dist = Math.hypot(orb.x - clickX, orb.y - clickY);
          if (dist < orb.radius + 15) {
            orb.sliced = true;
            hit = true;
            soundFX.playSlash();

            eng.score += 10;
            setScore(eng.score);

            // Burst particles
            for (let i = 0; i < 12; i++) {
              eng.particles.push({
                x: orb.x,
                y: orb.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: orb.color,
                life: 0,
                maxLife: 20,
                size: 3
              });
            }

            // Floating text
            eng.floatingTexts.push({
              text: '+10 SLAIN!',
              x: orb.x,
              y: orb.y - 10,
              vy: -1.2,
              alpha: 1,
              color: '#fef08a'
            });

            break;
          }
        }
      }

      if (!hit) {
        handleAction();
      }
    } else if (selectedGame === 'rune_clicker') {
      // Check rune click
      for (let i = eng.runes.length - 1; i >= 0; i--) {
        const rune = eng.runes[i];
        if (rune.active) {
          const dist = Math.hypot(rune.x - clickX, rune.y - clickY);
          if (dist < 25) {
            rune.active = false;
            soundFX.playScorePoint();
            eng.score += rune.xp;
            setScore(eng.score);

            eng.floatingTexts.push({
              text: `+${rune.xp} Mana!`,
              x: rune.x,
              y: rune.y - 12,
              vy: -1.2,
              alpha: 1,
              color: '#a78bfa'
            });

            for (let p = 0; p < 8; p++) {
              eng.particles.push({
                x: rune.x,
                y: rune.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#c084fc',
                life: 0,
                maxLife: 18,
                size: 2.5
              });
            }
            break;
          }
        }
      }
    } else {
      handleAction();
    }
  };

  // Trigger game over
  const triggerGameOver = useCallback((finalScore: number) => {
    soundFX.playHit();
    setGameOver(true);
    setIsPlaying(false);

    // Reward gold and XP based on performance
    const earned = Math.max(1, Math.floor(finalScore / 10));
    setGoldEarnedThisRound(earned);
    if (onEarnGold && earned > 0) {
      onEarnGold(earned);
      soundFX.playCoin();
    }
    if (onEarnXP && earned > 0) {
      onEarnXP(earned * 2);
    }

    setHighScore(prev => ({
      ...prev,
      [selectedGame]: Math.max(prev[selectedGame], finalScore)
    }));
  }, [selectedGame, onEarnGold, onEarnXP]);

  // Main Canvas Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const eng = engineRef.current;

    const loop = (time: number) => {
      const dt = Math.min(32, time - eng.lastTime);
      eng.lastTime = time;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = 180;

      // 1. Clear background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      // --- GAME 1: CLASSIC DINO RUNNER ---
      if (selectedGame === 'dino_jump') {
        // Starry night grid
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let x = 0; x < w; x += 40) {
          ctx.fillRect(x, (time * 0.02) % 20, 1, 1);
        }

        // Draw ground line
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();

        // Speed increments slowly as score increases
        if (isPlaying && !gameOver) {
          eng.score += 0.25;
          setScore(Math.floor(eng.score));
          eng.speed = 4 + Math.min(6, eng.score * 0.008);

          // Update Dino physics
          eng.dino.vy += 0.58; // gravity
          eng.dino.y += eng.dino.vy;

          if (eng.dino.y >= groundY - 32) {
            eng.dino.y = groundY - 32;
            eng.dino.vy = 0;
            eng.dino.isGrounded = true;
          }

          // Move cacti
          for (let i = 0; i < eng.dinoCacti.length; i++) {
            const c = eng.dinoCacti[i];
            c.x -= eng.speed;

            if (c.x < -30) {
              c.x = w + 30 + Math.random() * 120;
              c.type = Math.random() > 0.4 ? 'single' : 'double';
              c.w = c.type === 'single' ? 18 : 30;
              c.h = c.type === 'single' ? 28 : 34;
              c.y = groundY - c.h;
            }

            // Collision check with Dino
            const dinoBox = {
              l: eng.dino.x + 6,
              r: eng.dino.x + eng.dino.width - 6,
              t: eng.dino.y + 4,
              b: eng.dino.y + eng.dino.height
            };

            const cactusBox = {
              l: c.x + 3,
              r: c.x + c.w - 3,
              t: c.y + 4,
              b: c.y + c.h
            };

            if (
              dinoBox.r > cactusBox.l &&
              dinoBox.l < cactusBox.r &&
              dinoBox.b > cactusBox.t &&
              dinoBox.t < cactusBox.b
            ) {
              triggerGameOver(Math.floor(eng.score));
            }
          }
        }

        // Draw Cacti (Obsidian spikes / Spiky prehistoric cacti)
        eng.dinoCacti.forEach(c => {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(c.x, c.y, c.w, c.h);
          // Spikes
          ctx.fillStyle = '#15803d';
          ctx.fillRect(c.x + 2, c.y - 4, 3, 4);
          if (c.type === 'double') {
            ctx.fillRect(c.x + c.w - 5, c.y - 6, 3, 6);
          }
        });

        // Draw Dino Character (Retro pixel dinosaur!)
        const dx = eng.dino.x;
        const dy = eng.dino.y;
        const legPhase = Math.sin(time * 0.02) * 4;

        ctx.save();
        // Dino green body
        ctx.fillStyle = '#10b981';
        ctx.fillRect(dx + 4, dy + 8, 20, 16);
        // Snout
        ctx.fillRect(dx + 16, dy, 14, 12);
        // Eye
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(dx + 22, dy + 2, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(dx + 23, dy + 3, 1.5, 1.5);
        // Teeth
        ctx.fillStyle = '#fff';
        ctx.fillRect(dx + 26, dy + 10, 2, 2);
        // Tail
        ctx.fillStyle = '#059669';
        ctx.fillRect(dx - 4, dy + 12, 8, 6);
        ctx.fillRect(dx - 8, dy + 8, 6, 6);
        // Cute Knight helmet on Dino
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(dx + 14, dy - 4, 14, 5);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(dx + 19, dy - 7, 4, 4);

        // Legs
        ctx.fillStyle = '#047857';
        if (eng.dino.isGrounded) {
          ctx.fillRect(dx + 8, dy + 24, 4, 8 + legPhase);
          ctx.fillRect(dx + 16, dy + 24, 4, 8 - legPhase);
        } else {
          // Tucked legs in air
          ctx.fillRect(dx + 6, dy + 24, 6, 4);
          ctx.fillRect(dx + 14, dy + 24, 6, 4);
        }
        ctx.restore();
      }

      // --- GAME 2: FLAPPY DRAGON ARCADE ---
      else if (selectedGame === 'flappy_dragon') {
        // Draw sky gradient & clouds
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, w, h);

        if (isPlaying && !gameOver) {
          // Physics
          eng.dragon.vy += 0.32; // Gravity
          eng.dragon.y += eng.dragon.vy;
          eng.dragon.wingPhase += 0.15;

          // Check ceiling / ground
          if (eng.dragon.y < 12 || eng.dragon.y > h - 14) {
            triggerGameOver(Math.floor(eng.score));
          }

          // Move pipes
          for (const pipe of eng.pipes) {
            pipe.x -= 2.6;

            // Score point when passing
            if (!pipe.passed && pipe.x < eng.dragon.x) {
              pipe.passed = true;
              eng.score += 1;
              setScore(eng.score);
              soundFX.playScorePoint();
            }

            // Recycle pipe
            if (pipe.x < -pipe.w) {
              pipe.x = w + 40;
              pipe.topH = 35 + Math.random() * 65;
              pipe.bottomY = pipe.topH + 70; // 70px safe gap
              pipe.passed = false;
            }

            // Collision check with Dragon circle vs pipe boxes
            const d = eng.dragon;
            const topHit = d.x + d.radius > pipe.x && d.x - d.radius < pipe.x + pipe.w && d.y - d.radius < pipe.topH;
            const botHit = d.x + d.radius > pipe.x && d.x - d.radius < pipe.x + pipe.w && d.y + d.radius > pipe.bottomY;

            if (topHit || botHit) {
              triggerGameOver(Math.floor(eng.score));
            }
          }
        }

        // Draw ancient obsidian pillar pipes
        eng.pipes.forEach(pipe => {
          // Top Pipe
          ctx.fillStyle = '#312e81';
          ctx.fillRect(pipe.x, 0, pipe.w, pipe.topH);
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(pipe.x - 3, pipe.topH - 8, pipe.w + 6, 8);

          // Bottom Pipe
          ctx.fillStyle = '#312e81';
          ctx.fillRect(pipe.x, pipe.bottomY, pipe.w, h - pipe.bottomY);
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(pipe.x - 3, pipe.bottomY, pipe.w + 6, 8);
        });

        // Draw Flappy Dragon
        const drg = eng.dragon;
        ctx.save();
        ctx.translate(drg.x, drg.y);
        ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, drg.vy * 0.08)));

        // Dragon Body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dragon Snout
        ctx.fillStyle = '#d97706';
        ctx.fillRect(8, -5, 8, 7);

        // Dragon Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, -7, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(6, -6, 2, 2);

        // Dragon Wings flapping
        const wingY = Math.sin(drg.wingPhase) * 10;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-4, -2);
        ctx.lineTo(-12, -14 + wingY);
        ctx.lineTo(2, -6);
        ctx.closePath();
        ctx.fill();

        // Fire breath sparkle
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(16, -2, 4, 3);
        ctx.restore();
      }

      // --- GAME 3: FOCUS SLASHER (Slice Procrastination Phantoms) ---
      else if (selectedGame === 'focus_slasher') {
        ctx.fillStyle = '#140c17';
        ctx.fillRect(0, 0, w, h);

        if (isPlaying && !gameOver) {
          // Spawn phantoms
          if (Math.random() < 0.035 && eng.orbs.length < 6) {
            const labels = ['Social Media', 'Procrastination', 'Distraction', 'Doomscroll', 'Fatigue'];
            eng.orbs.push({
              id: Math.random(),
              x: 40 + Math.random() * (w - 80),
              y: h + 20,
              vy: -(Math.random() * 2.8 + 3.2),
              radius: 18,
              color: '#ec4899',
              label: labels[Math.floor(Math.random() * labels.length)],
              sliced: false
            });
          }

          // Move orbs
          for (let i = eng.orbs.length - 1; i >= 0; i--) {
            const orb = eng.orbs[i];
            orb.y += orb.vy;
            orb.vy += 0.08; // Gravity pulls back down

            // Check if dropped past bottom without slicing
            if (orb.y > h + 30 && orb.vy > 0 && !orb.sliced) {
              eng.orbs.splice(i, 1);
              // Missed orb penalty
              triggerGameOver(Math.floor(eng.score));
              break;
            }

            if (orb.y > h + 40) {
              eng.orbs.splice(i, 1);
            }
          }
        }

        // Draw Orbs
        eng.orbs.forEach(orb => {
          if (!orb.sliced) {
            ctx.save();
            ctx.shadowColor = orb.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = orb.color;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.shadowBlur = 0;
            ctx.font = 'bold 9px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(orb.label, orb.x, orb.y + 3);
            ctx.restore();
          }
        });
      }

      // --- GAME 4: RUNE CLICKER (Rapid Alchemy Reflexes) ---
      else if (selectedGame === 'rune_clicker') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        if (isPlaying && !gameOver) {
          // Spawn glowing runic stones
          if (Math.random() < 0.04 && eng.runes.length < 5) {
            const symbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];
            eng.runes.push({
              id: Math.random(),
              x: 50 + Math.random() * (w - 100),
              y: 40 + Math.random() * (h - 80),
              timer: 0,
              maxTimer: 90, // ~1.5s to click
              active: true,
              symbol: symbols[Math.floor(Math.random() * symbols.length)],
              xp: 15
            });
          }

          for (let i = eng.runes.length - 1; i >= 0; i--) {
            const rune = eng.runes[i];
            rune.timer++;
            if (rune.timer >= rune.maxTimer) {
              // Missed rune!
              eng.runes.splice(i, 1);
              triggerGameOver(Math.floor(eng.score));
              break;
            }
          }
        }

        // Draw active runes
        eng.runes.forEach(rune => {
          if (rune.active) {
            const progress = rune.timer / rune.maxTimer;
            ctx.save();
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = `rgba(192, 132, 252, ${1 - progress})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(rune.x, rune.y, 22, 0, Math.PI * 2 * (1 - progress));
            ctx.stroke();

            ctx.fillStyle = '#581c87';
            ctx.beginPath();
            ctx.arc(rune.x, rune.y, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f3e8ff';
            ctx.font = 'bold 16px serif';
            ctx.textAlign = 'center';
            ctx.fillText(rune.symbol, rune.x, rune.y + 5);
            ctx.restore();
          }
        });
      }

      // --- SHARED: PARTICLES & FLOATING TEXTS ---
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
        if (p.life >= p.maxLife) eng.particles.splice(i, 1);
      }

      for (let i = eng.floatingTexts.length - 1; i >= 0; i--) {
        const ft = eng.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.025;
        ctx.font = 'bold 12px Cinzel, monospace, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
        if (ft.alpha <= 0) eng.floatingTexts.splice(i, 1);
      }

      // Loop
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedGame, isPlaying, gameOver, triggerGameOver]);

  // Keyboard shortcut for jump / flap
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleAction]);

  return (
    <div
      ref={containerRef}
      className="bg-[#0e111a] border border-amber-500/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Top Header: Tiny Game Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-cinzel text-white">Tiny Realm Arcades</h3>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Play & Earn Gold
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Quick 15-second mini-games to sharpen reflexes and earn bonus in-game gold bounties!
            </p>
          </div>
        </div>

        {/* Live Score & High Score Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
            <span className="text-neutral-400">Score:</span>
            <span className="font-black text-amber-300">{score}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/30 border border-amber-500/30 font-mono text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-bold">{highScore[selectedGame]}</span>
          </div>
        </div>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setSelectedGame('dino_jump');
            setIsPlaying(false);
            setGameOver(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGame === 'dino_jump'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          <span>🦕 Dino Runner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGame('flappy_dragon');
            setIsPlaying(false);
            setGameOver(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGame === 'flappy_dragon'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          <span>🐉 Flappy Dragon</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGame('focus_slasher');
            setIsPlaying(false);
            setGameOver(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGame === 'focus_slasher'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          <span>⚔️ Distraction Slasher</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGame('rune_clicker');
            setIsPlaying(false);
            setGameOver(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedGame === 'rune_clicker'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-neutral-300'
          }`}
        >
          <span>✨ Runic Reflexes</span>
        </button>
      </div>

      {/* Game Canvas Container */}
      <div className="relative w-full h-[190px] rounded-xl overflow-hidden border border-white/10 bg-[#080a10]">
        <canvas
          ref={canvasRef}
          width={720}
          height={190}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-pointer select-none active:scale-[0.99] transition-transform"
        />

        {/* Start / Intro Overlay if not playing */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center gap-2 pointer-events-auto">
            <h4 className="text-sm font-bold font-cinzel text-amber-300">
              {selectedGame === 'dino_jump' && '🦕 Classic Dino Knight Leap'}
              {selectedGame === 'flappy_dragon' && '🐉 Flappy Drake Gauntlet'}
              {selectedGame === 'focus_slasher' && '⚔️ Slice Distractions'}
              {selectedGame === 'rune_clicker' && '✨ Rapid Alchemy Reflexes'}
            </h4>
            <p className="text-xs text-neutral-400 max-w-xs">
              {selectedGame === 'dino_jump' && 'Press Space or Click to leap over spiky obsidian obstacles!'}
              {selectedGame === 'flappy_dragon' && 'Tap or Space to flap wings through ancient stone pillars!'}
              {selectedGame === 'focus_slasher' && 'Click the floating distraction bubbles before they hit the ground!'}
              {selectedGame === 'rune_clicker' && 'Quickly click ancient glowing runes before their mana dissipates!'}
            </p>
            <button
              type="button"
              onClick={startGame}
              className="mt-1 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs font-cinzel tracking-wider uppercase shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Start Game</span>
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center gap-2 pointer-events-auto animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">
              Gauntlet Concluded!
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">{score}</span>
              <span className="text-xs text-neutral-400">POINTS</span>
            </div>

            {goldEarnedThisRound > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>+{goldEarnedThisRound} Gold Awarded to Treasury!</span>
              </div>
            )}

            <button
              type="button"
              onClick={startGame}
              className="mt-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-cinzel tracking-wider uppercase shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again [Space]</span>
            </button>
          </div>
        )}

        {/* Quick Leap / Tap Button at bottom right for touch / mobile */}
        {isPlaying && (
          <button
            type="button"
            onClick={handleAction}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-amber-500/90 text-black font-black text-xs font-cinzel shadow-md active:scale-95 transition-all"
          >
            {selectedGame === 'focus_slasher' || selectedGame === 'rune_clicker' ? 'Tap Targets' : 'Jump [Space]'}
          </button>
        )}
      </div>
    </div>
  );
}
