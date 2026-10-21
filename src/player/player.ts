import { audio } from '../audio/engine.ts';
import { beatsToSeconds, type Hand, type Note, type Song } from '../lib/notes.ts';

export type Mode = 'listen' | 'learn' | 'play';
export type HandsChoice = 'both' | Hand;
export type Status = 'idle' | 'playing' | 'paused' | 'done';
export type Rating = 'perfect' | 'good' | 'miss';

export interface PNote extends Note {
  id: number;
  sec: number;
  endSec: number;
  /** Played by the learner (true) or by the app (false). */
  user: boolean;
  judged?: Rating;
  scheduled?: boolean;
  sounding?: boolean;
}

export interface Step {
  sec: number;
  notes: PNote[];
}

export interface Stats {
  perfect: number;
  good: number;
  miss: number;
  wrong: number;
  combo: number;
  bestCombo: number;
}

export interface Result {
  accuracy: number;
  stars: number;
  stats: Stats;
  mode: Mode;
}

export interface PlayerEvents {
  /** The app starts or stops sounding a note (for key highlights and bubble streams). */
  autoNote(midi: number, on: boolean): void;
  rating(midi: number, rating: Rating | 'wrong'): void;
  finished(result: Result): void;
}

const LOOKAHEAD_REAL = 0.12;
const WIN_PERFECT = 0.075;
const WIN_GOOD = 0.16;

const emptyStats = (): Stats => ({ perfect: 0, good: 0, miss: 0, wrong: 0, combo: 0, bestCombo: 0 });

class Player {
  song: Song | null = null;
  mode: Mode = 'learn';
  hands: HandsChoice = 'both';
  speed = 1;
  metronome = false;
  status: Status = 'idle';
  /** Position in song seconds at normal speed. */
  songSec = 0;
  notes: PNote[] = [];
  steps: Step[] = [];
  stepIndex = 0;
  /** Index of the step the prompter shows as "now". */
  promptIndex = 0;
  stats: Stats = emptyStats();
  lastResult: Result | null = null;
  range: [number, number] = [21, 108];
  /** Song seconds of falling notes visible above the keys. */
  lookSec = 3;

  private satisfied = new Set<number>();
  private lastBeatScheduled = -1;
  private endSec = 0;
  private listeners = new Set<() => void>();
  version = 0;
  events: PlayerEvents = { autoNote() {}, rating() {}, finished() {} };

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = () => this.version;
  private emit() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  get waiting() {
    const s = this.steps[this.stepIndex];
    return this.mode === 'learn' && this.status === 'playing' && !!s && this.songSec >= s.sec - 1e-6;
  }

  get progress() {
    if (!this.endSec) return 0;
    return Math.max(0, Math.min(1, this.songSec / this.endSec));
  }

  load(song: Song | null) {
    this.stopSounding();
    this.song = song;
    this.status = 'idle';
    this.lastResult = null;
    this.rebuild();
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.reset();
  }

  setHands(h: HandsChoice) {
    this.hands = h;
    this.reset();
  }

  setSpeed(s: number) {
    this.speed = Math.max(0.25, Math.min(1.5, s));
    this.emit();
  }

  setRange(r: [number, number]) {
    if (r[0] === this.range[0] && r[1] === this.range[1]) return;
    this.range = r;
    if (this.status === 'playing' || this.status === 'paused') {
      // Keep position, only re-decide which notes are the learner's.
      this.markUserNotes();
      this.buildSteps();
      this.emit();
    } else this.rebuild();
  }

  /** Notes the learner is asked to play with the current hands, mode and keyboard range. */
  private isUserNote(n: Note) {
    if (this.mode === 'listen') return false;
    if (this.hands !== 'both' && n.hand !== this.hands) return false;
    return n.midi >= this.range[0] && n.midi <= this.range[1];
  }

  private rebuild() {
    const song = this.song;
    if (!song) {
      this.notes = [];
      this.steps = [];
      this.endSec = 0;
      this.reset();
      return;
    }
    let id = 0;
    this.notes = song.notes
      .map((n) => {
        const sec = beatsToSeconds(n.time, song.bpm);
        const endSec = beatsToSeconds(n.time + n.dur, song.bpm);
        return { ...n, id: id++, sec, endSec, user: false };
      })
      .sort((a, b) => a.sec - b.sec || a.midi - b.midi);
    this.endSec = this.notes.reduce((m, n) => Math.max(m, n.endSec), 0);
    this.reset();
  }

  private markUserNotes() {
    for (const n of this.notes) n.user = this.isUserNote(n);
  }

