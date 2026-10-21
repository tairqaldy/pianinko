import type { InstrumentId } from '../audio/engine.ts';
import type { HandsChoice, Mode } from '../player/player.ts';
import type { LayoutId } from './keymap.ts';
import type { Song } from './notes.ts';

export type LabelMode = 'keys' | 'notes' | 'both' | 'off';

export interface Settings {
  instrument: InstrumentId;
  volume: number;
  reverb: number;
  layout: LayoutId;
  baseOctave: number;
  labels: LabelMode;
  prompter: boolean;
  mode: Mode;
  hands: HandsChoice;
  speed: number;
  metronome: boolean;
  freeBpm: number;
  songId: string | null;
  seenHelp: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  instrument: 'piano',
  volume: 0.8,
  reverb: 0.25,
  layout: 'rows',
  baseOctave: 3,
  labels: 'keys',
  prompter: true,
  mode: 'learn',
  hands: 'both',
  speed: 0.8,
  metronome: false,
  freeBpm: 90,
  songId: 'twinkle-twinkle',
  seenHelp: false,
};

const KEY_SETTINGS = 'pianinko.settings.v1';
const KEY_SONGS = 'pianinko.songs.v1';
const KEY_SCORES = 'pianinko.scores.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app keeps working for this visit */
  }
}

/** True until this browser has saved settings once. */
export const firstVisit = (() => {
  try {
    return localStorage.getItem(KEY_SETTINGS) === null;
  } catch {
    return false;
  }
})();

export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEY_SETTINGS, {}) });
export const saveSettings = (s: Settings) => write(KEY_SETTINGS, s);

export const loadUserSongs = (): Song[] => read<Song[]>(KEY_SONGS, []);
export const saveUserSongs = (songs: Song[]) => write(KEY_SONGS, songs);

/** Best stars per song id. */
export const loadScores = (): Record<string, number> => read(KEY_SCORES, {});
export const saveScores = (s: Record<string, number>) => write(KEY_SCORES, s);

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
