import { Midi } from '@tonejs/midi';
import type { Hand, Note } from './notes.ts';

export interface ImportedTrack {
  index: number;
  name: string;
  noteCount: number;
  low: number;
  high: number;
  isDrums: boolean;
}

export interface ImportedMidi {
  title: string;
  bpm: number;
  tracks: ImportedTrack[];
  midi: Midi;
}

export async function readMidiFile(file: File): Promise<ImportedMidi> {
  const midi = new Midi(await file.arrayBuffer());
  const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120);
  const tracks = midi.tracks
    .map((t, index) => ({
      index,
      name: t.name || t.instrument?.name || `Track ${index + 1}`,
      noteCount: t.notes.length,
      low: Math.min(...t.notes.map((n) => n.midi)),
      high: Math.max(...t.notes.map((n) => n.midi)),
      isDrums: t.instrument?.percussion ?? false,
    }))
    .filter((t) => t.noteCount > 0);
  return { title: midi.name || file.name.replace(/\.(mid|midi)$/i, ''), bpm, tracks, midi };
}

/**
 * Turn chosen tracks into song notes. With one track, notes below middle C go to the left hand;
 * with several, the higher-sounding track is the right hand.
 */
export function midiToNotes(data: ImportedMidi, trackIndexes: number[]): Note[] {
  const ppq = data.midi.header.ppq;
  const chosen = data.tracks.filter((t) => trackIndexes.includes(t.index));
  const avg = (t: ImportedTrack) => (t.low + t.high) / 2;
  const ordered = [...chosen].sort((a, b) => avg(b) - avg(a));
  const notes: Note[] = [];
  for (const t of chosen) {
    const handForTrack: Hand | null = chosen.length > 1 ? (t === ordered[0] ? 'R' : 'L') : null;
    for (const n of data.midi.tracks[t.index].notes) {
      if (n.midi < 21 || n.midi > 108) continue;
      notes.push({
        midi: n.midi,
        time: n.ticks / ppq,
        dur: Math.max(0.05, n.durationTicks / ppq),
        hand: handForTrack ?? (n.midi < 60 ? 'L' : 'R'),
      });
    }
  }
  notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
  // Start at the first note rather than after a long silent intro.
  const first = notes[0]?.time ?? 0;
  const shift = Math.floor(first);
  return notes.map((n) => ({ ...n, time: n.time - shift }));
}
