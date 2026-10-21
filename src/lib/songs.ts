import type { Difficulty } from './notes.ts';

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  /** Pianinko notation, see notation.ts. */
  text: string;
}

/** Public-domain melodies only. */
export const LIBRARY: LibrarySong[] = [
  {
    id: 'mary-had-a-little-lamb',
    title: 'Mary Had a Little Lamb',
    artist: 'Traditional',
    bpm: 100,
    difficulty: 'easy',
    text: `R: E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4
L: C3:4 | C3:4 | G2:4 | C3:4 | C3:4 | C3:4 | G2:4 | C3:4`,
  },
  {
    id: 'twinkle-twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    artist: 'Traditional',
    bpm: 100,
    difficulty: 'easy',
    text: `R: C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2
G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2
C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2
L: C3:2 E3:2 | F3:2 E3:2 | D3:2 C3:2 | G2:2 C3:2
E3:2 D3:2 | C3:2 G2:2 | E3:2 D3:2 | C3:2 G2:2
C3:2 E3:2 | F3:2 E3:2 | D3:2 C3:2 | G2:2 C3:2`,
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    bpm: 108,
    difficulty: 'easy',
    text: `R: E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2
E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2
D4 D4 E4 C4 | D4 E4:0.5 F4:0.5 E4 C4 | D4 E4:0.5 F4:0.5 E4 D4 | C4 D4 G3:2
E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2
L: C3:4 | G2:4 | C3:4 | G2:4
C3:4 | G2:4 | C3:4 | G2:2 C3:2
G2:4 | G2:2 C3:2 | G2:2 C3:2 | C3:2 G2:2
C3:4 | G2:4 | C3:4 | G2:2 C3:2`,
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    artist: 'Traditional',
    bpm: 96,
    difficulty: 'easy',
    text: `R: G4:0.75 G4:0.25 | A4 G4 C5 | B4:2 G4:0.75 G4:0.25 | A4 G4 D5 | C5:2 G4:0.75 G4:0.25
G5 E5 C5 | B4 A4 F5:0.75 F5:0.25 | E5 C5 D5 | C5:3
L: r:1 | C3:3 | G2:3 | G2:3 | C3:3
C3:3 | F2:3 | G2:3 | C3:3`,
  },
];
