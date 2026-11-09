/**
 * Serene sound generator using Web Audio API (Zero external MP3 dependency)
 */
export function playIslamicChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic frequencies for gentle chime
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 2.0);
    });
  } catch (err) {
    console.warn('Audio play restricted or unavailable:', err);
  }
}

/**
 * Starts a continuous looping Islamic adhan chime that plays every 2.5s until stop() is called.
 */
export function startLoopingChime(): () => void {
  playIslamicChime();
  const interval = setInterval(() => {
    playIslamicChime();
  }, 2500);

  return () => {
    clearInterval(interval);
  };
}