  private buildSteps() {
    const steps: Step[] = [];
    for (const n of this.notes) {
      // In Listen mode the prompter follows every note; otherwise only the learner's notes.
      if (!n.user && this.mode !== 'listen') continue;
      const last = steps[steps.length - 1];
      if (last && Math.abs(last.sec - n.sec) < 0.02) last.notes.push(n);
      else steps.push({ sec: n.sec, notes: [n] });
    }
    this.steps = steps;
    this.stepIndex = Math.min(this.stepIndex, steps.length);
    while (this.stepIndex < steps.length && steps[this.stepIndex].notes.every((n) => n.judged)) this.stepIndex++;
    if (this.mode === 'listen') this.stepIndex = steps.length;
  }

  /** Back to the start of the song without playing. */
  reset() {
    this.stopSounding();
    this.markUserNotes();
    for (const n of this.notes) {
      n.judged = undefined;
      n.scheduled = false;
      n.sounding = false;
    }
    this.stepIndex = 0;
    this.buildSteps();
    this.promptIndex = 0;
    this.satisfied.clear();
    this.stats = emptyStats();
    this.songSec = -this.leadIn();
    this.lastBeatScheduled = Math.floor(this.songSec * (this.song ? this.song.bpm / 60 : 1)) - 1;
    if (this.status !== 'idle') this.status = 'idle';
    this.emit();
  }

  private leadIn() {
    // Enough room for the first notes to be seen falling, without a long wait.
    return Math.min(1.6, this.lookSec * 0.45);
  }

  start() {
    if (!this.song) return;
    audio.ensure();
    if (this.status === 'done') this.reset();
    this.status = 'playing';
    this.emit();
  }

  pause() {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.stopSounding();
    this.emit();
  }

  toggle() {
    if (this.status === 'playing') this.pause();
    else this.start();
  }

  restart() {
    const wasPlaying = this.status === 'playing';
    this.status = 'idle';
    this.reset();
    if (wasPlaying) this.start();
  }

  private stopSounding() {
    for (const n of this.notes) {
      if (n.sounding) {
        n.sounding = false;
        this.events.autoNote(n.midi, false);
      }
      // Anything scheduled but not yet audible gets re-scheduled after a resume.
      if (n.scheduled && n.sec > this.songSec) n.scheduled = false;
    }
  }

  /** Advance the clock. Called once per animation frame with real elapsed seconds. */
  tick(dtReal: number) {
    if (this.status !== 'playing' || !this.song) return;
    const dt = Math.min(dtReal, 0.1) * this.speed;
    let next = this.songSec + dt;

    if (this.mode === 'learn') {
      const pending = this.steps[this.stepIndex];
      if (pending && next > pending.sec) next = pending.sec;
    }
    this.songSec = next;

    this.scheduleAudio();
    this.updateSounding();
    if (this.mode === 'play') this.judgeMisses();
    this.updatePrompt();

    if (this.songSec >= this.endSec + 0.6) this.finish();
  }

  /** Hand notes to the audio engine slightly ahead of time so timing stays tight. */
  private scheduleAudio() {
    const ahead = LOOKAHEAD_REAL * this.speed;
    const limitSec = this.mode === 'learn' && this.steps[this.stepIndex]
      ? Math.min(this.songSec + ahead, this.steps[this.stepIndex].sec - 1e-4)
      : this.songSec + ahead;
    const now = audio.now;
    for (const n of this.notes) {
      if (n.sec > limitSec) break;
      if (n.scheduled || n.user) continue;
      n.scheduled = true;
      if (n.endSec < this.songSec) continue;
      const when = now + Math.max(0, (n.sec - this.songSec) / this.speed);
      audio.playNote(n.midi, (n.endSec - Math.max(n.sec, this.songSec)) / this.speed, 0.62 + (n.hand === 'R' ? 0.08 : 0), when);
    }
    if (this.metronome && this.song) {
      const spb = 60 / this.song.bpm;
      const lastBeat = Math.floor(limitSec / spb);
      for (let b = this.lastBeatScheduled + 1; b <= lastBeat; b++) {
        if (b >= 0) audio.click(now + Math.max(0, (b * spb - this.songSec) / this.speed), b % 4 === 0);
      }
      this.lastBeatScheduled = Math.max(this.lastBeatScheduled, lastBeat);
    }
  }

  private updateSounding() {
    for (const n of this.notes) {
      if (n.sec > this.songSec + 0.001) break;
      if (n.user) continue;
      const on = this.songSec < n.endSec - 0.01;
      if (on !== !!n.sounding) {
        n.sounding = on;
        this.events.autoNote(n.midi, on);
      }
    }
  }

