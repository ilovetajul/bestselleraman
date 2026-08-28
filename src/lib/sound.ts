// Minimal beep synthesizer via the Web Audio API — no external audio files required.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

function tone(freq: number, duration: number, delay = 0, type: OscillatorType = 'sine') {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration + 0.02);
}

export function playSound(kind: 'correct' | 'almost' | 'incorrect' | 'complete', enabled: boolean) {
  if (!enabled) return;
  try {
    if (kind === 'correct') {
      tone(660, 0.12);
      tone(880, 0.16, 0.1);
    } else if (kind === 'almost') {
      tone(520, 0.16);
    } else if (kind === 'incorrect') {
      tone(220, 0.2);
    } else {
      tone(523, 0.12);
      tone(659, 0.12, 0.12);
      tone(784, 0.2, 0.24);
    }
  } catch {
    // ignore — audio is a non-critical enhancement
  }
}
