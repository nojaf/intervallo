import { Ring } from "./ring.ts";

export type Step = "half" | "whole";

export const majorScalePattern: readonly Step[] = [
  "whole",
  "whole",
  "half",
  "whole",
  "whole",
  "whole",
  "half",
];

export const minorScalePattern: readonly Step[] = [
  "whole",
  "half",
  "whole",
  "whole",
  "half",
  "whole",
  "whole",
];

export function urlEncodeScalePattern(pattern: readonly Step[]): string {
  if (pattern === majorScalePattern) return "major";
  if (pattern === minorScalePattern) return "minor";
  return "custom";
}

export function urlDecodeScalePattern(pattern: string): readonly Step[] {
  return pattern === "minor" ? minorScalePattern : majorScalePattern;
}

export type Note = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";

const noteUrlMap: Record<Note, string> = {
  C: "c",
  "C#": "csharp",
  D: "d",
  "D#": "dsharp",
  E: "e",
  F: "f",
  "F#": "fsharp",
  G: "g",
  "G#": "gsharp",
  A: "a",
  "A#": "asharp",
  B: "b",
};

const urlNoteMap: Record<string, Note> = Object.fromEntries(
  Object.entries(noteUrlMap).map(([k, v]) => [v, k as Note]),
) as Record<string, Note>;

export function urlEncodeNote(note: Note): string {
  return noteUrlMap[note];
}

export function urlDecodeNote(encoded: string): Note {
  return urlNoteMap[encoded] ?? "C";
}

export type ChordQuality = "major" | "minor" | "diminished";

export type Chord = {
  readonly root: Note;
  readonly third: Note;
  readonly fifth: Note;
  readonly quality: ChordQuality;
};

export function chordName(chord: Chord): string {
  switch (chord.quality) {
    case "major":
      return `${chord.root} Major`;
    case "minor":
      return `${chord.root} minor`;
    case "diminished":
      return `${chord.root} diminished`;
    default:
      throw new Error(`Unknown chord quality: ${String(chord.quality satisfies never)}`);
  }
}

export const chromaticRing: Ring<Note> = new Ring([
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]);

export const allNotes: Set<Note> = new Set(chromaticRing.items);

/** Absolute semitones (distance) between two notes. */
export function semitonesBetween(from: Note, to: Note): number {
  return chromaticRing.distanceBetween(from, to);
}

export type Scale = {
  readonly rootNote: Note;
  readonly intervals: readonly Step[];
  readonly notes: Ring<Note>;
};

export function makeScale(intervals: readonly Step[], rootNote: Note): Scale {
  const rootIdx: number = chromaticRing.indexOf(rootNote);

  let currentIdx: number = rootIdx;
  const notes: Note[] = [];
  for (const interval of intervals) {
    notes.push(chromaticRing.at(currentIdx));
    currentIdx += interval === "whole" ? 2 : 1;
  }

  return { rootNote, intervals, notes: new Ring(notes) };
}

export function chordAtIndex(scale: Scale, degree: number): Chord {
  const root: Note = scale.notes.at(degree);
  const third: Note = scale.notes.at(degree + 2);
  const fifth: Note = scale.notes.at(degree + 4);

  const rootToThird: number = semitonesBetween(root, third);
  const thirdToFifth: number = semitonesBetween(third, fifth);

  const quality: ChordQuality =
    rootToThird === 4 ? "major" : rootToThird === 3 && thirdToFifth === 3 ? "diminished" : "minor";

  return { root, third, fifth, quality };
}

export function chordForNote(scale: Scale, note: Note): Chord {
  if (!scale.notes.contains(note)) {
    throw new Error("Note not in scale");
  }
  const degree: number = scale.notes.indexOf(note);
  return chordAtIndex(scale, degree);
}
