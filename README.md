# Pianinko

A private little piano for the browser. Play it with your computer keyboard (or a real MIDI keyboard), learn songs with a teleprompter and falling notes, and watch every note float up as a pastel bubble stream.

## What it does

- **Play with your keyboard.** Three layouts:
  - **Piano** (default): the Q row (`Q` to `\`) is the middle of the piano, C4–A5, with its black keys on the number row above. The A and Z rows reach outwards: `A`–`J` is the octave below (C3–B3) and `Z`–`M` the one below that (C2–B2), for your left hand; `K L ; '` and `, . /` continue above the Q row (B5–A6). `Shift` + any letter plays the black key above it. `←` `→` move everything an octave.
  - **Classic rows**: `Z`–`/` and `Q`–`]` are white keys, the row above each holds the black keys.
  - **Letter sheets**: `1` to `M` covers five octaves, `Shift` plays the black key. Matches virtualpiano.net sheets, so you can paste those straight in.
  - Keys are matched by physical position, so it works with any keyboard language switched on.
- **Learn songs** in three modes:
  - **Learn**: the song waits on every note until you press it. Playing ahead pulls the song forward.
  - **Play along**: the song keeps the beat and rates each note Perfect / Good / Miss.
  - **Listen**: the app plays the song for you on the chosen instrument.
- **Teleprompter** (`Tab`): the big black key is the one to press now, the outlined one is next.
- **Falling notes** land on the keys they belong to; the other hand (or notes outside your keyboard range) is played for you.
- **Sounds**: a sampled concert grand, electric piano, music box, soft pad and 8-bit. Room echo, volume, sustain pedal (`Space`).
- **Your own songs**: write notes by hand, paste a letter sheet, import any `.mid` file, or record yourself in free play.
- **Learn any song**: type a song name and get its melody as notes (needs an Anthropic API key on the server).
- Speed 25–150% (`↑` `↓`), one hand or both, metronome, stars for your best run, MIDI keyboard input.

## Writing songs

```
tempo: 100
R: C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2
L: C3:2 E3:2   | F3:2 E3:2  | D3:2 C3:2   | G2:2 C3:2
```

- `C4` is middle C; `F#4`, `Bb3` for sharps and flats. Leave the octave out and the last one is reused.
- Each note is one beat. `C4:2`, `C4:0.5`, `C4:1/3`, or `G4--` (three beats).
- `r` / `r:2` rests, `[C4 E4 G4]:2` chords, `R:` / `L:` pick the hand, `|` is just for reading, `//` comments.

## Shortcuts

| Key | Does |
| --- | --- |
| `Space` (hold) | Sustain pedal |
| `Enter` | Start / pause the song |
| `Backspace` | Restart |
| `Tab` | Show or hide the prompter |
| `← →` | Move the octave (piano rows) |
| `↑ ↓` | Speed |
| `Esc` | Close a panel / pause |

## Develop

```bash
npm install
npm run dev
```

The access gate runs as Vercel routing middleware, so `npm run dev` opens the piano directly.

## Deploy (Vercel)

Set these environment variables on the project:

| Name | Purpose |
| --- | --- |
| `ACCESS_CODE` | The code that opens the piano. Required; the site stays locked without it. |
| `ANTHROPIC_API_KEY` | Optional. Turns on "Learn any song". |

The gate stores an HMAC of the code in an HttpOnly cookie, so the code never appears in this repository or in the browser bundle. Changing `ACCESS_CODE` signs everyone out.

## Credits

- Piano: [Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm, CC BY 3.0, served from the Tone.js audio CDN.
- Built-in songs are public-domain melodies.
- Fonts: Fira Sans Extra Condensed, Onest, Geist Mono (Google Fonts).
