import { memo, useEffect, useRef } from 'react';
import { midiToName, pitchPastel } from '../lib/notes.ts';
import type { KeyRect } from '../visual/geometry.ts';

/**
 * Key highlights change many times a second, so they bypass React: the view toggles data
 * attributes on the key elements directly.
 */
export class KeyboardView {
  private els = new Map<number, HTMLElement>();
  private down = new Map<number, number>();
  private guide = new Set<number>();

  register(midi: number, el: HTMLElement | null) {
    if (el) {
      this.els.set(midi, el);
      el.style.setProperty('--hl', pitchPastel(midi));
      if (this.down.get(midi)) el.dataset.down = '';
      if (this.guide.has(midi)) el.dataset.guide = '';
    } else this.els.delete(midi);
  }

  setDown(midi: number, on: boolean) {
    const n = Math.max(0, (this.down.get(midi) ?? 0) + (on ? 1 : -1));
    this.down.set(midi, n);
    const el = this.els.get(midi);
    if (!el) return;
    if (n > 0) el.dataset.down = '';
    else delete el.dataset.down;
  }

  setAuto(midi: number, on: boolean) {
    const el = this.els.get(midi);
    if (!el) return;
    if (on) el.dataset.auto = '';
    else delete el.dataset.auto;
  }

  setGuide(midis: number[]) {
    const next = new Set(midis);
    for (const m of this.guide) if (!next.has(m)) delete this.els.get(m)?.dataset.guide;
    for (const m of next) {
      const el = this.els.get(m);
      if (el) el.dataset.guide = '';
    }
    this.guide = next;
  }

  wrong(midi: number) {
    const el = this.els.get(midi);
    if (!el) return;
    delete el.dataset.wrong;
    void el.offsetWidth;
    el.dataset.wrong = '';
    setTimeout(() => delete el.dataset.wrong, 280);
  }

  releaseAll() {
    this.down.clear();
    for (const el of this.els.values()) {
      delete el.dataset.down;
      delete el.dataset.auto;
    }
  }
}

interface Props {
  view: KeyboardView;
  keys: Map<number, KeyRect>;
  playable: [number, number];
  labelFor: (midi: number) => string | null;
  showNoteNames: boolean;
  onPress: (midi: number) => void;
  onRelease: (midi: number) => void;
}

export const Keyboard = memo(function Keyboard({ view, keys, playable, labelFor, showNoteNames, onPress, onRelease }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, number>());
  const handlers = useRef({ onPress, onRelease });
  handlers.current = { onPress, onRelease };

  useEffect(() => {
    const el = ref.current!;
    const keyAt = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-midi]');
      return hit && el.contains(hit) ? Number(hit.dataset.midi) : null;
    };
    const down = (e: PointerEvent) => {
      if (e.button > 0) return;
      const midi = keyAt(e.clientX, e.clientY);
      if (midi === null) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, midi);
      handlers.current.onPress(midi);
    };
    const move = (e: PointerEvent) => {
      const cur = pointers.current.get(e.pointerId);
      if (cur === undefined) return;
      const midi = keyAt(e.clientX, e.clientY);
      if (midi === null || midi === cur) return;
      handlers.current.onRelease(cur);
      pointers.current.set(e.pointerId, midi);
      handlers.current.onPress(midi);
    };
    const up = (e: PointerEvent) => {
      const cur = pointers.current.get(e.pointerId);
      if (cur === undefined) return;
      pointers.current.delete(e.pointerId);
      handlers.current.onRelease(cur);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, []);

  const rects = [...keys.values()].sort((a, b) => Number(a.black) - Number(b.black) || a.midi - b.midi);
  const firstWhite = rects.find((r) => !r.black)?.midi;
  const inBand = [...keys.values()].filter((r) => r.midi >= playable[0] && r.midi <= playable[1] && !r.black);
  const band = inBand.length
    ? { left: Math.min(...inBand.map((r) => r.x)), right: Math.max(...inBand.map((r) => r.x + r.w)) }
    : null;

  return (
    <div className="piano" ref={ref} role="group" aria-label="Piano keys">
      {rects.map((r) => {
        const label = labelFor(r.midi);
        const out = r.midi < playable[0] || r.midi > playable[1];
        return (
          <div
            key={r.midi}
            ref={(el) => view.register(r.midi, el)}
            data-midi={r.midi}
            className={`key ${r.black ? 'key--black' : 'key--white'}${r.midi === firstWhite ? ' is-first' : ''}${out && !r.black ? ' is-out' : ''}`}
            style={{ left: `${r.x * 100}%`, width: `${r.w * 100}%` }}
            aria-label={midiToName(r.midi)}
          >
            {showNoteNames && <span className="key__note">{midiToName(r.midi)}</span>}
            {label && <span className="key__label">{label}</span>}
          </div>
        );
      })}
      {band && <div className="piano__band" style={{ left: `${band.left * 100}%`, width: `${(band.right - band.left) * 100}%` }} aria-hidden />}
    </div>
  );
});
