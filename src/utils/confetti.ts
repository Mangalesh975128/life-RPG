import confetti from 'canvas-confetti';

export function triggerQuestConfetti(originX = 0.5, originY = 0.6) {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { x: originX, y: originY },
    colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1', '#ec4899'],
    ticks: 150,
    gravity: 0.9,
    scalar: 0.9,
    disableForReducedMotion: true
  });
}

export function triggerLevelUpFireworks() {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 70, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // fireworks from both sides
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 }, colors: ['#f59e0b', '#d97706', '#fbbf24', '#fef08a'] });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 }, colors: ['#8b5cf6', '#a855f7', '#6366f1', '#38bdf8'] });
  }, 250);
}
