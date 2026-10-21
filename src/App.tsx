import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { audio, INSTRUMENTS } from './audio/engine.ts';
import { HelpModal, InstrumentMenu, ResultsModal, SettingsPopover } from './components/Panels.tsx';
import { IconChevron, IconMusic, IconPause, IconPlay, IconPrompter, IconRestart, IconSliders } from './components/Icons.tsx';
import { Keyboard, KeyboardView } from './components/Keyboard.tsx';
import { LibrarySheet, type LibraryTab } from './components/LibrarySheet.tsx';
import { Teleprompter } from './components/Teleprompter.tsx';
import { bestBaseOctave, codeToMidi, defaultOctave, midiLabel, octaveBounds, playableRange } from './lib/keymap.ts';
import { parseNotation } from './lib/notation.ts';
import { midiToName, type Note, type Song } from './lib/notes.ts';
import { LIBRARY } from './lib/songs.ts';
import { firstVisit, loadScores, loadSettings, loadUserSongs, newId, saveScores, saveSettings, saveUserSongs, type Settings } from './lib/storage.ts';
import { player, type Mode, type Result } from './player/player.ts';
import { layoutKeys, visibleRange } from './visual/geometry.ts';
import { Sky } from './visual/sky.ts';

const LIBRARY_SONGS: Song[] = LIBRARY.map((s) => {
  const parsed = parseNotation(s.text);
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    bpm: parsed.bpm ?? s.bpm,
    difficulty: s.difficulty,
    origin: 'library',
    notes: parsed.notes,
    text: s.text,
    format: 'notes',
  };
});

type Panel = null | 'library' | 'settings' | 'instrument' | 'help';

const MODES: [Mode, string][] = [
  ['listen', 'Listen'],
  ['learn', 'Learn'],
  ['play', 'Play along'],
];

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

const usesNativeActivation = (el: Element | null) =>
  el instanceof HTMLElement && /^(BUTTON|A|SUMMARY)$/.test(el.tagName) && el.matches(':focus-visible');

