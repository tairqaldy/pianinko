import { useEffect, useMemo, useRef, useState } from 'react';
import { readMidiFile, midiToNotes, type ImportedMidi } from '../lib/midiImport.ts';
import { detectFormat, parseSongText } from '../lib/notation.ts';
import { HAND_PASTEL, PITCH_PASTELS, songDurationBeats, beatsToSeconds, type Difficulty, type NotationFormat, type Song } from '../lib/notes.ts';
import { newId } from '../lib/storage.ts';
import { IconClose, IconEdit, IconSearch, IconSparkle, IconTrash, IconUpload } from './Icons.tsx';

export type LibraryTab = 'library' | 'write' | 'import';

interface Props {
  tab: LibraryTab;
  onTab: (t: LibraryTab) => void;
  library: Song[];
  /** Songs added to this deployment for its owner. */
  extra: Song[];
  userSongs: Song[];
  currentId: string | null;
  scores: Record<string, number>;
  editing: Song | null;
  onEdit: (song: Song | null) => void;
  onPick: (id: string | null) => void;
  onSave: (song: Song) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  toast: (msg: string) => void;
}

const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function badgeColor(title: string) {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PITCH_PASTELS[h % PITCH_PASTELS.length];
}

function guessDifficulty(song: Pick<Song, 'notes' | 'bpm'>): Difficulty {
  const secs = beatsToSeconds(songDurationBeats(song.notes), song.bpm) || 1;
  const nps = song.notes.length / secs;
  const hands = new Set(song.notes.map((n) => n.hand)).size;
  if (nps < 1.6 && hands === 1) return 'easy';
  if (nps < 3.2) return 'medium';
  return 'hard';
}

export function LibrarySheet(p: Props) {
  return (
    <>
      <div className="scrim" onClick={p.onClose} />
      <aside className="sheet" role="dialog" aria-modal="true" aria-label="Songs">
        <div className="sheet__head">
          <h2 className="sheet__title">Songs</h2>
          <button className="close" onClick={p.onClose} aria-label="Close songs">
            <IconClose size={14} />
          </button>
        </div>
        <div className="segmented segmented--fill" role="tablist">
          {(['library', 'write', 'import'] as LibraryTab[]).map((t) => (
            <button key={t} role="tab" aria-pressed={p.tab === t} aria-selected={p.tab === t} onClick={() => p.onTab(t)}>
              {t === 'library' ? 'Library' : t === 'write' ? (p.editing ? 'Edit song' : 'Write a song') : 'Import MIDI'}
            </button>
          ))}
        </div>
        <div className="sheet__body">
          {p.tab === 'library' && <LibraryTabView {...p} />}
          {p.tab === 'write' && <WriteTab {...p} />}
          {p.tab === 'import' && <ImportTab {...p} />}
        </div>
      </aside>
    </>
  );
}

function SongRow({ song, current, stars, onPick, onEdit, onDelete }: {
  song: Song;
  current: boolean;
  stars: number;
  onPick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={`song-row${current ? ' is-current' : ''}`}>
      <button className="song-row__badge" style={{ background: badgeColor(song.title) }} onClick={onPick} tabIndex={-1} aria-hidden>
        {song.title.trim().charAt(0).toUpperCase() || '♪'}
      </button>
      <button className="song-row__text" onClick={onPick}>
        <span className="song-row__title">{song.title}</span>
        <span className="song-row__meta">{song.artist || 'You'}</span>
      </button>
      {onEdit && (
        <button className="pill pill--quiet pill--icon" style={{ width: 34, height: 34 }} onClick={onEdit} aria-label={`Edit ${song.title}`}>
          <IconEdit size={14} />
        </button>
      )}
      {onDelete && (
        <button className="pill pill--quiet pill--icon" style={{ width: 34, height: 34 }} onClick={onDelete} aria-label={`Delete ${song.title}`}>
          <IconTrash size={14} />
        </button>
      )}
      <span className={`tag tag--${song.difficulty}`}>{DIFF_LABEL[song.difficulty]}</span>
      <span className="stars" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < stars ? 'on' : ''} />
        ))}
      </span>
    </div>
  );
}

