import { type Chord, type Note, chromaticRing } from "./music.ts";

/** A single note played on one string at a specific fret (0 = open string). */
export type StringFret = {
  readonly stringIdx: number;
  readonly fret: number;
  readonly note: Note;
};

/** A playable chord shape: one StringFret per sounding string. */
export type Voicing = {
  readonly stringFrets: readonly StringFret[];
};

/** A chord paired with the best voicing found for a given neck position. */
export type ChordVoicing = {
  readonly chord: Chord;
  readonly voicing: Voicing;
};

/**
 * A fret window where every selected chord has at least one valid voicing.
 * windowStart–windowEnd is the inclusive fret range of the window.
 */
export type PositionSolution = {
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly chordVoicings: readonly ChordVoicing[];
};

/** Parameters controlling how positions are searched. */
export type PositionFinderConfig = {
  /** Open-string notes from highest string (index 0) to lowest. */
  readonly openStrings: readonly Note[];
  /** Number of frets in the sliding window. */
  readonly windowSize: number;
  /** Total frets on the neck to consider. */
  readonly maxFrets: number;
  /** Minimum number of contiguous strings a voicing must use. */
  readonly minStrings: number;
};

/** Standard guitar tuning, high-E first. */
export const STANDARD_TUNING: readonly Note[] = ["E", "B", "G", "D", "A", "E"];

export const defaultPositionFinderConfig: PositionFinderConfig = {
  openStrings: STANDARD_TUNING,
  windowSize: 5,
  maxFrets: 15,
  minStrings: 4,
};

function scoreVoicing(voicing: Voicing, stringCount: number): number {
  const frettedFrets: number[] = voicing.stringFrets
    .filter((sf: StringFret) => sf.fret > 0)
    .map((sf: StringFret) => sf.fret);
  const span: number =
    frettedFrets.length > 1 ? Math.max(...frettedFrets) - Math.min(...frettedFrets) : 0;
  return stringCount * 10 - span;
}

function generateVoicings(
  optionsPerString: ReadonlyArray<ReadonlyArray<{ readonly fret: number; readonly note: Note }>>,
  startStringIdx: number,
  chord: Chord,
): Voicing[] {
  const chordNotes: Note[] = [chord.root, chord.third, chord.fifth];
  const results: Voicing[] = [];
  const current: Array<{ fret: number; note: Note }> = [];

  function recurse(strIdx: number): void {
    if (strIdx === optionsPerString.length) {
      const usedNotes: Set<Note> = new Set(
        current.map((x: { fret: number; note: Note }) => x.note),
      );
      if (chordNotes.every((n: Note) => usedNotes.has(n))) {
        results.push({
          stringFrets: current.map(
            (opt: { fret: number; note: Note }, i: number): StringFret => ({
              stringIdx: startStringIdx + i,
              fret: opt.fret,
              note: opt.note,
            }),
          ),
        });
      }
      return;
    }
    for (const opt of optionsPerString[strIdx]!) {
      current.push(opt);
      recurse(strIdx + 1);
      current.pop();
    }
    return;
  }

  recurse(0);
  return results;
}

function findBestVoicing(
  chord: Chord,
  openStrings: readonly Note[],
  windowStart: number,
  windowEnd: number,
  minStrings: number,
  scaleNotes: ReadonlySet<Note>,
): Voicing | null {
  const chordNoteSet: Set<Note> = new Set<Note>([chord.root, chord.third, chord.fifth]);
  const numStrings: number = openStrings.length;
  let bestRootInBassScore: number = -Infinity;
  let bestRootInBassVoicing: Voicing | null = null;
  let bestAnyScore: number = -Infinity;
  let bestAnyVoicing: Voicing | null = null;

  for (let startStr: number = 0; startStr <= numStrings - minStrings; startStr++) {
    for (let endStr: number = startStr + minStrings - 1; endStr < numStrings; endStr++) {
      const optionsPerString: Array<ReadonlyArray<{ readonly fret: number; readonly note: Note }>> =
        [];
      let impossible: boolean = false;

      for (let s: number = startStr; s <= endStr; s++) {
        const openNote: Note = openStrings[s]!;
        const openNoteIdx: number = chromaticRing.indexOf(openNote);
        const options: Array<{ fret: number; note: Note }> = [];

        if (chordNoteSet.has(openNote) && scaleNotes.has(openNote)) {
          options.push({ fret: 0, note: openNote });
        }

        for (let fret: number = Math.max(1, windowStart); fret <= windowEnd; fret++) {
          const note: Note = chromaticRing.at(openNoteIdx + fret);
          if (chordNoteSet.has(note)) {
            options.push({ fret, note });
          }
        }

        if (options.length === 0) {
          impossible = true;
          break;
        }
        optionsPerString.push(options);
      }

      if (impossible) continue;

      for (const voicing of generateVoicings(optionsPerString, startStr, chord)) {
        const sfs: readonly StringFret[] = voicing.stringFrets;
        if (sfs.some((sf: StringFret, i: number) => i > 0 && sf.note === sfs[i - 1]!.note)) {
          continue;
        }
        const score: number = scoreVoicing(voicing, endStr - startStr + 1);
        const lowestSf: StringFret = voicing.stringFrets.reduce((a: StringFret, b: StringFret) =>
          a.stringIdx > b.stringIdx ? a : b,
        );
        if (lowestSf.note === chord.root && score > bestRootInBassScore) {
          bestRootInBassScore = score;
          bestRootInBassVoicing = voicing;
        }
        if (score > bestAnyScore) {
          bestAnyScore = score;
          bestAnyVoicing = voicing;
        }
      }
    }
  }

  return bestRootInBassVoicing ?? bestAnyVoicing;
}

/**
 * Slides a fret window across the neck and returns every position where all
 * selected chords have at least one playable voicing within that window.
 * Open strings (fret 0) are always eligible if the note belongs to the scale.
 */
export function findPositionSolutions(
  chords: readonly Chord[],
  scaleNotes: ReadonlySet<Note>,
  config: PositionFinderConfig,
): PositionSolution[] {
  const { openStrings, windowSize, maxFrets, minStrings } = config;
  const solutions: PositionSolution[] = [];
  const seenFingerprints: Set<string> = new Set();

  for (let windowStart: number = 0; windowStart + windowSize - 1 <= maxFrets; windowStart++) {
    const windowEnd: number = windowStart + windowSize - 1;
    const chordVoicings: ChordVoicing[] = [];
    let valid: boolean = true;

    for (const chord of chords) {
      const voicing: Voicing | null = findBestVoicing(
        chord,
        openStrings,
        windowStart,
        windowEnd,
        minStrings,
        scaleNotes,
      );
      if (voicing === null) {
        valid = false;
        break;
      }
      chordVoicings.push({ chord, voicing });
    }

    if (valid) {
      const fingerprint: string = chordVoicings
        .map(
          ({ chord, voicing }: ChordVoicing) =>
            `${chord.root}${chord.quality}:${voicing.stringFrets.map((sf: StringFret) => `${sf.stringIdx}@${sf.fret}`).join(",")}`,
        )
        .join("|");
      if (!seenFingerprints.has(fingerprint)) {
        seenFingerprints.add(fingerprint);
        solutions.push({ windowStart, windowEnd, chordVoicings });
      }
    }
  }

  return solutions;
}
