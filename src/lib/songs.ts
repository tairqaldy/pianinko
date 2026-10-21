/**
 * Built-in song library. Public-domain pieces only, written in Pianinko notation
 * (see notation.ts). Every note carries its octave; `|` marks bars; each hand's
 * timeline starts at beat 0, so the left hand uses rests to stay in step.
 */
import type { Difficulty } from './notes.ts';

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  text: string;
}

export const LIBRARY: LibrarySong[] = [
  /* ---------------- Easy ---------------- */
  {
    id: 'mary-had-a-little-lamb',
    title: 'Mary Had a Little Lamb',
    artist: 'Traditional',
    bpm: 100,
    difficulty: 'easy',
    text: `// 4/4, C major
R: E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 |
E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4
L: C3:4 | C3:4 | G2:4 | C3:4 |
C3:4 | C3:4 | G2:4 | C3:4`,
  },
  {
    id: 'twinkle-twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    artist: 'Traditional',
    bpm: 100,
    difficulty: 'easy',
    text: `// 4/4, C major
R: C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 |
G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 |
C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2
L: C3:4 | F3:2 C3:2 | F3:2 C3:2 | G2:2 C3:2 |
C3:2 F3:2 | C3:2 G2:2 | C3:2 F3:2 | C3:2 G2:2 |
C3:4 | F3:2 C3:2 | F3:2 C3:2 | G2:2 C3:2`,
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    artist: 'Ludwig van Beethoven',
    bpm: 100,
    difficulty: 'easy',
    text: `// 4/4, C major — the theme from the Ninth Symphony
R: E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2 |
E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2 |
D4 D4 E4 C4 | D4 E4:0.5 F4:0.5 E4 C4 | D4 E4:0.5 F4:0.5 E4 D4 | C4 D4 G3:2 |
E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2
L: C3:4 | G2:4 | C3:4 | C3:2 G2:2 |
C3:4 | G2:4 | C3:4 | G2:2 C3:2 |
G2:2 C3:2 | G2:2 C3:2 | G2:4 | C3:2 G2:2 |
C3:4 | G2:4 | C3:4 | G2:2 C3:2`,
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    artist: 'Patty & Mildred Hill',
    bpm: 90,
    difficulty: 'easy',
    text: `// 3/4, C major, starts with a one-beat pickup
R: G4:0.75 G4:0.25 | A4 G4 C5 | B4:2 G4:0.75 G4:0.25 | A4 G4 D5 | C5:2 G4:0.75 G4:0.25 |
G5 E5 C5 | B4 A4 F5:0.75 F5:0.25 | E5 C5 D5 | C5:2
L: r:1 | C3:3 | G2:3 | G2:3 | C3:3 |
C3:3 | F3:3 | C3:2 G2:1 | C3:2`,
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells (chorus)',
    artist: 'James Lord Pierpont',
    bpm: 112,
    difficulty: 'easy',
    text: `// 4/4, C major
R: E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 | E4:4 |
F4 F4 F4:1.5 F4:0.5 | F4 E4 E4 E4:0.5 E4:0.5 | E4 D4 D4 E4 | D4:2 G4:2 |
E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 | E4:4 |
F4 F4 F4:1.5 F4:0.5 | F4 E4 E4 E4:0.5 E4:0.5 | G4 G4 F4 D4 | C4:4
L: C3:4 | C3:4 | C3:4 | C3:4 |
F3:4 | C3:4 | G2:4 | G2:4 |
C3:4 | C3:4 | C3:4 | C3:4 |
F3:4 | C3:4 | G2:4 | C3:4`,
  },
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    artist: 'Traditional',
    bpm: 100,
    difficulty: 'easy',
    text: `// 4/4, C major, melody only
R: C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4 F4 G4:2 |
G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | C4 G3 C4:2 | C4 G3 C4:2`,
  },
  {
    id: 'korobeiniki',
    title: 'Korobeiniki',
    artist: 'Traditional (Russian)',
    bpm: 110,
    difficulty: 'easy',
    text: `// 4/4, A minor — the folk tune, A section played twice
R: E5 B4:0.5 C5:0.5 D5 C5:0.5 B4:0.5 | A4 A4:0.5 C5:0.5 E5 D5:0.5 C5:0.5 | B4:1.5 C5:0.5 D5 E5 | C5 A4 A4:2
| r:0.5 D5 F5:0.5 A5 G5:0.5 F5:0.5 | E5:1.5 C5:0.5 E5 D5:0.5 C5:0.5 | B4 B4:0.5 C5:0.5 D5 E5 | C5 A4 A4:2 |
E5 B4:0.5 C5:0.5 D5 C5:0.5 B4:0.5 | A4 A4:0.5 C5:0.5 E5 D5:0.5 C5:0.5 | B4:1.5 C5:0.5 D5 E5 | C5 A4 A4:2
| r:0.5 D5 F5:0.5 A5 G5:0.5 F5:0.5 | E5:1.5 C5:0.5 E5 D5:0.5 C5:0.5 | B4 B4:0.5 C5:0.5 D5 E5 | C5 A4 A4:2
L: E2:4 | A2:4 | E2:4 | A2:4 |
D3:4 | C3:4 | E2:4 | A2:4 |
E2:4 | A2:4 | E2:4 | A2:4 |
D3:4 | C3:4 | E2:4 | A2:4`,
  },
  {
    id: 'brahms-lullaby',
    title: "Brahms' Lullaby",
    artist: 'Johannes Brahms',
    bpm: 72,
    difficulty: 'easy',
    text: `// 3/4, C major (Wiegenlied, Op. 49 No. 4), two-eighth pickup
R: E4:0.5 E4:0.5 | G4:2 E4:0.5 E4:0.5 | G4:2 E4:0.5 G4:0.5 | C5 B4:1.5 A4:0.5 | A4 G4 D4:0.5 E4:0.5 |
F4 D4 D4:0.5 E4:0.5 | F4:2 D4:0.5 F4:0.5 | B4:0.5 A4:0.5 G4 B4 | C5:2
L: r:1 | C3:3 | C3:3 | C3:3 | C3:3 |
G2:3 | G2:3 | G2:3 | C3:2`,
  },
];