function LibraryTabView(p: Props) {
  const [q, setQ] = useState('');
  const match = (s: Song) => !q || `${s.title} ${s.artist}`.toLowerCase().includes(q.toLowerCase());
  const mine = p.userSongs.filter(match);
  const groups: Difficulty[] = ['easy', 'medium', 'hard'];
  const pick = (id: string | null) => {
    p.onPick(id);
    p.onClose();
  };

  return (
    <>
      <label className="search">
        <IconSearch size={15} style={{ color: 'var(--ink-3)' }} />
        <span className="sr-only">Search songs</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs" autoFocus />
      </label>

      <div className="song-list">
        <button className={`song-row${p.currentId === null ? ' is-current' : ''}`} onClick={() => pick(null)}>
          <span className="song-row__badge" style={{ background: 'var(--table)' }}>♪</span>
          <span className="song-row__text">
            <span className="song-row__title">Free play</span>
            <span className="song-row__meta">No song, just you and the keys</span>
          </span>
        </button>
      </div>

      {p.extra.filter(match).length > 0 && (
        <div className="song-list">
          <div className="group-label">Added for you</div>
          {p.extra.filter(match).map((s) => (
            <SongRow key={s.id} song={s} current={p.currentId === s.id} stars={p.scores[s.id] ?? 0} onPick={() => pick(s.id)} />
          ))}
        </div>
      )}

      {mine.length > 0 && (
        <div className="song-list">
          <div className="group-label">Your songs</div>
          {mine.map((s) => (
            <SongRow
              key={s.id}
              song={s}
              current={p.currentId === s.id}
              stars={p.scores[s.id] ?? 0}
              onPick={() => pick(s.id)}
              onEdit={() => {
                p.onEdit(s);
                p.onTab('write');
              }}
              onDelete={() => {
                if (confirm(`Delete "${s.title}"? This can't be undone.`)) p.onDelete(s.id);
              }}
            />
          ))}
        </div>
      )}

      {groups.map((d) => {
        const list = p.library.filter((s) => s.difficulty === d && match(s));
        if (!list.length) return null;
        return (
          <div className="song-list" key={d}>
            <div className="group-label">{DIFF_LABEL[d]}</div>
            {list.map((s) => (
              <SongRow
                key={s.id}
                song={s}
                current={p.currentId === s.id}
                stars={p.scores[s.id] ?? 0}
                onPick={() => pick(s.id)}
                onEdit={() => {
                  p.onEdit({ ...s, id: '', title: `${s.title} (my version)`, origin: 'user' });
                  p.onTab('write');
                }}
              />
            ))}
          </div>
        );
      })}

      <AskCard {...p} />
    </>
  );
}

function AskCard(p: Props) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const ask = async () => {
    const q = query.trim();
    if (!q || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        setNote('Song lookup is not switched on yet: it needs an Anthropic API key on the server. Meanwhile, drop a MIDI file of the song into Import MIDI, or paste a letter sheet in Write a song.');
        return;
      }
      if (!res.ok) {
        setNote(data.error ?? 'The song could not be fetched. Try a more specific name, like "Interstellar – Hans Zimmer, main theme".');
        return;
      }
      const parsed = parseSongText(data.notation, 'notes');
      if (!parsed.notes.length) {
        setNote('No playable notes came back. Try again or name the part you want, like "the chorus".');
        return;
      }
      const song: Song = {
        id: newId('ai'),
        title: data.title || q,
        artist: data.artist || '',
        bpm: data.bpm || parsed.bpm || 90,
        difficulty: 'medium',
        origin: 'ai',
        notes: parsed.notes,
        text: data.notation,
        format: 'notes',
      };
      song.difficulty = guessDifficulty(song);
      p.onSave(song);
      p.onPick(song.id);
      p.toast(`Added "${song.title}". Melodies written from memory can be off, so edit any note that sounds wrong.`);
      p.onClose();
    } catch {
      setNote('No connection to the song service. Check your internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card card--cream">
      <div>
        <h3 className="card__title">Learn any song</h3>
        <p className="card__text">Type a song name and get its melody as keys to play, or paste notes yourself in Write a song.</p>
      </div>
      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <IconSparkle size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Interstellar main theme" aria-label="Song name" />
        <button className="pill pill--ink" type="submit" disabled={busy || !query.trim()}>
          {busy ? 'Finding…' : 'Get notes'}
        </button>
      </form>
      {note && <p className="card__text">{note}</p>}
    </div>
  );
}

