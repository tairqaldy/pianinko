import type { CSSProperties, ReactNode } from 'react';
import { INSTRUMENTS, type InstrumentId, type LoadState } from '../audio/engine.ts';
import { BASE_OCTAVE_MAX, BASE_OCTAVE_MIN, LAYOUTS, type LayoutId } from '../lib/keymap.ts';
import type { LabelMode, Settings } from '../lib/storage.ts';
import type { HandsChoice, Result } from '../player/player.ts';
import { IconMinus, IconPlus } from './Icons.tsx';

function Slider({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ '--fill': `${fill}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="segmented segmented--small segmented--fill">
      {options.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Popover({ children, label, onClose }: { children: ReactNode; label: string; onClose: () => void }) {
  return (
    <>
      <div className="scrim" style={{ background: 'transparent' }} onClick={onClose} />
      <div className="popover" role="dialog" aria-label={label}>
        {children}
      </div>
    </>
  );
}

interface SettingsProps {
  s: Settings;
  set: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  midiStatus: string | null;
  onConnectMidi: () => void;
  onHelp: () => void;
  onLock: () => void;
  onClose: () => void;
}

export function SettingsPopover({ s, set, midiStatus, onConnectMidi, onHelp, onLock, onClose }: SettingsProps) {
  const layout = LAYOUTS.find((l) => l.id === s.layout)!;
  return (
    <Popover label="Settings" onClose={onClose}>
      <h3>Sound</h3>
      <div className="setting">
        <div className="setting__row">
          Volume <span className="setting__value">{Math.round(s.volume * 100)}%</span>
        </div>
        <Slider label="Volume" value={s.volume} min={0} max={1} step={0.01} onChange={(v) => set('volume', v)} />
      </div>
      <div className="setting">
        <div className="setting__row">
          Room echo <span className="setting__value">{Math.round(s.reverb * 100)}%</span>
        </div>
        <Slider label="Room echo" value={s.reverb} min={0} max={0.8} step={0.01} onChange={(v) => set('reverb', v)} />
      </div>

      <h3>Practice</h3>
      <div className="setting">
        <div className="setting__row">
          Speed <span className="setting__value">{Math.round(s.speed * 100)}%</span>
        </div>
        <Slider label="Speed" value={s.speed} min={0.25} max={1.5} step={0.05} onChange={(v) => set('speed', v)} />
      </div>
      <div className="setting">
        <div className="setting__row">Hands you play</div>
        <Seg<HandsChoice> value={s.hands} options={[['both', 'Both'], ['R', 'Right'], ['L', 'Left']]} onChange={(v) => set('hands', v)} />
        <span className="setting__hint">The app plays the other hand for you.</span>
      </div>
      <div className="setting__row">
        Metronome
        <Switch label="Metronome" on={s.metronome} onChange={(v) => set('metronome', v)} />
      </div>
      {s.metronome && (
        <div className="setting">
          <div className="setting__row">
            Free play tempo <span className="setting__value">{s.freeBpm} bpm</span>
          </div>
          <Slider label="Free play tempo" value={s.freeBpm} min={40} max={200} step={1} onChange={(v) => set('freeBpm', v)} />
        </div>
      )}

      <h3>Keyboard</h3>
      <div className="setting">
        <Seg<LayoutId> value={s.layout} options={LAYOUTS.map((l) => [l.id, l.name])} onChange={(v) => set('layout', v)} />
        <span className="setting__hint">{layout.hint}</span>
      </div>
      {s.layout === 'rows' && (
        <div className="setting__row">
          Octave of Z key
          <span className="hints__group">
            <button className="keycap keycap--btn" aria-label="Octave down" onClick={() => set('baseOctave', Math.max(BASE_OCTAVE_MIN, s.baseOctave - 1))}>
              <IconMinus size={12} />
            </button>
            <span className="setting__value">C{s.baseOctave}</span>
            <button className="keycap keycap--btn" aria-label="Octave up" onClick={() => set('baseOctave', Math.min(BASE_OCTAVE_MAX, s.baseOctave + 1))}>
              <IconPlus size={12} />
            </button>
          </span>
        </div>
      )}
      <div className="setting">
        <div className="setting__row">Labels on keys</div>
        <Seg<LabelMode> value={s.labels} options={[['keys', 'Keys'], ['notes', 'Notes'], ['both', 'Both'], ['off', 'Off']]} onChange={(v) => set('labels', v)} />
      </div>
      <div className="setting">
        <div className="setting__row">
          MIDI keyboard
          <button className="pill" style={{ height: 34 }} onClick={onConnectMidi}>
            {midiStatus ? 'Reconnect' : 'Connect'}
          </button>
        </div>
        <span className="setting__hint">{midiStatus ?? 'Plug in a real piano or MIDI keyboard over USB and connect it here.'}</span>
      </div>

      <div className="row" style={{ paddingTop: 4 }}>
        <button className="pill" onClick={onHelp}>How to play</button>
        <button className="pill pill--quiet" onClick={onLock}>Lock the piano</button>
      </div>
    </Popover>
  );
}

export function InstrumentMenu({ value, loadState, progress, onPick, onClose }: { value: InstrumentId; loadState: LoadState; progress: number; onPick: (id: InstrumentId) => void; onClose: () => void }) {
  return (
    <Popover label="Instrument" onClose={onClose}>
      <h3>Instrument</h3>
      <div className="menu" role="menu">
        {INSTRUMENTS.map((ins) => (
          <button
            key={ins.id}
            role="menuitemradio"
            aria-checked={value === ins.id}
            onClick={() => {
              onPick(ins.id);
              onClose();
            }}
          >
            <span className="menu__swatch" style={{ background: ins.swatch }}>
              {value === ins.id && <span className="dot" style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }} />}
            </span>
            <span className="menu__text">
              <strong>{ins.name}</strong>
              <span>
                {ins.id === 'piano' && loadState === 'loading'
                  ? `Loading the piano… ${Math.round(progress * 100)}%`
                  : ins.id === 'piano' && loadState === 'error'
                    ? 'Recordings could not load, a soft synth stands in'
                    : ins.hint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Popover>
  );
}

export function ResultsModal({ result, title, onAgain, onPick, onClose }: { result: Result; title: string; onAgain: () => void; onPick: () => void; onClose: () => void }) {
  const pct = Math.round(result.accuracy * 100);
  const headline = result.stars === 3 ? 'Beautiful' : result.stars === 2 ? 'Nicely played' : result.stars === 1 ? 'Getting there' : 'Keep going';
  const s = result.stats;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Results">
        <div className="result-stars" aria-label={`${result.stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < result.stars ? 'on' : ''} />
          ))}
        </div>
        <div>
          <h2 className="modal__title">{headline}</h2>
          <p className="modal__lead">
            You finished {title} with {pct}% accuracy.
            {result.stars < 3 && (result.mode === 'play' ? ' Slow the speed down in settings to land more notes.' : ' Play it once more and the keys start to feel familiar.')}
          </p>
        </div>
        <div className="stat-row">
          <div className="stat"><strong>{pct}%</strong><span>accuracy</span></div>
          <div className="stat"><strong>{s.perfect + s.good}</strong><span>notes hit</span></div>
          <div className="stat"><strong>{s.miss + s.wrong}</strong><span>slips</span></div>
          <div className="stat"><strong>{s.bestCombo}</strong><span>best streak</span></div>
        </div>
        <div className="row row--end">
          <button className="pill" onClick={onPick}>Pick another song</button>
          <button className="pill pill--ink" onClick={onAgain} autoFocus>Play again</button>
        </div>
      </div>
    </>
  );
}