interface Recording {
  t0: number;
  open: Map<number, number>;
  notes: Note[];
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v })), []);
  useEffect(() => saveSettings(settings), [settings]);

  const [userSongs, setUserSongs] = useState<Song[]>(loadUserSongs);
  useEffect(() => saveUserSongs(userSongs), [userSongs]);
  const [scores, setScores] = useState<Record<string, number>>(loadScores);

  const [panel, setPanel] = useState<Panel>(settings.seenHelp ? null : 'help');
  const [libTab, setLibTab] = useState<LibraryTab>('library');
  const [editing, setEditing] = useState<Song | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [recording, setRecording] = useState(false);
  const [sustain, setSustain] = useState(false);
  const [played, setPlayed] = useState(false);
  const [midiStatus, setMidiStatus] = useState<string | null>(null);
  const [width, setWidth] = useState(1200);

  useSyncExternalStore(player.subscribe, player.getVersion);
  const audioKey = useSyncExternalStore(audio.subscribe, () => `${audio.loadState}:${Math.round(audio.loadProgress * 20)}`);

  // Songs deployed next to the app but kept out of the public repo (public/private/songs.json).
  const [privateSongs, setPrivateSongs] = useState<Song[]>([]);
  useEffect(() => {
    fetch('/private/songs.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: (Song & { featured?: boolean })[]) => {
        if (!Array.isArray(list) || !list.length) return;
        setPrivateSongs(list);
        const featured = list.find((s) => s.featured);
        if (featured && firstVisit) set('songId', featured.id);
      })
      .catch(() => undefined);
  }, [set]);

  const allSongs = useMemo(() => [...userSongs, ...privateSongs, ...LIBRARY_SONGS], [userSongs, privateSongs]);
  const song = allSongs.find((s) => s.id === settings.songId) ?? null;

  /* ---------- toasts ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- audio settings ---------- */
  useEffect(() => audio.setVolume(settings.volume), [settings.volume]);
  useEffect(() => audio.setReverb(settings.reverb), [settings.reverb]);
  useEffect(() => audio.setInstrument(settings.instrument), [settings.instrument]);

  /* ---------- player ---------- */
  useEffect(() => {
    player.mode = settings.mode;
    player.hands = settings.hands;
    player.load(song);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);
  useEffect(() => player.setMode(settings.mode), [settings.mode]);
  useEffect(() => player.setHands(settings.hands), [settings.hands]);
  useEffect(() => player.setSpeed(settings.speed), [settings.speed]);
  useEffect(() => {
    player.metronome = settings.metronome;
  }, [settings.metronome]);

  // Move the octave so the song's notes sit under your fingers; a new layout starts at its home octave.
  const prevLayout = useRef(settings.layout);
  useEffect(() => {
    const layoutChanged = prevLayout.current !== settings.layout;
    prevLayout.current = settings.layout;
    if (settings.layout === 'letters') return;
    if (song) {
      const mine = song.notes.filter((n) => settings.hands === 'both' || n.hand === settings.hands).map((n) => n.midi);
      set('baseOctave', bestBaseOctave(mine, settings.layout));
    } else if (layoutChanged) set('baseOctave', defaultOctave(settings.layout));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, settings.hands, settings.layout]);

  const playable = useMemo(() => playableRange(settings.layout, settings.baseOctave), [settings.layout, settings.baseOctave]);
  useEffect(() => player.setRange(playable), [playable]);

  /* ---------- stage: canvas + keyboard geometry ---------- */
  const skyBox = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef<Sky | null>(null);
  const kb = useMemo(() => new KeyboardView(), []);

  useEffect(() => {
    const sky = new Sky(canvasRef.current!);
    skyRef.current = sky;
    const box = skyBox.current!;
    const ro = new ResizeObserver(() => {
      const r = box.getBoundingClientRect();
      sky.resize(r.width, r.height);
      setWidth(r.width);
    });
    ro.observe(box);
    let lastGuide = '';
    sky.onFrame = () => {
      const exp = player.expected();
      const key = exp.join(',');
      if (key !== lastGuide) {
        lastGuide = key;
        kb.setGuide(exp);
      }
    };
    return () => {
      ro.disconnect();
      sky.destroy();
    };
  }, [kb]);

  const range = visibleRange(width, playable);
  const keys = useMemo(() => layoutKeys(range[0], range[1]), [range[0], range[1]]);
  useEffect(() => skyRef.current?.setKeys(keys), [keys]);
  // Any state change may move the falling notes; ask the canvas for a frame.
  useEffect(() => {
    skyRef.current?.kick();
  });

  const keyLabel = useCallback(
    (midi: number) => (settings.labels === 'keys' || settings.labels === 'both' ? midiLabel(settings.layout, midi, settings.baseOctave) : null),
    [settings.labels, settings.layout, settings.baseOctave],
  );
  const promptLabel = useCallback(
    (midi: number) => (settings.labels === 'notes' ? midiToName(midi) : midiLabel(settings.layout, midi, settings.baseOctave) ?? midiToName(midi)),
    [settings.labels, settings.layout, settings.baseOctave],
  );
  useEffect(() => {
    if (skyRef.current) {
      skyRef.current.labelFor = promptLabel;
      skyRef.current.kick();
    }
  }, [promptLabel]);

  /* ---------- recording ---------- */
  const rec = useRef<Recording | null>(null);
  const stopRecording = useCallback(() => {
    const r = rec.current;
    rec.current = null;
    setRecording(false);
    if (!r) return;
    const now = performance.now();
    r.open.forEach((start, midi) => r.notes.push({ midi, time: (start - r.t0) / 1000, dur: (now - start) / 1000, hand: midi < 60 ? 'L' : 'R' }));
    if (!r.notes.length) return;
    const first = Math.min(...r.notes.map((n) => n.time));
    const notes = r.notes.map((n) => ({ ...n, time: n.time - first })).sort((a, b) => a.time - b.time);
    const count = userSongs.filter((s) => s.origin === 'recording').length + 1;
    const recSong: Song = {
      id: newId('rec'),
      title: `My recording ${count}`,
      artist: new Date().toLocaleDateString(),
      bpm: 60,
      difficulty: 'medium',
      origin: 'recording',
      notes,
    };
    setUserSongs((list) => [recSong, ...list]);
    setToast(`Saved "${recSong.title}" to your songs. Open it and press Listen to hear it back.`);
  }, [userSongs]);

  /* ---------- playing notes ---------- */
  const press = useCallback(
    (midi: number, velocity = 0.78) => {
      audio.noteOn(midi, velocity);
      skyRef.current?.noteOn(midi);
      kb.setDown(midi, true);
      setPlayed(true);
      if (rec.current) rec.current.open.set(midi, performance.now());
      if (player.song && player.mode !== 'listen') {
        if (player.status !== 'playing' && player.mode === 'learn' && player.expected().includes(midi)) player.start();
        player.userNote(midi);
      }
    },
    [kb],
  );

  const release = useCallback(
    (midi: number) => {
      audio.noteOff(midi);
      skyRef.current?.noteOff(midi);
      kb.setDown(midi, false);
      const r = rec.current;
      if (r && r.open.has(midi)) {
        const start = r.open.get(midi)!;
        r.open.delete(midi);
        r.notes.push({ midi, time: (start - r.t0) / 1000, dur: Math.max(0.08, (performance.now() - start) / 1000), hand: midi < 60 ? 'L' : 'R' });
      }
    },
    [kb],
  );

  useEffect(() => {
    player.events = {
      autoNote: (midi, on) => {
        kb.setAuto(midi, on);
        if (on) skyRef.current?.noteOn(midi, true);
        else skyRef.current?.noteOff(midi);
      },
      rating: (midi, r) => {
        skyRef.current?.rating(midi, r);
        if (r === 'wrong') kb.wrong(midi);
      },
      finished: (res) => {
        if (res.mode === 'listen') {
          player.reset();
          return;
        }
        setResult(res);
        const id = player.song?.id;
        if (id) {
          setScores((sc) => {
            const next = { ...sc, [id]: Math.max(sc[id] ?? 0, res.stars) };
            saveScores(next);
            return next;
          });
        }
      },
    };
  }, [kb]);

  /* ---------- transport ---------- */
  const togglePlay = useCallback(() => {
    if (!player.song) return;
    audio.ensure();
    setResult(null);
    player.toggle();
    skyRef.current?.kick();
  }, []);

  const restart = useCallback(() => {
    setResult(null);
    player.restart();
    skyRef.current?.clear();
    kb.releaseAll();
  }, [kb]);

  /* ---------- computer keyboard ---------- */
  const live = useRef({ settings, panel, press, release, togglePlay, restart });
  live.current = { settings, panel, press, release, togglePlay, restart };

  useEffect(() => {
    const active = new Map<string, number>();
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const { settings: s, press: p } = live.current;
      switch (e.code) {
        case 'Space':
          if (usesNativeActivation(document.activeElement)) return;
          e.preventDefault();
          if (!e.repeat) {
            audio.ensure();
            audio.setSustain(true);
            setSustain(true);
          }
          return;
        case 'Enter':
        case 'NumpadEnter':
          if (usesNativeActivation(document.activeElement)) return;
          e.preventDefault();
          if (!e.repeat) live.current.togglePlay();
          return;
        case 'Backspace':
          e.preventDefault();
          live.current.restart();
          return;
        case 'Escape':
          if (live.current.panel) setPanel(null);
          else if (player.status === 'done') setResult(null);
          else player.pause();
          return;
        case 'Tab':
          if (live.current.panel) return;
          e.preventDefault();
          setSettings((st) => ({ ...st, prompter: !st.prompter }));
          return;
        case 'ArrowLeft':
        case 'ArrowRight':
          if (s.layout === 'letters') return;
          e.preventDefault();
          setSettings((st) => {
            const [min, max] = octaveBounds(st.layout);
            return { ...st, baseOctave: Math.max(min, Math.min(max, st.baseOctave + (e.code === 'ArrowLeft' ? -1 : 1))) };
          });
          return;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          setSettings((st) => ({ ...st, speed: Math.round(Math.max(0.25, Math.min(1.5, st.speed + (e.code === 'ArrowUp' ? 0.05 : -0.05))) * 100) / 100 }));
          return;
      }
      const midi = codeToMidi(s.layout, e.code, e.shiftKey, s.baseOctave);
      if (midi === null) return;
      e.preventDefault();
      if (e.repeat || active.has(e.code)) return;
      active.set(e.code, midi);
      p(midi);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        audio.setSustain(false);
        setSustain(false);
      }
      const midi = active.get(e.code);
      if (midi === undefined) return;
      active.delete(e.code);
      live.current.release(midi);
    };
    const blur = () => {
      active.forEach((m) => live.current.release(m));
      active.clear();
      audio.setSustain(false);
      setSustain(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  /* ---------- free-play metronome ---------- */
  useEffect(() => {
    if (!settings.metronome || song) return;
    audio.ensure();
    let next = audio.now + 0.1;
    let beat = 0;
    const id = setInterval(() => {
      const spb = 60 / settings.freeBpm;
      if (next < audio.now) next = audio.now + 0.05;
      while (next < audio.now + 0.15) {
        audio.click(next, beat % 4 === 0);
        next += spb;
        beat++;
      }
    }, 30);
    return () => clearInterval(id);
  }, [settings.metronome, settings.freeBpm, song]);

  /* ---------- MIDI keyboard ---------- */
  const connectMidi = useCallback(async () => {
    if (!('requestMIDIAccess' in navigator)) {
      setMidiStatus('This browser has no MIDI support. Chrome and Edge do.');
      return;
    }
    try {
      const access = await navigator.requestMIDIAccess();
      const onMessage = (e: MIDIMessageEvent) => {
        if (!e.data) return;
        const [st, d1, d2] = e.data;
        const cmd = st & 0xf0;
        if (cmd === 0x90 && d2 > 0) live.current.press(d1, 0.25 + (d2 / 127) * 0.75);
        else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) live.current.release(d1);
        else if (cmd === 0xb0 && d1 === 64) {
          audio.setSustain(d2 >= 64);
          setSustain(d2 >= 64);
        }
      };
      const attach = () => {
        const names: string[] = [];
        access.inputs.forEach((input) => {
          input.onmidimessage = onMessage;
          names.push(input.name ?? 'MIDI keyboard');
        });
        setMidiStatus(names.length ? `Connected: ${names.join(', ')}` : 'No MIDI keyboard found. Plug one in and press Reconnect.');
      };
      attach();
      access.onstatechange = attach;
    } catch {
      setMidiStatus('MIDI access was blocked. Allow it in the browser and try again.');
    }
  }, []);

  /* ---------- songs ---------- */
  const pickSong = (id: string | null) => {
    if (recording) stopRecording();
    setResult(null);
    skyRef.current?.clear();
    kb.releaseAll();
    set('songId', id);
  };
  const saveSong = (s: Song) => setUserSongs((list) => (list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [s, ...list]));
  const deleteSong = (id: string) => {
    setUserSongs((list) => list.filter((s) => s.id !== id));
    if (settings.songId === id) set('songId', null);
  };

  const lock = async () => {
    await fetch('/__lock', { method: 'POST' }).catch(() => undefined);
    location.reload();
  };

  /* ---------- derived view state ---------- */
  const instrument = INSTRUMENTS.find((i) => i.id === settings.instrument)!;
  const [loadState] = audioKey.split(':');
  const userTotal = player.notes.filter((n) => n.user).length;
  const userDone = player.notes.filter((n) => n.user && n.judged && n.judged !== 'miss').length;
  const playing = player.status === 'playing';
  const showPrompter = settings.prompter && !!song && player.steps.length > 0;
  const lowName = midiToName(playable[0]);
  const highName = midiToName(playable[1]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark" aria-label="Pianinko">
          <span className="bubble-mark" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span>Pianinko</span>
        </div>

        <div className="topbar__group">
          <button
            className="pill song-pill"
            onClick={() => {
              setLibTab('library');
              setPanel('library');
            }}
            aria-label={`Song: ${song?.title ?? 'Free play'}. Change song`}
          >
            <span className="song-pill__icon">
              <IconMusic size={14} />
            </span>
            <span className="song-pill__text">
              <span className="song-pill__title">{song?.title ?? 'Free play'}</span>
              <span className="song-pill__meta">{song ? `${song.artist ? `${song.artist} · ` : ''}${Math.round(song.bpm * settings.speed)} bpm` : 'Pick a song to learn'}</span>
            </span>
            <IconChevron size={14} style={{ color: 'var(--ink-3)' }} />
          </button>

          {song && (
            <div className="segmented" role="group" aria-label="Practice mode">
              {MODES.map(([m, label]) => (
                <button key={m} aria-pressed={settings.mode === m} onClick={() => set('mode', m)}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {song ? (
            <>
              <button className="pill pill--ink" onClick={togglePlay} style={{ paddingLeft: 16, paddingRight: 20 }}>
                {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
                {playing ? 'Pause' : player.status === 'paused' ? 'Resume' : 'Start'}
              </button>
              <button className="pill pill--ghost pill--icon" onClick={restart} aria-label="Restart song">
                <IconRestart size={16} />
              </button>
            </>
          ) : (
            <button
              className={`pill${recording ? ' pill--ink is-recording' : ''}`}
              onClick={() => {
                if (recording) stopRecording();
                else {
                  audio.ensure();
                  rec.current = { t0: performance.now(), open: new Map(), notes: [] };
                  setRecording(true);
                }
              }}
            >
              <span className="rec-dot" />
              {recording ? 'Stop and save' : 'Record'}
            </button>
          )}
        </div>

        <div className="topbar__group">
          <button className="pill hide-md" onClick={() => setPanel('instrument')} aria-label={`Instrument: ${instrument.name}`}>
            {settings.instrument === 'piano' && loadState === 'loading' ? (
              <span className="loading-dot" style={{ ['--p' as string]: `${Math.round(audio.loadProgress * 100)}%` }} />
            ) : (
              <span className="dot" style={{ background: instrument.swatch }} />
            )}
            {instrument.name}
          </button>
          <button
            className={`pill${settings.prompter ? ' pill--on' : ''}`}
            aria-pressed={settings.prompter}
            onClick={() => set('prompter', !settings.prompter)}
            title="Show the keys to press (Tab)"
          >
            <IconPrompter size={16} />
            <span className="hide-lg">Prompter</span>
          </button>
          <button className="pill pill--icon" onClick={() => setPanel(panel === 'settings' ? null : 'settings')} aria-label="Settings">
            <IconSliders size={16} />
          </button>
        </div>
      </header>

      <main className="stage">
        <div className="sky" ref={skyBox}>
          <canvas ref={canvasRef} aria-hidden />
          {!song && (
            <div className={`sky__empty${played ? ' is-hidden' : ''}`}>
              <strong>Play something</strong>
              <span>
                {settings.layout === 'piano'
                  ? 'The Q row is the middle of the piano, the numbers above it are its black keys. A and Z rows go lower on the left and higher on the right. Shift + a letter plays its black key, Space lets notes ring.'
                  : settings.layout === 'rows'
                    ? 'Press any key from Z to M or Q to P. The rows above them are the black keys. Hold Space to let notes ring.'
                    : 'Press any number or letter key. Hold Shift for black keys, Space to let notes ring.'}
              </span>
            </div>
          )}
          {showPrompter && (
            <Teleprompter
              steps={player.steps}
              index={player.promptIndex}
              labelFor={promptLabel}
              finished={player.status === 'done'}
              compact={width < 760}
            />
          )}
        </div>

        <Keyboard
          view={kb}
          keys={keys}
          playable={playable}
          labelFor={keyLabel}
          showNoteNames={settings.labels === 'notes' || settings.labels === 'both'}
          onPress={press}
          onRelease={release}
        />

        <div className="hints">
          <div className="hints__group">
            {settings.layout !== 'letters' ? (
              <>
                <button className="keycap keycap--btn" onClick={() => set('baseOctave', Math.max(octaveBounds(settings.layout)[0], settings.baseOctave - 1))} aria-label="Octave down">
                  ←
                </button>
                <span className="hints__octave">
                  Keys {lowName} – {highName}
                </span>
                <button className="keycap keycap--btn" onClick={() => set('baseOctave', Math.min(octaveBounds(settings.layout)[1], settings.baseOctave + 1))} aria-label="Octave up">
                  →
                </button>
              </>
            ) : (
              <span className="hints__octave">Keys C2 – C7</span>
            )}
          </div>
          <div className="hints__shortcuts">
            <span className="hint">
              <span className={`keycap${sustain ? ' keycap--on' : ''}`}>Space</span> sustain
            </span>
            {song && (
              <span className="hint">
                <span className="keycap">Enter</span> {playing ? 'pause' : 'start'}
              </span>
            )}
            <span className="hint">
              <span className="keycap">Tab</span> prompter
            </span>
            {song && (
              <span className="hint hide-lg">
                <span className="keycap">↑↓</span> speed {Math.round(settings.speed * 100)}%
              </span>
            )}
          </div>
          <div className="hints__group">
            {song ? (
              settings.mode === 'listen' ? (
                <>
                  <span className="hint">Listening</span>
                  <span className="progress">
                    <i style={{ width: `${player.progress * 100}%` }} />
                  </span>
                </>
              ) : (
                <>
                  {player.stats.combo > 2 && <span className="combo">Streak {player.stats.combo}</span>}
                  <span className="hint">
                    {userDone} of {userTotal} notes
                  </span>
                  <span className="progress">
                    <i style={{ width: `${userTotal ? (userDone / userTotal) * 100 : 0}%` }} />
                  </span>
                </>
              )
            ) : (
              <span className="hint">{recording ? 'Recording your playing' : 'Free play'}</span>
            )}
          </div>
        </div>
      </main>

      {panel === 'library' && (
        <LibrarySheet
          tab={libTab}
          onTab={setLibTab}
          library={LIBRARY_SONGS}
          extra={privateSongs}
          userSongs={userSongs}
          currentId={settings.songId && song ? song.id : null}
          scores={scores}
          editing={editing}
          onEdit={setEditing}
          onPick={pickSong}
          onSave={saveSong}
          onDelete={deleteSong}
          onClose={() => setPanel(null)}
          toast={setToast}
        />
      )}
      {panel === 'settings' && (
        <SettingsPopover
          s={settings}
          set={set}
          midiStatus={midiStatus}
          onConnectMidi={connectMidi}
          onHelp={() => setPanel('help')}
          onLock={lock}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'instrument' && (
        <InstrumentMenu
          value={settings.instrument}
          loadState={audio.loadState}
          progress={audio.loadProgress}
          onPick={(id) => {
            audio.ensure();
            set('instrument', id);
          }}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'help' && (
        <HelpModal
          layout={settings.layout}
          onClose={() => {
            setPanel(null);
            set('seenHelp', true);
          }}
        />
      )}
      {result && song && (
        <ResultsModal
          result={result}
          title={song.title}
          onAgain={() => {
            setResult(null);
            player.reset();
            if (player.mode !== 'learn') player.start();
            skyRef.current?.kick();
          }}
          onPick={() => {
            setResult(null);
            setLibTab('library');
            setPanel('library');
          }}
          onClose={() => setResult(null)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
