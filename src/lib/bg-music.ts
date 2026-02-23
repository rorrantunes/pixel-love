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

const TEMPO = 80; // Ghibli waltz feel – gentle 3/4 time
const NOTE_DUR = 60 / TEMPO;

const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00, B5: 987.77, C6: 1046.50,
  R: 0,
};

// ── Hisaishi-inspired melody: tender, nostalgic, waltz-like in C major ──
// Phrase 1: rising hope
const melody: [string, number][] = [
  ["E4", 1], ["G4", 0.5], ["A4", 0.5], ["C5", 2], ["R", 0.5], ["B4", 0.5],
  ["A4", 1], ["G4", 1], ["E4", 1.5], ["D4", 0.5],
  ["C4", 2], ["R", 1],
  // Phrase 2: tender descent
  ["E5", 1.5], ["D5", 0.5], ["C5", 1], ["A4", 1],
  ["G4", 1.5], ["A4", 0.5], ["B4", 2],
  ["R", 1],
  // Phrase 3: yearning climb
  ["C5", 1], ["D5", 0.5], ["E5", 0.5], ["G5", 2],
  ["E5", 1], ["D5", 0.5], ["C5", 0.5], ["A4", 2],
  ["G4", 1.5], ["E4", 0.5],
  // Phrase 4: resolution – coming home
  ["F4", 1], ["E4", 0.5], ["D4", 0.5], ["C4", 2],
  ["E4", 1], ["G4", 1], ["C5", 3],
  ["R", 2],
  // Phrase 5: gentle echo
  ["A4", 1], ["C5", 0.5], ["B4", 0.5], ["A4", 1], ["G4", 1],
  ["E4", 1.5], ["D4", 0.5], ["C4", 3],
  ["R", 2],
];

// ── Waltz bass: root-fifth pattern, like a music box ──
const bass: [string, number][] = [
  ["C3", 1.5], ["G3", 0.75], ["E3", 0.75], ["C3", 1.5], ["G3", 0.75], ["E3", 0.75],
  ["A3", 1.5], ["E3", 0.75], ["C3", 0.75], ["A3", 1.5], ["E3", 0.75], ["C3", 0.75],
  ["F3", 1.5], ["C3", 0.75], ["A3", 0.75], ["F3", 1.5], ["C3", 0.75], ["A3", 0.75],
  ["G3", 1.5], ["D3", 0.75], ["B3", 0.75], ["G3", 1.5], ["D3", 0.75], ["B3", 0.75],
  ["C3", 1.5], ["G3", 0.75], ["E3", 0.75], ["C3", 1.5], ["G3", 0.75], ["E3", 0.75],
  ["F3", 1.5], ["C3", 0.75], ["A3", 0.75], ["G3", 1.5], ["D3", 0.75], ["B3", 0.75],
  ["A3", 1.5], ["E3", 0.75], ["C3", 0.75], ["G3", 1.5], ["D3", 0.75], ["B3", 0.75],
  ["C3", 1.5], ["G3", 0.75], ["E3", 0.75], ["C3", 1.5], ["R", 1.5],
];

// ── Counter melody: like a celeste / glockenspiel, high and delicate ──
const counterMelody: [string, number][] = [
  ["R", 3], ["G5", 1.5], ["E5", 1.5],
  ["R", 3], ["C5", 1.5], ["A4", 1.5],
  ["R", 3], ["A5", 1.5], ["G5", 1.5],
  ["R", 3], ["E5", 1.5], ["D5", 1.5],
  ["R", 3], ["G5", 1.5], ["E5", 1.5],
  ["R", 3], ["A5", 1.5], ["G5", 1.5],
  ["R", 3], ["C5", 1.5], ["B4", 1.5],
  ["R", 3], ["E5", 3],
];

// ── Sustained harmony pad – like distant strings ──
const pad: [string, number][] = [
  ["E4", 6], ["G4", 6],
  ["C4", 6], ["E4", 6],
  ["A4", 6], ["C5", 6],
  ["B4", 6], ["D5", 6],
  ["E4", 6], ["G4", 6],
  ["F4", 6], ["A4", 6],
  ["E4", 6], ["G4", 6],
  ["C4", 6], ["R", 6],
];

// Piano-like note with fast attack and natural decay
const playPianoNote = (
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  volume: number
) => {
  if (freq === 0) return;
  // Two detuned triangle oscillators for warmth
  for (const detune of [-3, 3]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);
    osc.detune.setValueAtTime(detune, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(volume * 0.35, startTime + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
};

// Soft sustained note for pads and counter melody
const playSoftNote = (
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  volume: number
) => {
  if (freq === 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.12);
  gain.gain.setValueAtTime(volume * 0.6, startTime + duration * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
};

const scheduleLoop = (ctx: AudioContext, master: GainNode) => {
  const startTime = ctx.currentTime + 0.1;

  // Melody – piano-like, warm and clear
  let t = startTime;
  for (const [note, beats] of melody) {
    playPianoNote(ctx, master, N[note], t, beats * NOTE_DUR * 0.92, 0.07);
    t += beats * NOTE_DUR;
  }

  // Waltz bass – soft sine
  let tb = startTime;
  for (const [note, beats] of bass) {
    playSoftNote(ctx, master, N[note], tb, beats * NOTE_DUR * 0.85, 0.035);
    tb += beats * NOTE_DUR;
  }

  // Counter melody – very delicate, like distant bells
  let tc = startTime;
  for (const [note, beats] of counterMelody) {
    playPianoNote(ctx, master, N[note], tc, beats * NOTE_DUR * 0.9, 0.025);
    tc += beats * NOTE_DUR;
  }

  // Harmony pad – ultra-soft sustained strings
  let tp = startTime;
  for (const [note, beats] of pad) {
    playSoftNote(ctx, master, N[note], tp, beats * NOTE_DUR * 0.98, 0.018);
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
