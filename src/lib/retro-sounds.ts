// 8-bit retro sound effects using Web Audio API
let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
};

const playTone = (
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.15,
  freqEnd?: number
) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd) {
      osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // silently fail if audio not supported
  }
};

export const retroSounds = {
  /** Button click / menu select */
  click: () => playTone(800, 0.08, "square", 0.12),

  /** Start game fanfare */
  startGame: () => {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "square", 0.1), i * 100);
    });
  },

  /** Correct answer */
  correct: () => {
    playTone(523, 0.1, "square", 0.1);
    setTimeout(() => playTone(659, 0.1, "square", 0.1), 80);
    setTimeout(() => playTone(784, 0.15, "square", 0.12), 160);
  },

  /** Wrong answer */
  wrong: () => {
    playTone(200, 0.15, "square", 0.12);
    setTimeout(() => playTone(150, 0.25, "square", 0.1), 120);
  },

  /** Game over */
  gameOver: () => {
    const notes = [440, 370, 311, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "square", 0.1), i * 150);
    });
  },

  /** Jump */
  jump: () => playTone(300, 0.15, "square", 0.1, 600),

  /** Collect heart / item */
  collect: () => {
    playTone(880, 0.08, "square", 0.1);
    setTimeout(() => playTone(1175, 0.12, "square", 0.12), 70);
  },

  /** Level complete / win */
  levelComplete: () => {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.12, "square", 0.1), i * 90);
    });
  },

  /** Ghost caught player */
  caught: () => {
    playTone(400, 0.3, "sawtooth", 0.1, 80);
  },

  /** Pac-Man move blip */
  move: () => playTone(440, 0.03, "square", 0.05),

  /** Open envelope / reveal */
  reveal: () => {
    playTone(392, 0.1, "triangle", 0.1);
    setTimeout(() => playTone(523, 0.1, "triangle", 0.1), 100);
    setTimeout(() => playTone(659, 0.15, "triangle", 0.12), 200);
  },

  /** Final yes / celebration */
  celebration: () => {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "square", 0.08), i * 80);
    });
    setTimeout(() => {
      [1047, 1319, 1568].forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, "triangle", 0.06), i * 100);
      });
    }, 500);
  },
};
