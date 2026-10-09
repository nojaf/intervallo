import type { JSX } from "react";
import type { Note } from "./music.ts";

// One color per note, defined in index.css as --color-note-*. The hues run around the
// color wheel in chromatic order (30° per semitone), so the scale circle reads as a wheel.
const noteBackgrounds: Record<Note, string> = {
  C: "bg-note-c",
  "C#": "bg-note-cs",
  D: "bg-note-d",
  "D#": "bg-note-ds",
  E: "bg-note-e",
  F: "bg-note-f",
  "F#": "bg-note-fs",
  G: "bg-note-g",
  "G#": "bg-note-gs",
  A: "bg-note-a",
  "A#": "bg-note-as",
  B: "bg-note-b",
};

export function noteColor(note: Note): string {
  return `${noteBackgrounds[note]} text-neutral`;
}

// Marks a root note: a dark ring behind a light gap, so it shows on the wood and on the page.
export const rootRing: string = "ring-2 ring-neutral ring-offset-2 ring-offset-inlay font-bold";

type NoteDotProps = {
  readonly note: Note;
};

// A small swatch of a note's color, for lists and legends.
export function NoteDot({ note }: NoteDotProps): JSX.Element {
  return <span className={`inline-block w-3 h-3 shrink-0 rounded-full ${noteBackgrounds[note]}`} />;
}
