/**
 * "Learn any song": turns a song name into a playable melody in Pianinko notation.
 * Needs ANTHROPIC_API_KEY in the project environment; without it the endpoint answers 501
 * and the app tells the user how to add songs by hand instead. The access-code middleware
 * guards this route like every other.
 */
import Anthropic from '@anthropic-ai/sdk';

declare const process: { env: Record<string, string | undefined> };

const SYSTEM = `You transcribe songs for a beginner piano app. Given a song name, write the melody the
listener would recognise (the main theme, hook or chorus) so someone can learn it on a piano.

Write it in this notation:
- Notes: letter A-G, optional # or b, octave number (C4 is middle C). Always include the octave.
- Duration in beats after a colon: C4:2, E4:0.5, G4:1.5, triplets C4:1/3. No colon means one beat (a quarter note).
- Rests: r or r:2. Chords: [C3 E3 G3]:2.
- One line starting "R:" for the right hand melody and one starting "L:" for a simple left hand
  (root notes or easy two- or three-note chords, one per beat or bar). Each hand has its own timeline
  from beat 0, so the left hand uses rests where needed and both hands add up to the same length.
- Use | between bars so it is readable.

Keep the right hand between C4 and C6 and the left hand between C2 and C4. Prefer the original key unless it
puts the melody out of that range. Aim for 8 to 32 bars. Get the rhythm right: durations must add up bar by bar.
If you don't know the song well enough to write its melody accurately, set found to false and explain in note.`;

const SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    title: { type: 'string' },
    artist: { type: 'string' },
    bpm: { type: 'integer' },
    notation: { type: 'string' },
    note: { type: 'string' },
  },
  required: ['found', 'title', 'artist', 'bpm', 'notation', 'note'],
  additionalProperties: false,
} as const;

interface Composed {
  found: boolean;
  title: string;
  artist: string;
  bpm: number;
  notation: string;
  note: string;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'Song lookup is not configured. Add ANTHROPIC_API_KEY to the project environment.' }, 501);
  }

  const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 140) : '';
  if (!query) return json({ error: 'Type the name of a song.' }, 400);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Song: ${query}` }],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'That song could not be written out. Try another one.' }, 422);
    }
    if (response.stop_reason === 'max_tokens') {
      return json({ error: 'That song came out too long. Ask for one part of it, like "the chorus".' }, 422);
    }
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'No song came back. Try again.' }, 502);

    const out = JSON.parse(text.text) as Composed;
    if (!out.found || !out.notation.trim()) {
      return json({ error: out.note || "That song isn't familiar enough to write out. Try adding the artist's name." }, 404);
    }
    return json({
      title: out.title,
      artist: out.artist,
      bpm: Math.max(40, Math.min(200, Math.round(out.bpm) || 90)),
      notation: out.notation,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: 'The server API key was rejected. Check ANTHROPIC_API_KEY.' }, 500);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'Too many songs at once. Wait a minute and try again.' }, 429);
    }
    if (error instanceof Anthropic.APIError) {
      return json({ error: `The song service had a problem (${error.status ?? 'network'}). Try again.` }, 502);
    }
    if (error instanceof SyntaxError) {
      return json({ error: 'The song came back garbled. Try again.' }, 502);
    }
    throw error;
  }
}
