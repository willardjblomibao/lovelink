let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

function playTone(freq: number, startAt: number, duration: number, ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.15, startAt + 0.02);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

/** Classic two-tone ring pattern, repeating every ~3s, until stopRingtone() is called. */
export function startRingtone() {
  stopRingtone();
  const ctx = getCtx();
  const playPattern = () => {
    const now = ctx.currentTime;
    playTone(480, now, 0.4, ctx);
    playTone(440, now + 0.45, 0.4, ctx);
  };
  playPattern();
  ringInterval = setInterval(playPattern, 3000);
}

export function stopRingtone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}
