import { isBlack } from '../lib/notes.ts';

export interface KeyRect {
  midi: number;
  /** Left edge and width as fractions of the keyboard width (0–1). */
  x: number;
  w: number;
  black: boolean;
}

const downToC = (m: number) => m - (((m % 12) + 12) % 12);
const upToC = (m: number) => (m % 12 === 0 ? m : downToC(m) + 12);

/**
 * Visible piano range: on desktop at least C2–C7 and always everything the layout can play;
 * on smaller screens just the playable keys, and on phones the middle of them.
 */
export function visibleRange(width: number, playable: [number, number]): [number, number] {
  const lo = downToC(playable[0]);
  const hi = Math.min(108, upToC(playable[1]));
  if (width >= 980) return [Math.min(36, lo), Math.max(96, hi)];
  if (width >= 640) return [lo, hi];
  const mid = downToC(Math.round((playable[0] + playable[1]) / 2));
  return [mid - 12, mid + 12];
}

export function layoutKeys(lo: number, hi: number): Map<number, KeyRect> {
  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
  const ww = 1 / whites.length;
  const bw = ww * 0.6;
  const rects = new Map<number, KeyRect>();
  whites.forEach((m, i) => rects.set(m, { midi: m, x: i * ww, w: ww, black: false }));
  for (let m = lo + 1; m < hi; m++) {
    if (!isBlack(m)) continue;
    const next = rects.get(m + 1);
    if (!next) continue;
    rects.set(m, { midi: m, x: next.x - bw / 2, w: bw, black: true });
  }
  return rects;
}
