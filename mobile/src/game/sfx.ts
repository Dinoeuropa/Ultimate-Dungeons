let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = "square",
  volume = 0.08,
) {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playMeleeSfx(enabled: boolean) {
  if (!enabled) return;
  playTone(220, 80, "sawtooth", 0.06);
}

export function playRangedSfx(enabled: boolean) {
  if (!enabled) return;
  playTone(440, 60, "triangle", 0.05);
}

export function playHitSfx(enabled: boolean) {
  if (!enabled) return;
  playTone(120, 120, "square", 0.07);
}

export function playPickupSfx(enabled: boolean) {
  if (!enabled) return;
  playTone(660, 100, "sine", 0.06);
  setTimeout(() => playTone(880, 100, "sine", 0.05), 90);
}

export function playDoorSfx(enabled: boolean) {
  if (!enabled) return;
  playTone(330, 150, "triangle", 0.05);
}

export function playFloorSfx(enabled: boolean) {
  if (!enabled) return;
  playTone(523, 120, "sine", 0.05);
}