const EXAMPLE = `tempo: 100
// Twinkle, twinkle: R is the right hand, L the left
R: C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2
L: C3:2 E3:2 | F3:2 E3:2 | D3:2 C3:2 | G2:2 C3:2`;

function WriteTab(p: Props) {
  const e = p.editing;
  const [title, setTitle] = useState(e?.title ?? '');
  const [artist, setArtist] = useState(e?.artist ?? '');
  const [bpm, setBpm] = useState(e?.bpm ?? 100);
  const [format, setFormat] = useState<NotationFormat>(e?.format ?? (e?.text ? detectFormat(e.text) : 'notes'));
  const [text, setText] = useState(e?.text ?? '');
  const touched = useRef(false);

  useEffect(() => {
    setTitle(e?.title ?? '');
    setArtist(e?.artist ?? '');
    setBpm(e?.bpm ?? 100);
    setText(e?.text ?? '');
    setFormat(e?.format ?? (e?.text ? detectFormat(e.text) : 'notes'));
  }, [e]);

  const parsed = useMemo(() => parseSongText(text, format), [text, format]);
  const seconds = beatsToSeconds(songDurationBeats(parsed.notes), parsed.bpm ?? bpm);

  const save = () => {
    if (!parsed.notes.length) return;
    const song: Song = {
      id: e?.id || newId('song'),
      title: title.trim() || 'Untitled song',
      artist: artist.trim(),
      bpm: parsed.bpm ?? bpm,
      difficulty: 'easy',
      origin: e?.origin === 'library' ? 'user' : e?.origin ?? 'user',
      notes: parsed.notes,
      text,
      format,
    };
    song.difficulty = guessDifficulty(song);
    p.onSave(song);
    p.onPick(song.id);
    p.onEdit(null);
    p.toast(`Saved "${song.title}".`);
    p.onClose();
  };

  return (
    <>
      <div className="row">
        <label className="field">
          <span>Title</span>
          <input className="input" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="My song" />
        </label>
        <label className="field" style={{ flex: '0 0 96px' }}>
          <span>Tempo</span>
          <input className="input" type="number" min={30} max={240} value={bpm} onChange={(ev) => setBpm(Number(ev.target.value) || 100)} />
        </label>
      </div>
      <label className="field">
        <span>Artist</span>
        <input className="input" value={artist} onChange={(ev) => setArtist(ev.target.value)} placeholder="Who wrote it" />
      </label>
      <div className="field">
        <span>Written as</span>
        <div className="segmented segmented--small segmented--fill">
          <button aria-pressed={format === 'notes'} onClick={() => setFormat('notes')}>Note names (C4 D4)</button>
          <button aria-pressed={format === 'letters'} onClick={() => setFormat('letters')}>Letter sheet (t y u)</button>
        </div>
      </div>
      <label className="field">
        <span>Notes</span>
        <textarea
          className="textarea"
          value={text}
          spellCheck={false}
          placeholder={format === 'notes' ? EXAMPLE : '[6e] t y u | [5w] y t r e\nPaste any virtualpiano.net sheet here'}
          onChange={(ev) => {
            touched.current = true;
            setText(ev.target.value);
          }}
        />
      </label>
      <div className={`parse-status${parsed.errors.length ? ' is-error' : ''}`} role="status">
        {!text.trim()
          ? 'Write or paste a song above. The notes are checked as you type.'
          : parsed.errors.length
            ? `Line ${parsed.errors[0].line}: ${parsed.errors[0].message}${parsed.errors.length > 1 ? ` (+${parsed.errors.length - 1} more)` : ''}`
            : `${parsed.notes.length} notes, about ${Math.round(seconds)} seconds. Ready to save.`}
      </div>
      <div className="row row--end">
        {e?.id && (
          <button
            className="pill"
            onClick={() => {
              p.onEdit(null);
              setText('');
            }}
          >
            Cancel editing
          </button>
        )}
        <button className="pill pill--ink" onClick={save} disabled={!parsed.notes.length}>
          {e?.id ? 'Save changes' : 'Save and practice'}
        </button>
      </div>
      <details className="cheatsheet" open={!text}>
        <summary>How to write notes</summary>
        {format === 'notes' ? (
          <ul>
            <li><code>C4</code> is middle C. Add <code>#</code> or <code>b</code> for sharps and flats: <code>F#4</code>, <code>Bb3</code>.</li>
            <li>Every note is one beat. Longer or shorter: <code>C4:2</code>, <code>C4:0.5</code>, or <code>G4--</code> for three beats.</li>
            <li>Rest with <code>r</code> or <code>r:2</code>. Chords go in brackets: <code>[C4 E4 G4]:2</code>.</li>
            <li>Start a line with <code>R:</code> for the right hand and <code>L:</code> for the left. <code>|</code> bar lines are just for reading.</li>
          </ul>
        ) : (
          <ul>
            <li>Paste a sheet from virtualpiano.net: lowercase letters and numbers are white keys, capitals and symbols are black keys.</li>
            <li><code>[tu]</code> plays keys together. Spaces and <code>|</code> make pauses.</li>
            <li>Timing in letter sheets is approximate, so Learn mode works best for them.</li>
          </ul>
        )}
      </details>
    </>
  );
}

