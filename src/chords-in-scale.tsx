import type { JSX } from "react";
import { type Note, type Scale, chordForNote, chordName } from "./music.ts";

type ChordsInScaleProps = {
  readonly scale: Scale;
};

export function ChordsInScale({ scale }: ChordsInScaleProps): JSX.Element {
  return (
    <ul>
      {scale.notes.items.map((note: Note) => (
        <li key={note} className="text-lg py-1 text-zinc-600">
          {chordName(chordForNote(scale, note))}
        </li>
      ))}
    </ul>
  );
}
