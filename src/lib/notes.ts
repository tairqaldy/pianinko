export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type Hand = 'R' | 'L';

/** One note of a song. `time` and `dur` are in beats (quarter notes). */
export interface Note {
  midi: number;
  time: number;
  dur: number;
  hand: Hand;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type SongOrigin = 'library' | 'user' | 'ai' | 'midi' | 'recording';
export type NotationFormat = 'notes' | 'letters';

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  origin: SongOrigin;
  notes: Note[];
  /** Source text the notes were parsed from, kept so the song can be edited. */
  text?: string;
  format?: NotationFormat;
}

export const MIDI_MIN = 21; // A0
export const MIDI_MAX = 108; // C8

export const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

export const midiToName = (midi: number) => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function letterToMidi(letter: string, accidental: string, octave: number): number {
  const pc = LETTER_PC[letter.toUpperCase()];
  const acc = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (octave + 1) * 12 + pc + acc;
}

/** Pastel per pitch class: the colour a played note's bubble stream takes. No purple. */
export const PITCH_PASTELS = [
  '#FFC4DD', // C  bubblegum
  '#FFCFC4', // C# blush
  '#FFD6B0', // D  tangerine
  '#FFE2A0', // D# apricot
  '#FFEB9C', // E  sun
  '#E4F2A8', // F  lime
  '#BFF0CB', // F# leaf
  '#B6EEDF', // G  mint
  '#B4ECF1', // G# pool
  '#BADCFF', // A  sky
  '#C7D3FF', // A# periwinkle-blue
  '#FFD3E6', // B  rose
] as const;

export const pitchPastel = (midi: number) => PITCH_PASTELS[((midi % 12) + 12) % 12];

export const HAND_PASTEL: Record<Hand, string> = { R: '#FFD1E4', L: '#BFE0FF' };

export const songDurationBeats = (notes: Note[]) =>
  notes.reduce((end, n) => Math.max(end, n.time + n.dur), 0);

export const beatsToSeconds = (beats: number, bpm: number) => (beats * 60) / bpm;
