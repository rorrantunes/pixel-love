// Romantic chiptune background music using Web Audio API
let audioCtx: AudioContext | null = null;
let isPlaying = false;
let stopFlag = false;
let masterGain: GainNode | null = null;

const TEMPO = 108; // BPM
const NOTE_DUR = 60 / TEMPO;

// Musical notes (frequencies in Hz)
const N: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00, B5: 987.77,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, B3: 246.94,
  R: 0, // rest
};

// Romantic melody (dreamy, magical feel)
const melody: [string, number][] = [
  ["E4", 1], ["G4", 1], ["A4", 1.5], ["B4", 0.5],
  ["C5", 1.5], ["B4", 0.5], ["A4", 1], ["G4", 1],
  ["E4", 1], ["G4", 1], ["A4", 1.5], ["G4", 0.5],
  ["F4", 1.5], ["E4", 0.5], ["D4", 1], ["R", 1],
  ["E4", 1], ["G4", 1], ["A4", 1.5], ["B4", 0.5],
  ["C5", 1], ["D5", 1], ["E5", 1.5], ["D5", 0.5],
  ["C5", 1], ["B4", 0.5], ["A4", 0.5], ["G4", 1], ["A4", 1],
  ["R", 0.5], ["E4", 0.5], ["G4", 1], ["A4", 2],
];

// Bass line (arpeggiated chords)
const bass: [string, number][] = [
  ["A3", 1], ["E3", 1], ["A3", 1], ["E3", 1],
  ["F3", 1], ["C3", 1], ["F3", 1], ["C3", 1],
  ["D3", 1], ["A3", 1], ["D3", 1], ["A3", 1],
  ["E3", 1], ["B3", 1], ["E3", 1], ["B3", 1],
  ["A3", 1], ["E3", 1], ["A3", 1], ["E3", 1],
  ["F3", 1], ["C3", 1], ["F3", 1], ["C3", 1],
  ["D3", 1], ["A3", 1], ["D3", 1], ["A3", 1],
  ["E3", 1], ["B3", 1], ["E3", 1.5], ["R", 0.5],
];

// Harmony / pad layer
const harmony: [string, number][] = [
  ["C5", 2], ["R", 2],
  ["A4", 2], ["R", 2],
  ["F4", 2], ["R", 2],
  ["G4", 2], ["R", 2],
  ["C5", 2], ["R", 2],
  ["A4", 2], ["R", 2],
  ["F4", 2], ["R", 2],
  ["E4", 2], ["R", 2],
];

const playNote = (
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  volume: number
) => {
  if (freq === 0) return; // rest
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Gentle envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.setValueAtTime(volume, startTime + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

const scheduleLoop = (ctx: AudioContext, master: GainNode) => {
  const startTime = ctx.currentTime + 0.1;

  // Melody
  let t = startTime;
  for (const [note, beats] of melody) {
    playNote(ctx, master, N[note], t, beats * NOTE_DUR * 0.9, "triangle", 0.09);
    t += beats * NOTE_DUR;
  }

  // Bass
  let tb = startTime;
  for (const [note, beats] of bass) {
    playNote(ctx, master, N[note], tb, beats * NOTE_DUR * 0.8, "square", 0.04);
    tb += beats * NOTE_DUR;
  }

  // Harmony pad
  let th = startTime;
  for (const [note, beats] of harmony) {
    playNote(ctx, master, N[note], th, beats * NOTE_DUR * 0.95, "sine", 0.05);
    th += beats * NOTE_DUR;
  }

  // Total loop duration
  const loopDuration = t - startTime;

  // Schedule next loop
  setTimeout(() => {
    if (!stopFlag && isPlaying) {
      scheduleLoop(ctx, master);
    }
  }, (loopDuration - 0.5) * 1000);
};

export const bgMusic = {
  start: () => {
    if (isPlaying) return;
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      const ctx = audioCtx;
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.6, ctx.currentTime);
      masterGain.connect(ctx.destination);
      isPlaying = true;
      stopFlag = false;
      scheduleLoop(ctx, masterGain);
    } catch {
      // silently fail
    }
  },

  stop: () => {
    stopFlag = true;
    isPlaying = false;
    if (masterGain) {
      try {
        const ctx = audioCtx!;
        masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      } catch {}
    }
  },

  setVolume: (vol: number) => {
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
    }
  },

  isPlaying: () => isPlaying,
};
