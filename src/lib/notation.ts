/**
 * Pianinko notation — a small, forgiving text format for writing songs by hand.
 *
 *   tempo: 96
 *   R: E5:0.5 D#5:0.5 | E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1.5
 *   L: r:3 | r:1.5 [A2 E3 A3]:1.5
 *
 * - A note is a letter A–G, an optional # or b, and an optional octave (C4 is middle C).
 *   Leave the octave out and the previous note's octave in that hand is used (starts at 4).
 * - Duration in beats follows a colon: C4:2, C4:0.5, C4:1/3. No colon means one beat.
 *   Each trailing dash holds one more beat: G4-- lasts three beats.
 * - r (or _) is a rest and takes the same durations: r:2.
 * - [C4 E4 G4]:2 is a chord.
 * - Lines starting with R: or L: pick the hand; each hand keeps its own timeline from 0.
 * - | bar lines are ignored, // starts a comment.
 *
 * Letter sheets (the virtualpiano.net style "t y u [tu] o") are parsed by parseLetters.
 */
import { letterToMidi, type Hand, type Note, type NotationFormat } from './notes.ts';

export interface ParseError {
  line: number;
  token: string;
  message: string;
}

export interface ParseResult {
  notes: Note[];
  bpm?: number;
  errors: ParseError[];
}

const NOTE_RE = /^([A-Ga-g])([#b]?)(\d)?(.*)$/;
const REST_RE = /^[rR_](.*)$/;
const DUR_RE = /^(?::(\d+(?:\.\d+)?(?:\/\d+)?|\.\d+))?(-*)$/;
const TOKEN_RE = /\[[^\]]*\]\S*|[^\s[\]]+/g;

function parseDuration(suffix: string): number | null {
  const m = DUR_RE.exec(suffix);
  if (!m) return null;
  let beats = 1;
  if (m[1]) {
    if (m[1].includes('/')) {
      const [a, b] = m[1].split('/').map(Number);
      beats = b ? a / b : NaN;
    } else beats = Number(m[1]);
  }
  beats += m[2].length;
  return Number.isFinite(beats) && beats > 0 ? beats : null;
}

export function parseNotation(text: string): ParseResult {
  const notes: Note[] = [];
  const errors: ParseError[] = [];
  const cursor: Record<Hand, number> = { R: 0, L: 0 };
  const octave: Record<Hand, number> = { R: 4, L: 3 };
  let hand: Hand = 'R';
  let bpm: number | undefined;

  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    let line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) return;

    const tempo = /^(?:tempo|bpm)\s*[:=]?\s*(\d{2,3})\s*$/i.exec(line);
    if (tempo) {
      bpm = Number(tempo[1]);
      return;
    }
    // "R:" / "L:" pick the hand; "r:0.5" at the start of a line is a rest, not a hand.
    const voice = /^(RH|LH|R|L)\s*:(?!\s*[\d.])/i.exec(line);
    if (voice) {
      hand = voice[1].toUpperCase().startsWith('L') ? 'L' : 'R';
      line = line.slice(voice[0].length);
    }

    const parsePitch = (tok: string): { midi: number; rest: string } | null => {
      const m = NOTE_RE.exec(tok);
      if (!m) return null;
      // "b" alone is the note B, "bb" is B flat; a lowercase b after a letter is a flat.
      const oct = m[3] !== undefined ? Number(m[3]) : octave[hand];
      octave[hand] = oct;
      return { midi: letterToMidi(m[1], m[2], oct), rest: m[4] };
    };

    for (const tok of line.match(TOKEN_RE) ?? []) {
      if (/^\|+$/.test(tok)) continue;

      if (tok.startsWith('[')) {
        const close = tok.indexOf(']');
        const inner = tok.slice(1, close).trim().split(/\s+/).filter(Boolean);
        const dur = parseDuration(tok.slice(close + 1));
        if (dur === null || inner.length === 0) {
          errors.push({ line: lineNo, token: tok, message: 'This chord is not readable. Write it like [C4 E4 G4]:2' });
          continue;
        }
        for (const part of inner) {
          const p = parsePitch(part);
          if (!p) {
            errors.push({ line: lineNo, token: part, message: `"${part}" is not a note. Use letters A–G, like C4 or F#3.` });
            continue;
          }
          notes.push({ midi: p.midi, time: cursor[hand], dur, hand });
        }
        cursor[hand] += dur;
        continue;
      }

      const rest = REST_RE.exec(tok);
      if (rest && !NOTE_RE.test(tok)) {
        const dur = parseDuration(rest[1]);
        if (dur === null) errors.push({ line: lineNo, token: tok, message: 'Rests take a duration like r or r:2.' });
        else cursor[hand] += dur;
        continue;
      }

      const p = parsePitch(tok);
      if (!p) {
        errors.push({ line: lineNo, token: tok, message: `"${tok}" is not a note. Use letters A–G, like C4 or F#3.` });
        continue;
      }
      const dur = parseDuration(p.rest);
      if (dur === null) {
        errors.push({ line: lineNo, token: tok, message: `The length of "${tok}" is not readable. Try ${tok.replace(/[:\-].*$/, '')}:2` });
        continue;
      }
      notes.push({ midi: p.midi, time: cursor[hand], dur, hand });
      cursor[hand] += dur;
    }
  });

  notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
  return { notes, bpm, errors };
}

/* ---------- Letter sheets (virtualpiano.net layout) ---------- */

/** White keys from C2 to C7, in the order they sit on a virtual-piano keyboard. */
export const VP_WHITE = '1234567890qwertyuiopasdfghjklzxcvbnm';
const VP_WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
export const vpWhiteMidi = (index: number) => 36 + Math.floor(index / 7) * 12 + VP_WHITE_PCS[index % 7];