function ImportTab(p: Props) {
  const [data, setData] = useState<ImportedMidi | null>(null);
  const [chosen, setChosen] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const d = await readMidiFile(file);
      if (!d.tracks.length) throw new Error('empty');
      setData(d);
      setTitle(d.title);
      // Start with the piano tracks when the file names them; otherwise the first two melodic ones.
      const melodic = d.tracks.filter((t) => !t.isDrums);
      const grand = melodic.filter((t) => /grand|acoustic/i.test(t.name));
      const piano = melodic.filter((t) => /piano|keys/i.test(t.name));
      setChosen((grand.length ? grand : piano.length ? piano : melodic).slice(0, 2).map((t) => t.index));
    } catch {
      setError('This file could not be read as MIDI. Pick a .mid or .midi file.');
    }
  };

  const add = () => {
    if (!data || !chosen.length) return;
    const notes = midiToNotes(data, chosen);
    const song: Song = {
      id: newId('midi'),
      title: title.trim() || data.title,
      artist: '',
      bpm: data.bpm,
      difficulty: 'medium',
      origin: 'midi',
      notes,
    };
    song.difficulty = guessDifficulty(song);
    p.onSave(song);
    p.onPick(song.id);
    p.toast(`Added "${song.title}" with ${notes.length} notes.`);
    p.onClose();
  };

  if (!data) {
    return (
      <>
        <div
          className={`dropzone${over ? ' is-over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current?.click()}
          onKeyDown={(ev) => ev.key === 'Enter' && input.current?.click()}
          onDragOver={(ev) => {
            ev.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(ev) => {
            ev.preventDefault();
            setOver(false);
            void load(ev.dataTransfer.files[0]);
          }}
        >
          <IconUpload size={22} />
          <strong>Drop a MIDI file here</strong>
          <span className="card__text">or click to choose one. Any song you find as .mid works.</span>
          <input ref={input} type="file" accept=".mid,.midi,audio/midi" hidden onChange={(ev) => void load(ev.target.files?.[0])} />
        </div>
        {error && <p className="parse-status is-error">{error}</p>}
      </>
    );
  }

  return (
    <>
      <label className="field">
        <span>Title</span>
        <input className="input" value={title} onChange={(ev) => setTitle(ev.target.value)} />
      </label>
      <div className="field">
        <span>Tracks to practice</span>
        {data.tracks.map((t) => (
          <label className="check-row" key={t.index}>
            <input
              type="checkbox"
              checked={chosen.includes(t.index)}
              onChange={(ev) => setChosen((c) => (ev.target.checked ? [...c, t.index] : c.filter((i) => i !== t.index)))}
            />
            <span className="dot" style={{ background: t.isDrums ? 'var(--table)' : HAND_PASTEL[chosen.indexOf(t.index) === 1 ? 'L' : 'R'] }} />
            <span style={{ flex: 1 }}>{t.name}</span>
            <span className="setting__value">{t.noteCount} notes</span>
          </label>
        ))}
        <span className="setting__hint">With two tracks, the higher one becomes the right hand.</span>
      </div>
      <div className="row row--end">
        <button className="pill" onClick={() => setData(null)}>Choose another file</button>
        <button className="pill pill--ink" onClick={add} disabled={!chosen.length}>Add to my songs</button>
      </div>
    </>
  );
}
