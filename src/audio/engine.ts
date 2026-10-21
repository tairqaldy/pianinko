import { midiToFreq } from '../lib/notes.ts';

export type InstrumentId = 'piano' | 'epiano' | 'musicbox' | 'pad' | 'chip';

export const INSTRUMENTS: { id: InstrumentId; name: string; hint: string; swatch: string }[] = [
  { id: 'piano', name: 'Grand piano', hint: 'Real recorded concert grand', swatch: '#BFE0FF' },
  { id: 'epiano', name: 'Electric piano', hint: 'Warm, round, a little bell', swatch: '#FFD9B8' },
  { id: 'musicbox', name: 'Music box', hint: 'Tiny and sparkly', swatch: '#FFD1E4' },
  { id: 'pad', name: 'Soft pad', hint: 'Slow, dreamy synth', swatch: '#C6F2D0' },
  { id: 'chip', name: '8-bit', hint: 'Old game console', swatch: '#FFEDA8' },
];

/* Salamander Grand Piano (Alexander Holm, CC-BY 3.0), sampled every minor third. */
const SAMPLE_BASE = 'https://tonejs.github.io/audio/salamander/';
const SAMPLE_NAMES = ['A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7', 'Fs7', 'A7', 'C8'];
const sampleMidi = (name: string) => {
  const pc: Record<string, number> = { C: 0, Ds: 3, Fs: 6, A: 9 };
  const m = /^(C|Ds|Fs|A)(\d)$/.exec(name)!;
  return (Number(m[2]) + 1) * 12 + pc[m[1]];
};

interface Voice {
  midi: number;
  start: number;
  /** Fade out from `when`; the voice cleans itself up. */
  release(when: number): void;
  stopped: boolean;
}

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type Listener = () => void;

class AudioEngine {
  ctx: AudioContext | null = null;
  private bus!: GainNode;
  private master!: GainNode;
  private wet!: GainNode;
  private clickBus!: GainNode;

  instrument: InstrumentId = 'piano';
  private volume = 0.8;
  private reverbAmount = 0.25;

  private held = new Map<number, Voice[]>();
  private sustainOn = false;
  private sustained = new Set<Voice>();
  private all: Voice[] = [];

  private samples = new Map<number, AudioBuffer>();
  private sampleKeys: number[] = [];
  loadState: LoadState = 'idle';
  loadProgress = 0;
  private listeners = new Set<Listener>();

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  /** Create or resume the audio context. Must run inside a user gesture the first time. */
  ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      this.bus = ctx.createGain();
      this.wet = ctx.createGain();
      this.wet.gain.value = this.reverbAmount;
      const convolver = ctx.createConvolver();
      convolver.buffer = makeImpulse(ctx, 2.6);
      this.clickBus = ctx.createGain();
      this.clickBus.gain.value = 0.5;

      this.bus.connect(comp);
      this.bus.connect(this.wet);
      this.wet.connect(convolver);
      convolver.connect(comp);
      comp.connect(this.master);
      this.clickBus.connect(this.master);
      this.master.connect(ctx.destination);
      if (this.instrument === 'piano') void this.loadPiano();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  get now() {
    return this.ctx?.currentTime ?? 0;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
  }