  private judgeMisses() {
    const win = WIN_GOOD * this.speed;
    let changed = false;
    for (const n of this.notes) {
      if (n.sec > this.songSec) break;
      if (!n.user || n.judged) continue;
      if (this.songSec - n.sec > win) {
        n.judged = 'miss';
        this.stats.miss++;
        this.stats.combo = 0;
        this.events.rating(n.midi, 'miss');
        changed = true;
      }
    }
    if (changed) {
      this.advanceSteps();
      this.emit();
    }
  }

  private advanceSteps() {
    while (this.stepIndex < this.steps.length && this.steps[this.stepIndex].notes.every((n) => n.judged)) this.stepIndex++;
  }

  private updatePrompt() {
    let idx: number;
    if (this.mode === 'learn') idx = this.stepIndex;
    else {
      idx = this.steps.findIndex((s) => s.sec > this.songSec - 0.05);
      if (idx < 0) idx = this.steps.length;
    }
    if (idx !== this.promptIndex) {
      this.promptIndex = idx;
      this.emit();
    }
  }

  /** The learner pressed a key. */
  userNote(midi: number) {
    if (this.status !== 'playing' || this.mode === 'listen') return;
    if (this.mode === 'learn') this.learnPress(midi);
    else this.playPress(midi);
  }

  private learnPress(midi: number) {
    const pending = this.steps[this.stepIndex];
    if (!pending) return;
    const match = pending.notes.find((n) => n.midi === midi && !this.satisfied.has(n.id));
    if (!match) {
      if (pending.notes.some((n) => n.midi === midi)) return; // a repeat of a key already pressed
      this.stats.wrong++;
      this.stats.combo = 0;
      this.events.rating(midi, 'wrong');
      this.emit();
      return;
    }
    this.satisfied.add(match.id);
    if (pending.notes.every((n) => this.satisfied.has(n.id))) {
      const early = pending.sec - this.songSec;
      for (const n of pending.notes) {
        n.judged = early > 1.2 * this.speed ? 'good' : 'perfect';
        if (n.judged === 'perfect') this.stats.perfect++;
        else this.stats.good++;
      }
      this.stats.combo++;
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.combo);
      this.events.rating(midi, pending.notes[0].judged!);
      this.satisfied.clear();
      // Playing ahead of the clock pulls the song forward to you.
      if (this.songSec < pending.sec) this.songSec = pending.sec;
      this.stepIndex++;
      this.updatePrompt();
      this.emit();
    }
  }

  private playPress(midi: number) {
    let best: PNote | null = null;
    for (const n of this.notes) {
      if (n.sec > this.songSec + WIN_GOOD * this.speed) break;
      if (!n.user || n.judged || n.midi !== midi) continue;
      if (Math.abs(n.sec - this.songSec) > WIN_GOOD * this.speed) continue;
      if (!best || Math.abs(n.sec - this.songSec) < Math.abs(best.sec - this.songSec)) best = n;
    }
    if (!best) {
      this.stats.wrong++;
      this.stats.combo = 0;
      this.events.rating(midi, 'wrong');
      this.emit();
      return;
    }
    const off = Math.abs(best.sec - this.songSec) / this.speed;
    best.judged = off <= WIN_PERFECT ? 'perfect' : 'good';
    this.stats[best.judged]++;
    this.stats.combo++;
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.combo);
    this.events.rating(midi, best.judged);
    this.advanceSteps();
    this.emit();
  }

  private finish() {
    this.stopSounding();
    this.status = 'done';
    const s = this.stats;
    const total = s.perfect + s.good + s.miss + s.wrong;
    const accuracy = this.mode === 'listen' || total === 0 ? 1 : (s.perfect + s.good * 0.7) / total;
    const stars = this.mode === 'listen' ? 0 : accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : accuracy >= 0.55 ? 1 : 0;
    this.lastResult = { accuracy, stars, stats: { ...s }, mode: this.mode };
    this.emit();
    this.events.finished(this.lastResult);
  }

  /** Midis the learner should press right now (for key hints). */
  expected(): number[] {
    if (this.status === 'idle' || this.mode === 'listen') {
      const first = this.steps[0];
      return this.mode !== 'listen' && first ? first.notes.map((n) => n.midi) : [];
    }
    const s = this.mode === 'learn' ? this.steps[this.stepIndex] : this.steps[this.promptIndex];
    if (!s) return [];
    if (this.mode === 'play' && s.sec - this.songSec > 0.9 * this.speed) return [];
    return s.notes.filter((n) => !this.satisfied.has(n.id) && !n.judged).map((n) => n.midi);
  }
}

export const player = new Player();
