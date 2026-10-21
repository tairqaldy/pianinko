/**
 * The canvas above the keys: falling guide notes, the pastel bubble streams that rise from every
 * played key, and small rating pop-ups. The loop only runs while something moves.
 */
import { HAND_PASTEL, pitchPastel } from '../lib/notes.ts';
import { player, type Rating } from '../player/player.ts';
import type { KeyRect } from './geometry.ts';

interface Stream {
  midi: number;
  color: string;
  born: number;
  released: number | null;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  color: string;
  phase: number;
}

interface Popup {
  midi: number;
  text: string;
  born: number;
  strong: boolean;
}

const RISE = 150; // px per second
const INK = '#121212';
const MAX_BUBBLES = 260;

export class Sky {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private keys = new Map<number, KeyRect>();
  private streams: Stream[] = [];
  private bubbles: Bubble[] = [];
  private popups: Popup[] = [];
  private held = new Map<number, Stream>();
  private raf = 0;
  private last = 0;
  private lastSpawn = 0;
  labelFor: (midi: number) => string | null = () => null;
  reducedMotion = false;
  onFrame: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d')!;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  resize(width: number, height: number) {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = width;
    this.h = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    player.lookSec = Math.max(2.2, Math.min(4, height / 140));
    this.kick();
  }

  setKeys(keys: Map<number, KeyRect>) {
    this.keys = keys;
    this.kick();
  }

  noteOn(midi: number, auto = false) {
    const now = performance.now() / 1000;
    this.held.get(midi) && (this.held.get(midi)!.released = now);
    const s: Stream = { midi, color: pitchPastel(midi), born: now, released: null };
    this.streams.push(s);
    this.held.set(midi, s);
    this.burst(midi, auto ? 3 : 6, now);
    this.kick();
  }

  noteOff(midi: number) {
    const s = this.held.get(midi);
    if (s) s.released = performance.now() / 1000;
    this.held.delete(midi);
    this.kick();
  }

  rating(midi: number, r: Rating | 'wrong') {
    if (r === 'wrong') return;
    const text = r === 'perfect' ? 'Perfect' : r === 'good' ? 'Good' : 'Miss';
    this.popups.push({ midi, text, born: performance.now() / 1000, strong: r !== 'miss' });
    if (this.popups.length > 12) this.popups.shift();
    this.kick();
  }

  clear() {
    this.streams = [];
    this.bubbles = [];
    this.popups = [];
    this.held.clear();
    this.kick();
  }

  private burst(midi: number, count: number, now: number) {
    const k = this.keys.get(midi);
    if (!k || this.reducedMotion) return;
    const cx = (k.x + k.w / 2) * this.w;
    const span = k.w * this.w;
    for (let i = 0; i < count && this.bubbles.length < MAX_BUBBLES; i++) {
      this.bubbles.push({
        x: cx + (Math.random() - 0.5) * span * 0.9,
        y: this.h - 4 - Math.random() * 10,
        r: 2.5 + Math.random() * 5.5,
        vx: (Math.random() - 0.5) * 30,
        vy: -(55 + Math.random() * 90),
        born: now,
        life: 1.4 + Math.random() * 1.6,
        color: pitchPastel(midi),
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /** Make sure a frame is coming. */
  kick() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame = (t: number) => {
    this.raf = 0;
    const dt = Math.min(0.1, (t - this.last) / 1000);
    this.last = t;
    player.tick(dt);
    this.onFrame();
    const busy = this.draw(t / 1000, dt);
    if (busy || player.status === 'playing') this.raf = requestAnimationFrame(this.frame);
  };

  private draw(now: number, dt: number): boolean {
    const g = this.g;
    const { w, h } = this;
    if (!w || !h) return false;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    if (player.song) this.drawGuide();

    // Bubble streams.
    const alive: Stream[] = [];
    for (const s of this.streams) {
      const k = this.keys.get(s.midi);
      if (!k) continue;
      const top = h - (now - s.born) * RISE;
      const bottom = s.released === null ? h : h - (now - s.released) * RISE;
      const len = Math.max(bottom - top, 22);
      const y0 = bottom - len;
      if (bottom < -10) continue;
      alive.push(s);
      const fade = Math.max(0, Math.min(1, bottom / h));
      const ww = k.w * w * (k.black ? 0.8 : 0.66);
      const x = (k.x + k.w / 2) * w - ww / 2;
      const grad = g.createLinearGradient(0, bottom, 0, y0);
      grad.addColorStop(0, s.color);
      grad.addColorStop(1, s.color + '55');
      g.globalAlpha = s.released === null ? 1 : 0.25 + fade * 0.75;
      g.fillStyle = grad;
      roundRect(g, x, y0, ww, bottom - y0, Math.min(ww / 2, 16));
      g.fill();
      // A soft highlight down one side gives the capsule a bubbly, glassy look.
      g.globalAlpha *= 0.55;
      g.fillStyle = '#FFFFFF';
      roundRect(g, x + ww * 0.18, y0 + Math.min(10, (bottom - y0) * 0.2), Math.max(2, ww * 0.12), Math.max(0, (bottom - y0) * 0.5), ww * 0.06);
      g.fill();
      g.globalAlpha = 1;
    }
    this.streams = alive;

    // Held notes keep breathing out bubbles.
    if (!this.reducedMotion && this.held.size && now - this.lastSpawn > 0.09) {
      this.lastSpawn = now;
      for (const s of this.held.values()) {
        const k = this.keys.get(s.midi);
        if (!k || this.bubbles.length >= MAX_BUBBLES) continue;
        const top = Math.max(h - (now - s.born) * RISE, 0);
        this.bubbles.push({
          x: (k.x + k.w / 2) * w + (Math.random() - 0.5) * k.w * w,
          y: top + 6,
          r: 2 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 24,
          vy: -(40 + Math.random() * 60),
          born: now,
          life: 1.2 + Math.random() * 1.2,
          color: s.color,
          phase: Math.random() * 6,
        });
      }
    }

    const keep: Bubble[] = [];
    for (const b of this.bubbles) {
      const age = now - b.born;
      if (age > b.life) continue;
      b.x += (b.vx + Math.sin(age * 3 + b.phase) * 14) * dt;
      b.y += b.vy * dt;
      if (b.y < -10) continue;
      keep.push(b);
      const a = 1 - age / b.life;
      g.globalAlpha = Math.min(1, a * 1.4);
      g.fillStyle = b.color;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = a * 0.8;
      g.fillStyle = '#FFFFFF';
      g.beginPath();
      g.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2);
      g.fill();
    }
    this.bubbles = keep;
    g.globalAlpha = 1;

    // Rating pop-ups.
    const popKeep: Popup[] = [];
    g.textAlign = 'center';
    g.font = '800 15px "Fira Sans Extra Condensed", "Arial Narrow", sans-serif';
    for (const p of this.popups) {
      const age = now - p.born;
      if (age > 0.75) continue;
      popKeep.push(p);
      const k = this.keys.get(p.midi);
      if (!k) continue;
      g.globalAlpha = 1 - age / 0.75;
      g.fillStyle = p.strong ? INK : '#8E8E89';
      g.fillText(p.text.toUpperCase(), (k.x + k.w / 2) * w, h - 26 - age * 46);
    }
    this.popups = popKeep;
    g.globalAlpha = 1;

    return this.streams.length > 0 || this.bubbles.length > 0 || this.popups.length > 0 || this.held.size > 0;
  }

  private drawGuide() {
    const g = this.g;
    const { w, h } = this;
    const song = player.song!;
    const pps = (h - 8) / player.lookSec;
    const t = player.songSec;

    // Beat lines: faint every beat, firmer every four.
    const spb = 60 / song.bpm;
    const firstBeat = Math.ceil(t / spb);
    const lastBeat = Math.floor((t + player.lookSec) / spb);
    for (let b = Math.max(0, firstBeat); b <= lastBeat; b++) {
      const y = h - (b * spb - t) * pps;
      g.fillStyle = b % 4 === 0 ? '#EDEDE8' : '#F6F6F3';
      g.fillRect(0, Math.round(y), w, 1);
    }

    const expected = new Set(player.expected());
    const waiting = player.waiting;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';

    for (const n of player.notes) {
      if (n.sec > t + player.lookSec) break;
      if (n.endSec < t - 0.05 && !(waiting && n.user && !n.judged)) continue;
      const k = this.keys.get(n.midi);
      if (!k) continue;
      let bottom = h - (n.sec - t) * pps;
      let top = h - (n.endSec - t) * pps;
      if (bottom > h) bottom = h;
      if (bottom - top < 14) top = bottom - 14;
      if (top >= h) continue;
      const pad = k.black ? 1 : Math.max(2, k.w * w * 0.1);
      const x = k.x * w + pad;
      const nw = k.w * w - pad * 2;
      const r = Math.min(10, nw / 2);

      if (!n.user && player.mode !== 'listen') {
        g.globalAlpha = 0.55;
        g.fillStyle = HAND_PASTEL[n.hand];
        roundRect(g, x, top, nw, bottom - top, r);
        g.fill();
        g.globalAlpha = 1;
        continue;
      }
      if (n.judged === 'perfect' || n.judged === 'good') continue;
      const isNow = expected.has(n.midi) && Math.abs(n.sec - (player.steps[player.mode === 'learn' ? player.stepIndex : player.promptIndex]?.sec ?? -99)) < 0.03;
      g.fillStyle = n.judged === 'miss' ? '#ECEBE6' : HAND_PASTEL[n.hand];
      roundRect(g, x, top, nw, bottom - top, r);
      g.fill();
      if (isNow) {
        g.lineWidth = 2;
        g.strokeStyle = INK;
        if (waiting) {
          g.globalAlpha = 0.25 + pulse * 0.35;
          g.fillStyle = HAND_PASTEL[n.hand];
          roundRect(g, x - 4, top - 4, nw + 8, bottom - top + 8, r + 4);
          g.fill();
          g.globalAlpha = 1;
        }
        roundRect(g, x + 1, top + 1, nw - 2, bottom - top - 2, Math.max(1, r - 1));
        g.stroke();
      }
      const label = this.labelFor(n.midi);
      if (label && nw >= 14 && bottom - top >= 18) {
        g.fillStyle = n.judged === 'miss' ? '#8E8E89' : INK;
        g.font = `800 ${Math.min(15, Math.max(10, nw * 0.5))}px "Fira Sans Extra Condensed", "Arial Narrow", sans-serif`;
        g.fillText(label, x + nw / 2, bottom - 6);
      }
    }

    // The line the notes land on.
    g.fillStyle = '#E4E4DF';
    g.fillRect(0, h - 1, w, 1);
  }
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}
