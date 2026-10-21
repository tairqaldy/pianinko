/**
 * Computer keyboard → piano. Keys are matched by physical position (KeyboardEvent.code),
 * so every layout works the same with any language switched on (ЙЦУКЕН included).
 */
import { VP_BLACK, VP_WHITE, vpWhiteMidi } from './notation.ts';
import { isBlack } from './notes.ts';

export type LayoutId = 'piano' | 'rows' | 'letters';

export const LAYOUTS: { id: LayoutId; name: string; hint: string }[] = [
  {
    id: 'piano',
    name: 'Piano',
    hint: 'Q row is the middle of the piano, its black keys are the numbers above. A and Z rows reach lower on the left and higher on the right. Shift + a letter plays the black key above it.',
  },
  {
    id: 'rows',
    name: 'Classic rows',
    hint: 'Z–M and Q–P are white keys, the row above each one holds the black keys.',
  },
  {
    id: 'letters',
    name: 'Letter sheets',
    hint: '1 to M covers five octaves, Shift plays the black key. Matches virtualpiano.net sheets.',
  },
];

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const KEY_LABEL: Record<string, string> = {
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']',
  Backslash: '\\', Equal: '=', Minus: '-',
};
const labelOf = (code: string) => KEY_LABEL[code] ?? code.replace(/^Key|^Digit/, '');

/* ---------- Piano: Q row in the middle, A and Z rows reaching outwards ---------- */

/** White keys as steps from the C under the Q key. */
const PIANO_WHITES: [string, number][] = [
  // Z row: the low octave on the left, the highest notes on the right
  ['KeyZ', -14], ['KeyX', -13], ['KeyC', -12], ['KeyV', -11], ['KeyB', -10], ['KeyN', -9], ['KeyM', -8],
  ['Comma', 17], ['Period', 18], ['Slash', 19],
  // A row: the octave below the middle on the left, the notes above it on the right
  ['KeyA', -7], ['KeyS', -6], ['KeyD', -5], ['KeyF', -4], ['KeyG', -3], ['KeyH', -2], ['KeyJ', -1],
  ['KeyK', 13], ['KeyL', 14], ['Semicolon', 15], ['Quote', 16],
  // Q row: the middle of the piano
  ['KeyQ', 0], ['KeyW', 1], ['KeyE', 2], ['KeyR', 3], ['KeyT', 4], ['KeyY', 5], ['KeyU', 6],
  ['KeyI', 7], ['KeyO', 8], ['KeyP', 9], ['BracketLeft', 10], ['BracketRight', 11], ['Backslash', 12],
];
/** Number row: black keys of the Q row, sitting above it like on a real piano. */
const PIANO_BLACKS: [string, number][] = [
  ['Digit2', 0], ['Digit3', 1], ['Digit5', 3], ['Digit6', 4], ['Digit7', 5], ['Digit9', 7], ['Digit0', 8], ['Equal', 10],
];
const PIANO_WHITE_STEP = new Map(PIANO_WHITES);
const PIANO_BLACK_STEP = new Map(PIANO_BLACKS);

const whiteMidi = (step: number, qOctave: number) => {
  const oct = Math.floor(step / 7);
  return (qOctave + 1 + oct) * 12 + WHITE_PCS[((step % 7) + 7) % 7];
};

/* ---------- Classic rows (tracker style) ---------- */

type Slot = [code: string, offset: number];
const ROWS: Slot[] = [
  ['KeyZ', 0], ['KeyS', 1], ['KeyX', 2], ['KeyD', 3], ['KeyC', 4], ['KeyV', 5], ['KeyG', 6], ['KeyB', 7],
  ['KeyH', 8], ['KeyN', 9], ['KeyJ', 10], ['KeyM', 11], ['Comma', 12], ['KeyL', 13], ['Period', 14],
  ['Semicolon', 15], ['Slash', 16],
  ['KeyQ', 12], ['Digit2', 13], ['KeyW', 14], ['Digit3', 15], ['KeyE', 16], ['KeyR', 17], ['Digit5', 18],
  ['KeyT', 19], ['Digit6', 20], ['KeyY', 21], ['Digit7', 22], ['KeyU', 23], ['KeyI', 24], ['Digit9', 25],
  ['KeyO', 26], ['Digit0', 27], ['KeyP', 28], ['BracketLeft', 29], ['Equal', 30], ['BracketRight', 31],
];
const ROW_CODE = new Map(ROWS);
const ROW_LABEL = new Map<number, string>();
for (const [c, o] of ROWS) ROW_LABEL.set(o, labelOf(c)); // later (upper row) entries win where both reach
const ROWS_SPAN = 31;

