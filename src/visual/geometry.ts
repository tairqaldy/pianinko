import { isBlack } from '../lib/notes.ts';

export interface KeyRect {
  midi: number;
  /** Left edge and width as fractions of the keyboard width (0–1). */
  x: number;
  w: number;
  black: boolean;
}

/** Visible piano range for a given keyboard width: full 61 keys on desktop, fewer on phones. */
export function visibleRange(width: number, baseMidi: number): [number, number] {
  if (width >= 980) return [36, 96]; // C2–C7
  if (width >= 640) return [Math.max(24, baseMidi - 12), Math.min(108, baseMidi + 36)];
  return [baseMidi, Math.min(108, baseMidi + 24)];
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
