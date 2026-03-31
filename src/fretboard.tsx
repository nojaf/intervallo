import { type Note, chromaticRing } from "./music.ts";
import type { JSX } from "react";

type NoteHighlight = "primary" | "secondary" | "grayed-out" | "regular";

function highlightColors(highlight: NoteHighlight): string {
  switch (highlight) {
    case "regular":
      return "bg-zinc-950 text-white";
    case "primary":
      return "bg-yellow-400 text-white";
    case "secondary":
      return "bg-orange-500 text-white";
    case "grayed-out":
      return "bg-zinc-950 opacity-10 text-white";
    default:
      throw new Error(`Unknown highlight: ${String(highlight satisfies never)}`);
  }
}

type NoteCircleProps = {
  readonly note: Note;
  readonly highlight: NoteHighlight;
};

function NoteCircle({ note, highlight }: NoteCircleProps): JSX.Element {
  return (
    <div
      className={`z-2 rounded-full ${highlightColors(highlight)} flex items-center justify-center h-7.5 w-7.5 text-sm`}
    >
      {note}
    </div>
  );
}

type FretProps = {
  readonly note: Note;
  readonly highlight: NoteHighlight;
};

function Fret({ note, highlight }: FretProps): JSX.Element {
  return (
    <div className="bg-yellow-800 border-r-4 border-neutral-400 flex-1 min-w-10 p-2 flex items-center justify-end">
      <NoteCircle note={note} highlight={highlight} />
    </div>
  );
}

type OpenStringProps = {
  readonly openNote: Note;
  readonly highlight: NoteHighlight;
};

function OpenString({ openNote, highlight }: OpenStringProps): JSX.Element {
  return (
    <div className="shrink-0">
      <NoteCircle note={openNote} highlight={highlight} />
    </div>
  );
}

type GuitarStringProps = {
  readonly openNote: Note;
  readonly maxFrets?: number;
  readonly highlighter: (note: Note) => NoteHighlight;
};

function GuitarString({ openNote, maxFrets = 15, highlighter }: GuitarStringProps): JSX.Element {
  const openNoteIdx: number = chromaticRing.indexOf(openNote);
  return (
    <div className="flex gap-4 items-center w-full">
      <OpenString openNote={openNote} highlight={highlighter(openNote)} />
      <div className="border border-zinc-950 flex flex-1">
        {Array.from({ length: maxFrets }, (_: undefined, i: number) => {
          const fret: number = i + 1;
          const note: Note = chromaticRing.at(openNoteIdx + fret);
          return <Fret key={i} note={note} highlight={highlighter(note)} />;
        })}
      </div>
    </div>
  );
}

type FretMarkerProps = {
  readonly fret: number;
};

function FretMarker({ fret }: FretMarkerProps): JSX.Element {
  const positionInOctave: number = fret % 12;
  const hasSingleDot: boolean = [3, 5, 7, 9].includes(positionInOctave);
  const hasDoubleDot: boolean = positionInOctave === 0;

  return (
    <div className="flex-1 min-w-10 h-full flex flex-col items-center justify-center">
      {hasDoubleDot ? (
        <div className="h-1/2 flex flex-col justify-evenly items-center">
          <div className="bg-amber-100 w-5 h-5 rounded-full" />
          <div className="bg-amber-100 w-5 h-5 rounded-full" />
        </div>
      ) : hasSingleDot ? (
        <div className="bg-amber-100 w-5 h-5 rounded-full" />
      ) : null}
    </div>
  );
}

type FretMarkersProps = {
  readonly maxFrets: number;
};

function FretMarkers({ maxFrets }: FretMarkersProps): JSX.Element {
  return (
    <div className="absolute z-1 inset-0 flex gap-4 pointer-events-none">
      <div className="shrink-0 w-7.5" />
      <div className="flex flex-1 h-full">
        {Array.from({ length: maxFrets }, (_: undefined, i: number) => (
          <FretMarker key={i} fret={i + 1} />
        ))}
      </div>
    </div>
  );
}

type FretboardProps = {
  readonly openStrings: readonly Note[];
  readonly maxFrets?: number;
  readonly className?: string;
  readonly grayedOut?: Set<Note>;
  readonly primary?: Note;
  readonly secondary?: Set<Note>;
};

export function Fretboard({
  openStrings,
  maxFrets = 15,
  className = "",
  grayedOut = new Set(),
  primary,
  secondary = new Set(),
}: FretboardProps): JSX.Element {
  const highlighter: (note: Note) => NoteHighlight = (note: Note): NoteHighlight => {
    if (primary !== undefined && note === primary) return "primary";
    if (secondary.has(note)) return "secondary";
    if (grayedOut.has(note)) return "grayed-out";
    return "regular";
  };

  return (
    <div className={`overflow-auto select-none relative ${className}`}>
      <FretMarkers maxFrets={maxFrets} />
      {openStrings.map((openNote: Note, idx: number) => (
        <GuitarString
          key={`${openNote}${idx}`}
          openNote={openNote}
          maxFrets={maxFrets}
          highlighter={highlighter}
        />
      ))}
    </div>
  );
}
