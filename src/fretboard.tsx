import type { JSX } from "react";
import { type Note, chromaticRing } from "./music.ts";
import { noteColor, rootRing } from "./note-colors.tsx";

export type NoteHighlight = "root" | "grayed-out" | "regular" | "label" | "hidden" | "muted";

/** Decides how to draw the note at a given string and fret (fret 0 is the open string). */
export type Highlighter = (note: Note, stringIdx: number, fret: number) => NoteHighlight;

/** Highlights by note only: the root gets a ring, notes in `grayedOut` fade. */
export function noteHighlighter(root: Note | undefined, grayedOut: Set<Note>): Highlighter {
  return (note: Note): NoteHighlight => {
    if (root !== undefined && note === root) return "root";
    if (grayedOut.has(note)) return "grayed-out";
    return "regular";
  };
}

const circleSize: string = "h-7.5 w-7.5";

type NoteCircleProps = {
  readonly note: Note;
  readonly highlight: NoteHighlight;
};

function NoteCircle({ note, highlight }: NoteCircleProps): JSX.Element {
  switch (highlight) {
    case "hidden":
      return <div className={circleSize} />;
    case "label":
    case "muted":
      return (
        <div
          className={`${circleSize} flex items-center justify-center text-sm text-base-content/50`}
        >
          {highlight === "muted" ? "×" : note}
        </div>
      );
    case "regular":
    case "root":
    case "grayed-out": {
      const colors: string =
        highlight === "grayed-out"
          ? "bg-neutral opacity-10 text-neutral-content"
          : highlight === "root"
            ? `${noteColor(note)} ${rootRing}`
            : noteColor(note);
      return (
        <div
          className={`z-2 rounded-full ${colors} flex items-center justify-center ${circleSize} text-sm`}
        >
          {note}
        </div>
      );
    }
    default:
      throw new Error(`Unknown highlight: ${String(highlight satisfies never)}`);
  }
}

type FretProps = {
  readonly note: Note;
  readonly highlight: NoteHighlight;
};

function Fret({ note, highlight }: FretProps): JSX.Element {
  return (
    <div className="bg-wood border-r-4 border-fret flex-1 min-w-10 p-2 flex items-center justify-end">
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
    <div className="shrink-0 pl-1">
      <NoteCircle note={openNote} highlight={highlight} />
    </div>
  );
}

type GuitarStringProps = {
  readonly openNote: Note;
  readonly stringIdx: number;
  readonly frets: readonly number[];
  readonly highlighter: Highlighter;
};

function GuitarString({ openNote, stringIdx, frets, highlighter }: GuitarStringProps): JSX.Element {
  const openNoteIdx: number = chromaticRing.indexOf(openNote);
  return (
    <div className="flex gap-4 items-center w-full">
      <OpenString openNote={openNote} highlight={highlighter(openNote, stringIdx, 0)} />
      <div className="border border-neutral flex flex-1">
        {frets.map((fret: number) => {
          const note: Note = chromaticRing.at(openNoteIdx + fret);
          return <Fret key={fret} note={note} highlight={highlighter(note, stringIdx, fret)} />;
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
          <div className="bg-inlay w-5 h-5 rounded-full" />
          <div className="bg-inlay w-5 h-5 rounded-full" />
        </div>
      ) : hasSingleDot ? (
        <div className="bg-inlay w-5 h-5 rounded-full" />
      ) : null}
    </div>
  );
}

type FretMarkersProps = {
  readonly frets: readonly number[];
};

function FretMarkers({ frets }: FretMarkersProps): JSX.Element {
  return (
    <div className="absolute z-1 inset-0 flex gap-4 pointer-events-none">
      <div className="shrink-0 w-8.5" />
      <div className="flex flex-1 h-full">
        {frets.map((fret: number) => (
          <FretMarker key={fret} fret={fret} />
        ))}
      </div>
    </div>
  );
}

type FretNumbersProps = {
  readonly frets: readonly number[];
};

function FretNumbers({ frets }: FretNumbersProps): JSX.Element {
  return (
    <div className="flex gap-4 text-xs text-base-content/60 mb-1">
      <div className="shrink-0 w-8.5 text-center">open</div>
      <div className="flex flex-1">
        {frets.map((fret: number) => (
          <div key={fret} className="flex-1 min-w-10 text-center">
            {fret}
          </div>
        ))}
      </div>
    </div>
  );
}

type FretboardProps = {
  readonly openStrings: readonly Note[];
  readonly highlighter: Highlighter;
  /** First and last fret drawn after the open strings. */
  readonly fromFret?: number;
  readonly toFret?: number;
  readonly showFretNumbers?: boolean;
  readonly className?: string;
};

export function Fretboard({
  openStrings,
  highlighter,
  fromFret = 1,
  toFret = 15,
  showFretNumbers = false,
  className = "",
}: FretboardProps): JSX.Element {
  const frets: number[] = Array.from(
    { length: toFret - fromFret + 1 },
    (_: undefined, i: number) => fromFret + i,
  );

  return (
    <div className={`overflow-auto select-none ${className}`}>
      {showFretNumbers && <FretNumbers frets={frets} />}
      <div className="relative">
        <FretMarkers frets={frets} />
        {openStrings.map((openNote: Note, idx: number) => (
          <GuitarString
            key={`${openNote}${idx}`}
            openNote={openNote}
            stringIdx={idx}
            frets={frets}
            highlighter={highlighter}
          />
        ))}
      </div>
    </div>
  );
}
