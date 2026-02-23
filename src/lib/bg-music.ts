// Nocturnal romantic chiptune – moonlit love theme with reverb
let audioCtx: AudioContext | null = null;
let isPlaying = false;
let stopFlag = false;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let dryGain: GainNode | null = null;
let wetGain: GainNode | null = null;

// Build an impulse response for a soft, dreamy reverb
const createReverbIR = (ctx: AudioContext, duration = 2.5, decay = 2.0): AudioBuffer => {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
};

const TEMPO = 56; // very slow, meditative
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

// Main melody – gentle, lullaby-like, major key warmth
const melody: [string, number][] = [
  ["G4", 2], ["A4", 1], ["B4", 1], ["D5", 3], ["R", 1],
  ["C5", 2], ["B4", 1], ["A4", 1], ["G4", 3], ["R", 1],
  ["A4", 1.5], ["B4", 0.5], ["C5", 2], ["E5", 2], ["D5", 2],
  ["C5", 1], ["B4", 1], ["A4", 2], ["G4", 2],
  ["R", 2],
  ["E4", 2], ["G4", 1], ["A4", 1], ["B4", 3], ["R", 1],
  ["A4", 2], ["G4", 1], ["E4", 1], ["D4", 3], ["R", 1],
  ["E4", 1.5], ["G4", 0.5], ["A4", 2], ["B4", 2], ["A4", 2],
  ["G4", 4],
  ["R", 2],
];

// Bass – very slow, warm root notes with gentle movement
const bass: [string, number][] = [
  ["G3", 4], ["D3", 4],
  ["C3", 4], ["G3", 4],
  ["A3", 4], ["E3", 4],
  ["D3", 4], ["G3", 4],
  ["G3", 4], ["D3", 4],
  ["C3", 4], ["G3", 4],
  ["A3", 4], ["D3", 4],
  ["G3", 4], ["R", 4],
];

// Shimmer – very high, barely audible sparkle like distant chimes
const shimmer: [string, number][] = [
  ["D5", 3], ["R", 5],
  ["G5", 3], ["R", 5],
  ["E5", 3], ["R", 5],
  ["B4", 3], ["R", 5],
  ["D5", 3], ["R", 5],
  ["A5", 3], ["R", 5],
  ["G5", 3], ["R", 5],
  ["D5", 3], ["R", 5],
];

// Harmony pad – sustained chords, very soft
const pad: [string, number][] = [
  ["B4", 8],
  ["E4", 8],
  ["G4", 8],
  ["Fs4", 8],
  ["B4", 8],
  ["E4", 8],
  ["Fs4", 8],
  ["G4", 8],
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

  // Very gentle envelope – slow attack, long sustain, smooth fade
  const attack = Math.min(0.15, duration * 0.15);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + attack);
  gain.gain.setValueAtTime(volume * 0.7, startTime + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
};

const scheduleLoop = (ctx: AudioContext, master: GainNode) => {
  const startTime = ctx.currentTime + 0.1;

  // Melody – triangle wave, very soft and warm
  let t = startTime;
  for (const [note, beats] of melody) {
    playNote(ctx, master, N[note], t, beats * NOTE_DUR * 0.95, "triangle", 0.055);
    t += beats * NOTE_DUR;
  }

  // Bass – sine wave, deep and round
  let tb = startTime;
  for (const [note, beats] of bass) {
    playNote(ctx, master, N[note], tb, beats * NOTE_DUR * 0.9, "sine", 0.04);
    tb += beats * NOTE_DUR;
  }

  // Shimmer – sine, barely there, like tiny bells
  let ts = startTime;
  for (const [note, beats] of shimmer) {
    playNote(ctx, master, N[note], ts, beats * NOTE_DUR * 0.95, "sine", 0.015);
    ts += beats * NOTE_DUR;
  }

  // Pad – triangle, ultra soft sustained harmony
  let tp = startTime;
  for (const [note, beats] of pad) {
    playNote(ctx, master, N[note], tp, beats * NOTE_DUR * 0.98, "triangle", 0.02);
    tp += beats * NOTE_DUR;
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

      // Master gain
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.6, ctx.currentTime);

      // Reverb chain: dry + wet mix
      dryGain = ctx.createGain();
      dryGain.gain.setValueAtTime(0.65, ctx.currentTime);

      wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(0.35, ctx.currentTime);

      reverbNode = ctx.createConvolver();
      reverbNode.buffer = createReverbIR(ctx, 2.8, 1.8);

      // Routing: master → dry → destination
      //          master → reverb → wet → destination
      masterGain.connect(dryGain);
      dryGain.connect(ctx.destination);

      masterGain.connect(reverbNode);
      reverbNode.connect(wetGain);
      wetGain.connect(ctx.destination);

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