const ROWS_MAP: { k: string; c: string }[][] = [
  [{ k: '1', c: '' }, { k: '2', c: 'b' }, { k: '3', c: 'b' }, { k: '4', c: '' }, { k: '5', c: 'b' }, { k: '6', c: 'b' }, { k: '7', c: 'b' }, { k: '8', c: '' }, { k: '9', c: 'b' }, { k: '0', c: 'b' }, { k: '-', c: '' }, { k: '=', c: 'b' }],
  [{ k: 'Q', c: 'w' }, { k: 'W', c: 'w' }, { k: 'E', c: 'w' }, { k: 'R', c: 'w' }, { k: 'T', c: 'w' }, { k: 'Y', c: 'w' }, { k: 'U', c: 'w' }, { k: 'I', c: 'w' }, { k: 'O', c: 'w' }, { k: 'P', c: 'w' }, { k: '[', c: 'w' }, { k: ']', c: 'w' }],
  [{ k: 'A', c: '' }, { k: 'S', c: 'b' }, { k: 'D', c: 'b' }, { k: 'F', c: '' }, { k: 'G', c: 'b' }, { k: 'H', c: 'b' }, { k: 'J', c: 'b' }, { k: 'K', c: '' }, { k: 'L', c: 'b' }, { k: ';', c: 'b' }],
  [{ k: 'Z', c: 'w' }, { k: 'X', c: 'w' }, { k: 'C', c: 'w' }, { k: 'V', c: 'w' }, { k: 'B', c: 'w' }, { k: 'N', c: 'w' }, { k: 'M', c: 'w' }, { k: ',', c: 'w' }, { k: '.', c: 'w' }, { k: '/', c: 'w' }],
];

export function HelpModal({ layout, onClose }: { layout: LayoutId; onClose: () => void }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="How to play">
        <h2 className="modal__title">How to play</h2>
        <ol className="help-steps">
          <li>
            <span>
              <strong>Your keyboard is the piano.</strong>{' '}
              {layout === 'rows'
                ? 'The bottom letter row (Z to /) and the Q row are white keys. The row above each one holds the black keys, just like on a real piano. ← and → move everything an octave.'
                : 'Every number and letter from 1 to M is a white key, low to high. Hold Shift for the black key above it.'}
            </span>
          </li>
          <li>
            <span>
              <strong>Pick a song</strong> from the song button at the top. Learn mode waits for you on every note, Play along keeps the beat, Listen plays it for you.
            </span>
          </li>
          <li>
            <span>
              <strong>Follow the prompter.</strong> The big black key is the one to press now, the outlined one comes next. Notes also fall onto the keys they belong to.
            </span>
          </li>
          <li>
            <span>
              <strong>Hold Space</strong> as the sustain pedal so notes ring on. Enter starts and pauses, Tab hides the prompter.
            </span>
          </li>
        </ol>
        {layout === 'rows' && (
          <div className="kbd-map" aria-label="Keyboard map: outlined keys are white piano keys, filled keys are black piano keys">
            {ROWS_MAP.map((row, i) => (
              <div className="kbd-map__row" key={i} style={{ paddingLeft: [0, 14, 22, 36][i] }}>
                {row.map((cell) => (
                  <span key={cell.k} className={cell.c}>
                    {cell.k}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="row row--end">
          <button className="pill pill--ink" onClick={onClose} autoFocus>
            Start playing
          </button>
        </div>
      </div>
    </>
  );
}
