import { midiToName } from '../lib/notes.ts';
import type { Step } from '../player/player.ts';

interface Props {
  steps: Step[];
  index: number;
  labelFor: (midi: number) => string | null;
  finished: boolean;
  compact: boolean;
}

function StepKeys({ step, cls, labelFor }: { step: Step; cls: string; labelFor: Props['labelFor'] }) {
  const notes = [...step.notes].sort((a, b) => b.midi - a.midi);
  const chord = notes.length > 1;
  const left = notes.every((n) => n.hand === 'L');
  return (
    <div className={`pstep ${cls}${chord ? ' pstep--chord' : ''}${left ? ' pstep--l' : ''}`}>
      {notes.slice(0, 4).map((n) => (
        <div key={n.id} className={`pkey${n.hand === 'L' ? ' pkey--l' : ''}${cls === 'pstep--past' ? ' pkey--past' : ''}`}>
          {labelFor(n.midi) ?? midiToName(n.midi)}
        </div>
      ))}
    </div>
  );
}

/** The strip of keys to press: two you just played, the one to press now, and what comes next. */
export function Teleprompter({ steps, index, labelFor, finished, compact }: Props) {
  if (!steps.length) return null;
  if (finished || index >= steps.length) {
    return (
      <div className="prompter" role="status">
        <div className="prompter__done">That was the last note. Press Enter to play it again.</div>
      </div>
    );
  }
  const now = steps[index];
  const past = steps.slice(Math.max(0, index - 2), index);
  const next = steps.slice(index + 1, index + 1 + (compact ? 3 : 6));
  const names = [...now.notes].sort((a, b) => b.midi - a.midi).map((n) => midiToName(n.midi)).join(' ');
  return (
    <div className="prompter" aria-live="polite" aria-label={`Next: ${names}`}>
      {past.length > 0 && (
        <div className="prompter__past">
          {past.map((s, i) => (
            <StepKeys key={index - past.length + i} step={s} cls="pstep--past" labelFor={labelFor} />
          ))}
        </div>
      )}
      <div className="prompter__now">
        <StepKeys key={index} step={now} cls="pstep--now" labelFor={labelFor} />
        <span className="prompter__names">{names}</span>
      </div>
      {next.length > 0 && (
        <div className="prompter__next">
          {next.map((s, i) => (
            <StepKeys
              key={index + 1 + i}
              step={s}
              cls={i === 0 ? 'pstep--next' : i === 1 ? 'pstep--later1' : 'pstep--later'}
              labelFor={labelFor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
