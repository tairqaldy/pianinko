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

  /* ---------------- Medium ---------------- */
  {
    id: 'fur-elise',
    title: 'Für Elise',
    artist: 'Ludwig van Beethoven',
    bpm: 100,
    difficulty: 'medium',
    text: `// 3/8 written in doubled values: one beat = one eighth note, so a bar is 3 beats.
// Bars 1–8 (first ending), the repeat, and the closing A.
R: E5:0.5 D#5:0.5 |
E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 | B4:1 r:0.5 E4:0.5 G#4:0.5 B4:0.5 | C5:1 r:0.5 E4:0.5 E5:0.5 D#5:0.5 |
E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 | B4:1 r:0.5 E4:0.5 C5:0.5 B4:0.5 | A4:1 r:1 E5:0.5 D#5:0.5 |
E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 | B4:1 r:0.5 E4:0.5 G#4:0.5 B4:0.5 | C5:1 r:0.5 E4:0.5 E5:0.5 D#5:0.5 |
E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1 r:0.5 C4:0.5 E4:0.5 A4:0.5 | B4:1 r:0.5 E4:0.5 C5:0.5 B4:0.5 | A4:3
L: r:1 |
r:3 | A2:0.5 E3:0.5 A3:0.5 r:1.5 | E2:0.5 E3:0.5 G#3:0.5 r:1.5 | A2:0.5 E3:0.5 A3:0.5 r:1.5 |
r:3 | A2:0.5 E3:0.5 A3:0.5 r:1.5 | E2:0.5 E3:0.5 G#3:0.5 r:1.5 | A2:0.5 E3:0.5 A3:0.5 r:1.5 |
r:3 | A2:0.5 E3:0.5 A3:0.5 r:1.5 | E2:0.5 E3:0.5 G#3:0.5 r:1.5 | A2:0.5 E3:0.5 A3:0.5 r:1.5 |
r:3 | A2:0.5 E3:0.5 A3:0.5 r:1.5 | E2:0.5 E3:0.5 G#3:0.5 r:1.5 | A2:0.5 E3:0.5 A3:0.5 r:1.5`,
  },
  {
    id: 'minuet-in-g',
    title: 'Minuet in G',
    artist: 'Christian Petzold',
    bpm: 100,
    difficulty: 'medium',
    text: `// 3/4, G major — first 16 bars (BWV Anh. 114)
R: D5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 | D5 G4 G4 | E5 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 | G5 G4 G4 |
C5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 | B4 C5:0.5 B4:0.5 A4:0.5 G4:0.5 | F#4 G4:0.5 A4:0.5 B4:0.5 G4:0.5 | A4:3 |
D5 G4:0.5 A4:0.5 B4:0.5 C5:0.5 | D5 G4 G4 | E5 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 | G5 G4 G4 |
C5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 | B4 C5:0.5 B4:0.5 A4:0.5 G4:0.5 | A4 B4:0.5 A4:0.5 G4:0.5 F#4:0.5 | G4:3
L: [G3 B3]:2 A3 | B3:3 | C4:3 | B3:3 |
A3:3 | G3:3 | D4 B3 G3 | D4:2 D3 |
[G3 B3]:2 A3 | B3:3 | C4:3 | B3 A3 G3 |
A3:3 | B3:2 G3 | C4 D4 D3 | G3:2 G2`,
  },
  {
    id: 'canon-in-d',
    title: 'Canon in D',
    artist: 'Johann Pachelbel',
    bpm: 84,
    difficulty: 'medium',
    text: `// 4/4, D major — the ground bass D A B F# G D G A repeats under four upper lines (simplified)
R: F#5:2 E5:2 | D5:2 C#5:2 | B4:2 A4:2 | B4:2 C#5:2 |
D5:2 C#5:2 | B4:2 A4:2 | G4:2 F#4:2 | G4:2 E4:2 |
D5 F#5 A5 G5 | F#5 D5 F#5 E5 | D5 B4 D5 A5 | G5 B5 A5 G5 |
[D5 F#5]:2 [C#5 E5]:2 | [B4 D5]:2 [A4 C#5]:2 | [G4 B4]:2 [F#4 A4]:2 | [G4 B4]:2 [E4 C#5]:2 |
[F#4 A4 D5]:4
L: D3:2 A2:2 | B2:2 F#2:2 | G2:2 D2:2 | G2:2 A2:2 |
D3:2 A2:2 | B2:2 F#2:2 | G2:2 D2:2 | G2:2 A2:2 |
D3:2 A2:2 | B2:2 F#2:2 | G2:2 D2:2 | G2:2 A2:2 |
D3:2 A2:2 | B2:2 F#2:2 | G2:2 D2:2 | G2:2 A2:2 |
[D2 A2 D3]:4`,
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    artist: 'Traditional',
    bpm: 96,
    difficulty: 'medium',
    text: `// 3/4, A minor — A section, one-beat pickup
R: A4 | C5:2 D5 | E5:1.5 F5:0.5 E5 | D5:2 B4 | G4:1.5 A4:0.5 B4 |
C5:2 A4 | A4:1.5 G#4:0.5 A4 | B4:2 G#4 | E4:2 A4 |
C5:2 D5 | E5:1.5 F5:0.5 E5 | D5:2 B4 | G4:1.5 A4:0.5 B4 |
C5:1.5 B4:0.5 A4 | G#4:1.5 F#4:0.5 G#4 | A4:2
L: r:1 | A2:3 | C3:3 | G2:3 | E2:3 |
A2:3 | A2:3 | E2:3 | E2:3 |
A2:3 | C3:3 | G2:3 | E2:3 |
A2:3 | E2:3 | A2:2`,
  },
  {
    id: 'hall-of-the-mountain-king',
    title: 'In the Hall of the Mountain King',
    artist: 'Edvard Grieg',
    bpm: 100,
    difficulty: 'medium',
    text: `// 4/4, B minor — the theme and its answer in F# major, played twice (second time an octave up),
// with a closing B. Left hand: a plain pedal on B, then on F#.
R: B3:0.5 C#4:0.5 D4:0.5 E4:0.5 F#4:0.5 D4:0.5 F#4 | E#4:0.5 C#4:0.5 E#4 E4:0.5 C4:0.5 E4 | B3:0.5 C#4:0.5 D4:0.5 E4:0.5 F#4:0.5 D4:0.5 F#4:0.5 B4:0.5 | A4:0.5 F#4:0.5 D4:0.5 F#4:0.5 A4:2 |
F#4:0.5 G#4:0.5 A#4:0.5 B4:0.5 C#5:0.5 A#4:0.5 C#5 | D5:0.5 A#4:0.5 D5 C#5:0.5 A4:0.5 C#5 | F#4:0.5 G#4:0.5 A#4:0.5 B4:0.5 C#5:0.5 A#4:0.5 C#5:0.5 F#5:0.5 | E5:0.5 C#5:0.5 A#4:0.5 C#5:0.5 E5:2 |
B4:0.5 C#5:0.5 D5:0.5 E5:0.5 F#5:0.5 D5:0.5 F#5 | E#5:0.5 C#5:0.5 E#5 E5:0.5 C5:0.5 E5 | B4:0.5 C#5:0.5 D5:0.5 E5:0.5 F#5:0.5 D5:0.5 F#5:0.5 B5:0.5 | A5:0.5 F#5:0.5 D5:0.5 F#5:0.5 A5:2 |
F#5:0.5 G#5:0.5 A#5:0.5 B5:0.5 C#6:0.5 A#5:0.5 C#6 | D6:0.5 A#5:0.5 D6 C#6:0.5 A5:0.5 C#6 | F#5:0.5 G#5:0.5 A#5:0.5 B5:0.5 C#6:0.5 A#5:0.5 C#6:0.5 F#6:0.5 | E6:0.5 C#6:0.5 A#5:0.5 C#6:0.5 E6:2 |
B5:4
L: B2 r:1 B2 r:1 | B2 r:1 B2 r:1 | B2 r:1 B2 r:1 | B2 r:1 B2 r:1 |
F#2 r:1 F#2 r:1 | F#2 r:1 F#2 r:1 | F#2 r:1 F#2 r:1 | F#2 r:1 F#2 r:1 |
B2 r:1 B2 r:1 | B2 r:1 B2 r:1 | B2 r:1 B2 r:1 | B2 r:1 B2 r:1 |
F#2 r:1 F#2 r:1 | F#2 r:1 F#2 r:1 | F#2 r:1 F#2 r:1 | F#2 r:1 F#2 r:1 |
B2:4`,
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    artist: 'Traditional',
    bpm: 80,
    difficulty: 'medium',
    text: `// 3/4, G major — one verse, one-beat pickup. In the hymn "me" (bar 7) is held into bar 8.
R: D4 | G4:2 B4:0.5 G4:0.5 | B4:2 A4 | G4:2 E4 | D4:2 D4 |
G4:2 B4:0.5 G4:0.5 | B4:2 A4 | D5:3 | r:2 B4 |
D5:2 B4:0.5 G4:0.5 | B4:2 A4 | G4:2 E4 | D4:2 D4 |
G4:2 B4:0.5 G4:0.5 | B4:2 A4 | G4:3
L: r:1 | G2:3 | G2:3 | C3:3 | G2:3 |
G2:3 | G2:3 | D3:3 | D3:3 |
G2:3 | G2:3 | C3:3 | G2:3 |
E2:3 | D3:3 | G2:3`,
  },
  {
    id: 'gymnopedie-no-1',
    title: 'Gymnopédie No. 1',
    artist: 'Erik Satie',
    bpm: 72,
    difficulty: 'medium',
    text: `// 3/4 — bars 1–8: four bars of the rocking left hand (G / D bass, then the chord), then the melody enters
R: r:3 | r:3 | r:3 | r:3 | r:1 F#5 A5 | G5 F#5 C#5 | B4 C#5 D5 | A4:3
L: G2 [B3 D4 F#4]:2 | D2 [A3 C#4 F#4]:2 | G2 [B3 D4 F#4]:2 | D2 [A3 C#4 F#4]:2 |
G2 [B3 D4 F#4]:2 | D2 [A3 C#4 F#4]:2 | G2 [B3 D4 F#4]:2 | D2 [A3 C#4 F#4]:2`,
  },

  /* ---------------- Hard ---------------- */
  {
    id: 'moonlight-sonata',
    title: 'Moonlight Sonata (1st movement)',
    artist: 'Ludwig van Beethoven',
    bpm: 50,
    difficulty: 'hard',
    text: `// Sonata Op. 27 No. 2, I. — bars 1–5. Triplets: three notes per beat, four beats a bar.
// Beethoven's bass octaves dip below C2 in bars 2–4, so there only the upper note is kept.
// The melody's first note (end of bar 5) shares the right hand with the triplets and is left out.
R: G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 |
G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 |
A3:1/3 C#4:1/3 E4:1/3 A3:1/3 C#4:1/3 E4:1/3 A3:1/3 D4:1/3 F#4:1/3 A3:1/3 D4:1/3 F#4:1/3 |
G#3:1/3 B#3:1/3 F#4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 D#4:1/3 F#3:1/3 B#3:1/3 D#4:1/3 |
G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3 G#3:1/3 C#4:1/3 E4:1/3
L: [C#2 C#3]:4 | B2:4 | A2:2 F#2:2 | G#2:4 | [C#2 C#3]:4`,
  },
  {
    id: 'rondo-alla-turca',
    title: 'Rondo alla Turca',
    artist: 'Wolfgang Amadeus Mozart',
    bpm: 80,
    difficulty: 'hard',
    text: `// Sonata K. 331, III. — 2/4, A minor: the upbeat and bars 1–4, ending on the high C
R: B4:0.25 A4:0.25 G#4:0.25 A4:0.25 | C5:0.5 r:0.5 D5:0.25 C5:0.25 B4:0.25 C5:0.25 | E5:0.5 r:0.5 F5:0.25 E5:0.25 D#5:0.25 E5:0.25 |
B5:0.25 A5:0.25 G#5:0.25 A5:0.25 B5:0.25 A5:0.25 G#5:0.25 A5:0.25 | C6:1
L: r:1 | A3:0.5 [C4 E4]:0.5 [C4 E4]:0.5 [C4 E4]:0.5 | A3:0.5 [C4 E4]:0.5 [C4 E4]:0.5 [C4 E4]:0.5 |
A3:0.5 [C4 E4]:0.5 [C4 E4]:0.5 [C4 E4]:0.5 | [A3 C4 E4]:1`,
  },
  {
    id: 'prelude-in-c',
    title: 'Prelude in C major, BWV 846',
    artist: 'Johann Sebastian Bach',
    bpm: 60,
    difficulty: 'hard',
    text: `// Well-Tempered Clavier I — bars 1–8, 4/4 in sixteenths. Each half bar: the left hand plays the two
// low notes (the second one held), the right hand answers with the upper three, twice.
R: r:0.5 G4:0.25 C5:0.25 E5:0.25 G4:0.25 C5:0.25 E5:0.25 r:0.5 G4:0.25 C5:0.25 E5:0.25 G4:0.25 C5:0.25 E5:0.25
| r:0.5 A4:0.25 D5:0.25 F5:0.25 A4:0.25 D5:0.25 F5:0.25 r:0.5 A4:0.25 D5:0.25 F5:0.25 A4:0.25 D5:0.25 F5:0.25
| r:0.5 G4:0.25 D5:0.25 F5:0.25 G4:0.25 D5:0.25 F5:0.25 r:0.5 G4:0.25 D5:0.25 F5:0.25 G4:0.25 D5:0.25 F5:0.25
| r:0.5 G4:0.25 C5:0.25 E5:0.25 G4:0.25 C5:0.25 E5:0.25 r:0.5 G4:0.25 C5:0.25 E5:0.25 G4:0.25 C5:0.25 E5:0.25
| r:0.5 A4:0.25 E5:0.25 A5:0.25 A4:0.25 E5:0.25 A5:0.25 r:0.5 A4:0.25 E5:0.25 A5:0.25 A4:0.25 E5:0.25 A5:0.25
| r:0.5 F#4:0.25 A4:0.25 D5:0.25 F#4:0.25 A4:0.25 D5:0.25 r:0.5 F#4:0.25 A4:0.25 D5:0.25 F#4:0.25 A4:0.25 D5:0.25
| r:0.5 G4:0.25 D5:0.25 G5:0.25 G4:0.25 D5:0.25 G5:0.25 r:0.5 G4:0.25 D5:0.25 G5:0.25 G4:0.25 D5:0.25 G5:0.25
| r:0.5 E4:0.25 G4:0.25 C5:0.25 E4:0.25 G4:0.25 C5:0.25 r:0.5 E4:0.25 G4:0.25 C5:0.25 E4:0.25 G4:0.25 C5:0.25
L: C4:0.25 E4:1.75 C4:0.25 E4:1.75
| C4:0.25 D4:1.75 C4:0.25 D4:1.75
| B3:0.25 D4:1.75 B3:0.25 D4:1.75
| C4:0.25 E4:1.75 C4:0.25 E4:1.75
| C4:0.25 E4:1.75 C4:0.25 E4:1.75
| C4:0.25 D4:1.75 C4:0.25 D4:1.75
| B3:0.25 D4:1.75 B3:0.25 D4:1.75
| B3:0.25 C4:1.75 B3:0.25 C4:1.75`,
  },
];