  setReverb(v: number) {
    this.reverbAmount = v;
    if (this.ctx) this.wet.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setInstrument(id: InstrumentId) {
    this.instrument = id;
    if (id === 'piano' && this.ctx) void this.loadPiano();
    this.emit();
  }

  /* ---------- samples ---------- */

  async loadPiano() {
    if (this.loadState === 'loading' || this.loadState === 'ready' || !this.ctx) return;
    const ctx = this.ctx;
    this.loadState = 'loading';
    this.emit();
    // Middle of the keyboard first so the common range sounds right quickly.
    const order = [...SAMPLE_NAMES].sort((a, b) => Math.abs(sampleMidi(a) - 62) - Math.abs(sampleMidi(b) - 62));
    let done = 0;
    let failed = 0;
    const queue = [...order];
    const worker = async () => {
      while (queue.length) {
        const name = queue.shift()!;
        try {
          const res = await fetch(`${SAMPLE_BASE}${name}.mp3`);
          if (!res.ok) throw new Error(String(res.status));
          const buf = await ctx.decodeAudioData(await res.arrayBuffer());
          this.samples.set(sampleMidi(name), buf);
          this.sampleKeys = [...this.samples.keys()].sort((a, b) => a - b);
        } catch {
          failed++;
        }
        done++;
        this.loadProgress = done / order.length;
        this.emit();
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    this.loadState = this.samples.size > 0 ? 'ready' : 'error';
    if (failed && this.samples.size === 0) this.loadState = 'error';
    this.emit();
  }

  private nearestSample(midi: number): number | null {
    let best: number | null = null;
    for (const k of this.sampleKeys) if (best === null || Math.abs(k - midi) < Math.abs(best - midi)) best = k;
    return best !== null && Math.abs(best - midi) <= 6 ? best : null;
  }

  /* ---------- notes ---------- */

  /** Press a key. It rings until noteOff (or longer, while the sustain pedal is down). */
  noteOn(midi: number, velocity = 0.78, when = 0) {
    const ctx = this.ensure();
    const t = Math.max(when, ctx.currentTime);
    // Re-striking a held key cuts the previous strike of that key softly.
    this.held.get(midi)?.forEach((v) => v.release(t));
    const voice = this.makeVoice(midi, velocity, t);
    if (!voice) return;
    this.held.set(midi, [voice]);
    this.track(voice);
  }

  noteOff(midi: number, when = 0) {
    if (!this.ctx) return;
    const t = Math.max(when, this.ctx.currentTime);
    const voices = this.held.get(midi);
    if (!voices) return;
    this.held.delete(midi);
    for (const v of voices) {
      if (this.sustainOn) this.sustained.add(v);
      else v.release(t);
    }
  }

  /** Fire-and-forget note for playback; ignores the pedal. */
  playNote(midi: number, durationSec: number, velocity = 0.7, when = 0) {
    const ctx = this.ensure();
    const t = Math.max(when, ctx.currentTime);
    const voice = this.makeVoice(midi, velocity, t);
    if (!voice) return;
    voice.release(t + Math.max(0.08, durationSec));
    this.track(voice);
  }

  setSustain(on: boolean) {
    this.sustainOn = on;
    if (!on && this.ctx) {
      const t = this.ctx.currentTime;
      this.sustained.forEach((v) => v.release(t));
      this.sustained.clear();
    }
  }

  allNotesOff() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.all.forEach((v) => v.release(t));
    this.held.clear();
    this.sustained.clear();
  }

  /** Metronome tick. */
  click(when: number, accent: boolean) {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = accent ? 1760 : 1320;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    osc.connect(g).connect(this.clickBus);
    osc.start(when);
    osc.stop(when + 0.06);
  }

  private track(v: Voice) {
    this.all.push(v);
    if (this.all.length > 96) {
      this.all = this.all.filter((x) => !x.stopped);
      while (this.all.length > 80) this.all.shift()!.release(this.now);
    }
  }

  private makeVoice(midi: number, velocity: number, t: number): Voice | null {
    const ctx = this.ctx!;
    const vel = Math.max(0.05, Math.min(1, velocity));
    if (this.instrument === 'piano') {
      const key = this.nearestSample(midi);
      if (key !== null) return pianoVoice(ctx, this.bus, this.samples.get(key)!, midi, key, vel, t);
      return synthVoice(ctx, this.bus, 'epiano', midi, vel, t);
    }
    return synthVoice(ctx, this.bus, this.instrument, midi, vel, t);
  }
}

function pianoVoice(ctx: AudioContext, out: AudioNode, buffer: AudioBuffer, midi: number, sampleKey: number, vel: number, t: number): Voice {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = Math.pow(2, (midi - sampleKey) / 12);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1800 + vel * 9000;
  const g = ctx.createGain();
  g.gain.value = Math.pow(vel, 1.4) * 0.95;
  src.connect(tone).connect(g).connect(out);
  src.start(t);
  const voice: Voice = {
    midi,
    start: t,
    stopped: false,
    release(when) {
      if (voice.stopped) return;
      voice.stopped = true;
      const at = Math.max(when, t + 0.02);
      g.gain.setTargetAtTime(0, at, 0.09);
      try {
        src.stop(at + 0.9);
      } catch {
        /* already stopped */
      }
    },
  };
  src.onended = () => {
    voice.stopped = true;
    src.disconnect();
    g.disconnect();
  };
  return voice;
}

function synthVoice(ctx: AudioContext, out: AudioNode, kind: Exclude<InstrumentId, 'piano'>, midi: number, vel: number, t: number): Voice {
  const f = midiToFreq(midi);
  const amp = ctx.createGain();
  amp.gain.value = 0;
  amp.connect(out);
  const nodes: (OscillatorNode | AudioScheduledSourceNode)[] = [];
  const osc = (type: OscillatorType, freq: number) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    nodes.push(o);
    return o;
  };
  let releaseTau = 0.08;

  if (kind === 'epiano') {
    const car = osc('sine', f);
    const mod = osc('sine', f);
    const idx = ctx.createGain();
    idx.gain.setValueAtTime(f * 2.4 * vel, t);
    idx.gain.setTargetAtTime(f * 0.25, t, 0.35);
    mod.connect(idx).connect(car.frequency);
    const tine = osc('sine', f * 7.01);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.06 * vel, t);
    tg.gain.setTargetAtTime(0, t, 0.05);
    tine.connect(tg).connect(amp);
    car.connect(amp);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.42 * vel, t + 0.005);
    amp.gain.setTargetAtTime(0, t + 0.005, 1.4);
    releaseTau = 0.12;
  } else if (kind === 'musicbox') {
    const car = osc('sine', f * 2);
    const mod = osc('sine', f * 2 * 3.5);
    const idx = ctx.createGain();
    idx.gain.setValueAtTime(f * 3 * vel, t);
    idx.gain.setTargetAtTime(0, t, 0.08);
    mod.connect(idx).connect(car.frequency);
    car.connect(amp);
    const shimmer = osc('sine', f * 8);
    const sg = ctx.createGain();
    sg.gain.value = 0.08;
    shimmer.connect(sg).connect(amp);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.32 * vel, t + 0.002);
    amp.gain.setTargetAtTime(0, t + 0.002, 0.55);
    releaseTau = 0.25;
  } else if (kind === 'pad') {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(600, t);
    lp.frequency.linearRampToValueAtTime(1400 + vel * 1200, t + 0.6);
    lp.connect(amp);
    for (const cents of [-7, 7]) {
      const o = osc('sawtooth', f);
      o.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = 0.18;
      o.connect(g).connect(lp);
    }
    const sub = osc('triangle', f / 2);
    const sg = ctx.createGain();
    sg.gain.value = 0.22;
    sub.connect(sg).connect(lp);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.5 * vel, t + 0.22);
    amp.gain.setTargetAtTime(0.32 * vel, t + 0.22, 0.6);
    releaseTau = 0.35;
  } else {
    const sq = osc('square', f);
    const vib = osc('sine', 5.5);
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(f * 0.006, t + 0.35);
    vib.connect(vg).connect(sq.frequency);
    const g = ctx.createGain();
    g.gain.value = 0.16;
    sq.connect(g).connect(amp);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(vel, t + 0.003);
    amp.gain.setTargetAtTime(0.6 * vel, t + 0.003, 0.2);
    releaseTau = 0.03;
  }

  nodes.forEach((n) => n.start(t));
  const voice: Voice = {
    midi,
    start: t,
    stopped: false,
    release(when) {
      if (voice.stopped) return;
      voice.stopped = true;
      const at = Math.max(when, t + 0.01);
      amp.gain.cancelScheduledValues(at);
      amp.gain.setTargetAtTime(0, at, releaseTau);
      const end = at + releaseTau * 8 + 0.05;
      nodes.forEach((n) => {
        try {
          n.stop(end);
        } catch {
          /* already stopped */
        }
      });
      setTimeout(() => amp.disconnect(), (end - ctx.currentTime) * 1000 + 200);
    },
  };
  // Synth tones without an explicit release still die away; make sure they get collected.
  const natural = kind === 'pad' || kind === 'chip' ? 12 : 6;
  setTimeout(() => voice.release(ctx.currentTime), (t - ctx.currentTime + natural) * 1000);
  return voice;
}

function makeImpulse(ctx: AudioContext, seconds: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const decay = Math.pow(1 - i / len, 3.2);
      // A touch of smoothing takes the hiss off the tail.
      last = last * 0.55 + (Math.random() * 2 - 1) * 0.45;
      data[i] = last * decay * (i < rate * 0.01 ? i / (rate * 0.01) : 1);
    }
  }
  return buf;
}

export const audio = new AudioEngine();
