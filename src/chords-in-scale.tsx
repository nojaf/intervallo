import type { JSX } from "react";
import { type Note, type Scale, chordForNote, chordName } from "./music.ts";
import { NoteDot } from "./note-colors.tsx";

type ChordsInScaleProps = {
  readonly scale: Scale;
};

export function ChordsInScale({ scale }: ChordsInScaleProps): JSX.Element {
  return (
    <ul>
      {scale.notes.items.map((note: Note) => (
        <li key={note} className="text-lg py-1 text-base-content/80 flex items-center gap-2">
          <NoteDot note={note} />
          {chordName(chordForNote(scale, note))}
        </li>
      ))}
    </ul>
  );
}