/* ---------- Letter sheets ---------- */

const LETTER_CODES = [
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
  'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
  'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
  'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM',
];
const LETTER_INDEX = new Map(LETTER_CODES.map((c, i) => [c, i]));
const VP_BLACK_LABEL = new Map<number, string>(Object.entries(VP_BLACK).map(([ch, m]) => [m, ch]));

/* ---------- Public API ---------- */

export const baseMidiFor = (octave: number) => (octave + 1) * 12;

/** Which octave the arrows can move the layout to, and where it starts. */
export function octaveBounds(layout: LayoutId): [number, number] {
  return layout === 'piano' ? [3, 5] : layout === 'rows' ? [1, 5] : [0, 0];
}
export const defaultOctave = (layout: LayoutId) => (layout === 'piano' ? 4 : 3);

/** The piano key a key press plays, or null if that key is not part of the layout. */
export function codeToMidi(layout: LayoutId, code: string, shift: boolean, octave: number): number | null {
  if (layout === 'piano') {
    const black = PIANO_BLACK_STEP.get(code);
    if (black !== undefined) return whiteMidi(black, octave) + 1;
    const step = PIANO_WHITE_STEP.get(code);
    if (step === undefined) return null;
    const white = whiteMidi(step, octave);
    return shift && isBlack(white + 1) ? white + 1 : white;
  }
  if (layout === 'rows') {
    const off = ROW_CODE.get(code);
    return off === undefined ? null : baseMidiFor(octave) + off;
  }
  const i = LETTER_INDEX.get(code);
  if (i === undefined) return null;
  const white = vpWhiteMidi(i);
  return shift && isBlack(white + 1) ? white + 1 : white;
}

const pianoLabels = new Map<number, Map<number, string>>();
function pianoLabelMap(octave: number) {
  let map = pianoLabels.get(octave);
  if (map) return map;
  map = new Map();
  for (const [code, step] of PIANO_WHITES) map.set(whiteMidi(step, octave), labelOf(code));
  for (const [code, step] of PIANO_WHITES) {
    const sharp = whiteMidi(step, octave) + 1;
    if (isBlack(sharp)) map.set(sharp, `⇧${labelOf(code)}`);
  }
  // Number-row black keys are easier to reach than Shift, so they win where both exist.
  for (const [code, step] of PIANO_BLACKS) map.set(whiteMidi(step, octave) + 1, labelOf(code));
  pianoLabels.set(octave, map);
  return map;
}

/** What to print on a piano key (and in the prompter) for the active layout. */
export function midiLabel(layout: LayoutId, midi: number, octave: number): string | null {
  if (layout === 'piano') return pianoLabelMap(octave).get(midi) ?? null;
  if (layout === 'rows') return ROW_LABEL.get(midi - baseMidiFor(octave)) ?? null;
  if (isBlack(midi)) return VP_BLACK_LABEL.get(midi) ?? null;
  for (let i = 0; i < VP_WHITE.length; i++) if (vpWhiteMidi(i) === midi) return VP_WHITE[i];
  return null;
}

/** Lowest and highest key the layout can play. */
export function playableRange(layout: LayoutId, octave: number): [number, number] {
  if (layout === 'letters') return [36, 96];
  if (layout === 'piano') return [whiteMidi(-14, octave), whiteMidi(19, octave) + 1];
  const lo = baseMidiFor(octave);
  return [lo, lo + ROWS_SPAN];
}

/** Octave that fits the most of these notes, preferring the layout's usual position. */
export function bestBaseOctave(midis: number[], layout: LayoutId): number {
  const [min, max] = octaveBounds(layout);
  const home = defaultOctave(layout);
  if (!midis.length) return home;
  let best = home;
  let bestScore = -1;
  for (let o = min; o <= max; o++) {
    const [lo, hi] = playableRange(layout, o);
    const fit = midis.filter((m) => m >= lo && m <= hi).length;
    const score = fit * 10 - Math.abs(o - home);
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}
