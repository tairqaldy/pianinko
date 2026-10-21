/**
 * Computer keyboard → piano. Keys are matched by physical position (KeyboardEvent.code),
 * so the layout works the same with any language layout switched on (ЙЦУКЕН included).
 */
import { VP_BLACK, VP_WHITE, vpWhiteMidi } from './notation.ts';
import { isBlack } from './notes.ts';

export type LayoutId = 'rows' | 'letters';

export const LAYOUTS: { id: LayoutId; name: string; hint: string }[] = [
  { id: 'rows', name: 'Piano rows', hint: 'Z–M and Q–P are white keys, the row above holds the black keys. Arrows move the octave.' },
  { id: 'letters', name: 'Letter sheets', hint: '1 to M covers five octaves, Shift plays the black key. Matches virtualpiano.net sheets.' },
];

type Slot = [code: string, offset: number, label: string];

const LOWER: Slot[] = [
  ['KeyZ', 0, 'Z'], ['KeyS', 1, 'S'], ['KeyX', 2, 'X'], ['KeyD', 3, 'D'], ['KeyC', 4, 'C'],
  ['KeyV', 5, 'V'], ['KeyG', 6, 'G'], ['KeyB', 7, 'B'], ['KeyH', 8, 'H'], ['KeyN', 9, 'N'],
  ['KeyJ', 10, 'J'], ['KeyM', 11, 'M'], ['Comma', 12, ','], ['KeyL', 13, 'L'], ['Period', 14, '.'],
  ['Semicolon', 15, ';'], ['Slash', 16, '/'],
];
const UPPER: Slot[] = [
  ['KeyQ', 12, 'Q'], ['Digit2', 13, '2'], ['KeyW', 14, 'W'], ['Digit3', 15, '3'], ['KeyE', 16, 'E'],
  ['KeyR', 17, 'R'], ['Digit5', 18, '5'], ['KeyT', 19, 'T'], ['Digit6', 20, '6'], ['KeyY', 21, 'Y'],
  ['Digit7', 22, '7'], ['KeyU', 23, 'U'], ['KeyI', 24, 'I'], ['Digit9', 25, '9'], ['KeyO', 26, 'O'],
  ['Digit0', 27, '0'], ['KeyP', 28, 'P'], ['BracketLeft', 29, '['], ['Equal', 30, '='], ['BracketRight', 31, ']'],
];
const ROW_CODE = new Map<string, number>([...LOWER, ...UPPER].map(([c, o]) => [c, o]));
const ROW_LABEL = new Map<number, string>();
for (const [, o, l] of LOWER) ROW_LABEL.set(o, l);
for (const [, o, l] of UPPER) ROW_LABEL.set(o, l); // the upper row wins where both rows reach

export const ROWS_SPAN = 31;
export const BASE_OCTAVE_MIN = 1;
export const BASE_OCTAVE_MAX = 5;

const LETTER_CODES = [
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
  'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
  'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
  'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM',
];
const LETTER_INDEX = new Map(LETTER_CODES.map((c, i) => [c, i]));
const VP_BLACK_LABEL = new Map<number, string>(Object.entries(VP_BLACK).map(([ch, m]) => [m, ch]));

export const baseMidiFor = (octave: number) => (octave + 1) * 12;

/** The piano key a key press plays, or null if that key is not part of the layout. */
export function codeToMidi(layout: LayoutId, code: string, shift: boolean, baseOctave: number): number | null {
  if (layout === 'rows') {
    const off = ROW_CODE.get(code);
    return off === undefined ? null : baseMidiFor(baseOctave) + off;
  }
  const i = LETTER_INDEX.get(code);
  if (i === undefined) return null;
  const white = vpWhiteMidi(i);
  return shift && isBlack(white + 1) ? white + 1 : white;
}

/** What to print on a piano key (and in the prompter) for the active layout. */
export function midiLabel(layout: LayoutId, midi: number, baseOctave: number): string | null {
  if (layout === 'rows') {
    return ROW_LABEL.get(midi - baseMidiFor(baseOctave)) ?? null;
  }
  if (isBlack(midi)) return VP_BLACK_LABEL.get(midi) ?? null;
  for (let i = 0; i < VP_WHITE.length; i++) if (vpWhiteMidi(i) === midi) return VP_WHITE[i];
  return null;
}

export function playableRange(layout: LayoutId, baseOctave: number): [number, number] {
  if (layout === 'letters') return [36, 96];
  const lo = baseMidiFor(baseOctave);
  return [lo, lo + ROWS_SPAN];
}

/** Octave for the Z key that fits the most of these notes, preferring the middle of the piano. */
export function bestBaseOctave(midis: number[]): number {
  if (!midis.length) return 3;
  let best = 3;
  let bestScore = -1;
  for (let o = BASE_OCTAVE_MIN; o <= BASE_OCTAVE_MAX; o++) {
    const lo = baseMidiFor(o);
    const fit = midis.filter((m) => m >= lo && m <= lo + ROWS_SPAN).length;
    const score = fit * 10 - Math.abs(o - 3);
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}