/** Shifted characters: the sharp just above the white key they sit on. */
export const VP_BLACK: Record<string, number> = {
  '!': 37, '@': 39, '$': 42, '%': 44, '^': 46, '*': 49, '(': 51,
  Q: 54, W: 56, E: 58, T: 61, Y: 63, I: 66, O: 68, P: 70,
  S: 73, D: 75, G: 78, H: 80, J: 82, L: 85, Z: 87, C: 90, V: 92, B: 94,
};

export function vpCharToMidi(ch: string): number | null {
  if (ch in VP_BLACK) return VP_BLACK[ch];
  const i = VP_WHITE.indexOf(ch);
  if (i >= 0) return vpWhiteMidi(i);
  const lower = VP_WHITE.indexOf(ch.toLowerCase());
  return lower >= 0 ? vpWhiteMidi(lower) : null;
}

const STEP = 0.5;

/**
 * Letter sheets have loose timing: each key or [chord] is half a beat, a space adds half a beat,
 * "|" or "-" adds a beat, and a new line adds a beat. Low notes go to the left hand.
 */
export function parseLetters(text: string): ParseResult {
  const events: { time: number; midis: number[] }[] = [];
  const errors: ParseError[] = [];
  let t = 0;
  const lines = text.replace(/\/\/.*$/gm, '').split(/\r?\n/);
  lines.forEach((line, li) => {
    if (!line.trim()) return;
    let i = 0;
    let pendingSpace = false;
    while (i < line.length) {
      const ch = line[i];
      if (ch === ' ' || ch === '\t') {
        pendingSpace = true;
        i++;
        continue;
      }
      if (pendingSpace) {
        t += STEP;
        pendingSpace = false;
      }
      if (ch === '|' || ch === '-') {
        t += 1;
        i++;
        continue;
      }
      if (ch === '[') {
        const close = line.indexOf(']', i);
        const inner = line.slice(i + 1, close < 0 ? undefined : close);
        const midis = [...inner].filter((c) => c.trim()).map(vpCharToMidi).filter((m): m is number => m !== null);
        if (midis.length) events.push({ time: t, midis });
        t += STEP;
        i = close < 0 ? line.length : close + 1;
        continue;
      }
      const midi = vpCharToMidi(ch);
      if (midi === null) {
        errors.push({ line: li + 1, token: ch, message: `"${ch}" is not a key on the letter layout.` });
      } else {
        events.push({ time: t, midis: [midi] });
        t += STEP;
      }
      i++;
    }
    t += 1;
  });

  const notes: Note[] = [];
  events.forEach((ev, k) => {
    const next = events.slice(k + 1).find((e) => e.time > ev.time);
    const dur = Math.min(2, Math.max(STEP, next ? next.time - ev.time : 1));
    for (const midi of ev.midis) notes.push({ midi, time: ev.time, dur, hand: midi < 60 ? 'L' : 'R' });
  });
  return { notes, errors };
}

export function detectFormat(text: string): NotationFormat {
  if (/^\s*(RH|LH|R|L)\s*:/im.test(text)) return 'notes';
  if (/(^|\s|\[)[A-G][#b]?\d(\s|$|:|-|\])/m.test(text)) return 'notes';
  return 'letters';
}

export function parseSongText(text: string, format: NotationFormat = detectFormat(text)): ParseResult {
  return format === 'letters' ? parseLetters(text) : parseNotation(text);
}

/* ---------- Writing notes back out as editable text ---------- */

const FRACTIONS: [number, string][] = [
  [1 / 3, '1/3'], [2 / 3, '2/3'], [1 / 6, '1/6'], [1 / 12, '1/12'],
];

function fmtDur(beats: number): string {
  const r = Math.round(beats * 1000) / 1000;
  if (Math.abs(r - 1) < 1e-3) return '';
  for (const [v, s] of FRACTIONS) if (Math.abs(r - v) < 0.01) return `:${s}`;
  return `:${Number(r.toFixed(3))}`;
}

const noteName = (midi: number) => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
};

export function toNotation(notes: Note[], bpm: number): string {
  const out = [`tempo: ${Math.round(bpm)}`];
  (['R', 'L'] as Hand[]).forEach((hand) => {
    const mine = notes.filter((n) => n.hand === hand).sort((a, b) => a.time - b.time);
    if (!mine.length) return;
    const groups: Note[][] = [];
    for (const n of mine) {
      const g = groups[groups.length - 1];
      if (g && Math.abs(g[0].time - n.time) < 1e-3) g.push(n);
      else groups.push([n]);
    }
    const tokens: string[] = [];
    let cursor = 0;
    groups.forEach((g, i) => {
      const time = g[0].time;
      if (time - cursor > 0.01) tokens.push(`r${fmtDur(time - cursor)}`);
      const nextTime = groups[i + 1]?.[0].time ?? Infinity;
      const dur = Math.max(0.05, Math.min(Math.max(...g.map((n) => n.dur)), nextTime - time));
      const pitch = g.length === 1 ? noteName(g[0].midi) : `[${g.map((n) => noteName(n.midi)).join(' ')}]`;
      tokens.push(pitch + fmtDur(dur));
      cursor = time + dur;
    });
    const lines: string[] = [];
    for (let i = 0; i < tokens.length; i += 12) lines.push(tokens.slice(i, i + 12).join(' '));
    out.push(`${hand}: ${lines[0]}`, ...lines.slice(1));
  });
  return out.join('\n');
}
