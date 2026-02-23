// Nocturnal romantic chiptune – moonlit love theme
let audioCtx: AudioContext | null = null;
let isPlaying = false;
let stopFlag = false;
let masterGain: GainNode | null = null;

const TEMPO = 72; // slower, dreamy BPM
const NOTE_DUR = 60 / TEMPO;

// Musical notes (Hz) – using minor/lydian tonalities for night magic
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33,
  C6: 1046.50,
  R: 0,
};

// Main melody – nocturnal, wistful, tender
const melody: [string, number][] = [
  ["Eb4", 1.5], ["G4", 0.5], ["Bb4", 2], ["Ab4", 1], ["G4", 1],
  ["Eb4", 1.5], ["F4", 0.5], ["G4", 2], ["R", 2],
  ["Ab4", 1.5], ["Bb4", 0.5], ["C5", 2], ["Bb4", 1], ["Ab4", 1],
  ["G4", 1.5], ["F4", 0.5], ["Eb4", 2], ["R", 2],
  ["C5", 1.5], ["Bb4", 0.5], ["Ab4", 1], ["G4", 1], ["Eb4", 1.5], ["F4", 0.5],
  ["G4", 3], ["R", 1],
  ["Ab4", 1], ["Bb4", 1], ["C5", 1.5], ["Eb5", 0.5],
  ["D5", 2], ["C5", 1], ["Bb4", 1],
  ["Ab4", 1.5], ["G4", 0.5], ["Eb4", 2], ["R", 2],
];

// Bass – slow arpeggios, Cm / Ab / Eb / Bb progression
const bass: [string, number][] = [
  ["C3", 2], ["G3", 2], ["Eb3", 2], ["G3", 2],
  ["Ab3", 2], ["Eb3", 2], ["Ab3", 2], ["Eb3", 2],
  ["Bb3", 2], ["F3", 2], ["Bb3", 2], ["F3", 2],
  ["Eb3", 2], ["Bb3", 2], ["Eb3", 2], ["G3", 2],
  ["C3", 2], ["G3", 2], ["Eb3", 2], ["G3", 2],
  ["Ab3", 2], ["Eb3", 2], ["Ab3", 2], ["Eb3", 2],
  ["Bb3", 2], ["F3", 2], ["Bb3", 2], ["F3", 2],
  ["Eb3", 2], ["Bb3", 2], ["G3", 2], ["R", 2],
];

// Shimmer pad – high ethereal notes like starlight
const shimmer: [string, number][] = [
  ["Eb5", 4], ["R", 4],
  ["C5", 4], ["R", 4],
  ["Bb4", 4], ["R", 4],
  ["G4", 4], ["R", 4],
  ["Eb5", 4], ["R", 4],
  ["Ab4", 4], ["R", 4],
  ["Bb4", 4], ["R", 4],
  ["G4", 4], ["R", 4],
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
  if (freq === 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Soft, dreamy envelope with slow attack and long release
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.08);
  gain.gain.setValueAtTime(volume * 0.8, startTime + duration * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

const scheduleLoop = (ctx: AudioContext, master: GainNode) => {
  const startTime = ctx.currentTime + 0.1;

  // Melody – triangle for warmth
  let t = startTime;
  for (const [note, beats] of melody) {
    playNote(ctx, master, N[note], t, beats * NOTE_DUR * 0.92, "triangle", 0.08);
    t += beats * NOTE_DUR;
  }

  // Bass – sine for deep, round tone
  let tb = startTime;
  for (const [note, beats] of bass) {
    playNote(ctx, master, N[note], tb, beats * NOTE_DUR * 0.85, "sine", 0.05);
    tb += beats * NOTE_DUR;
  }

  // Shimmer pad – sine, very soft, like distant stars
  let ts = startTime;
  for (const [note, beats] of shimmer) {
    playNote(ctx, master, N[note], ts, beats * NOTE_DUR * 0.95, "sine", 0.025);
    ts += beats * NOTE_DUR;
  }

  const loopDuration = t - startTime;

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
