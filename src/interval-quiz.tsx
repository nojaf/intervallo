import { type JSX, type ReactNode, useEffect, useMemo, useState } from "react";
import { ButtonToggle } from "./button-toggle.tsx";
import { type Note, type Scale, chromaticRing, semitonesBetween } from "./music.ts";
import { ScaleCircle } from "./scale-circle.tsx";

const NOTE_FREQUENCIES: Record<Note, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playNote(note: Note, octave: number): Promise<void> {
  const ctx: AudioContext = getAudioContext();
  const frequency: number = NOTE_FREQUENCIES[note]! * Math.pow(2, octave - 4);
  const now: number = ctx.currentTime;

  const oscillator: OscillatorNode = ctx.createOscillator();
  const gain: GainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.6, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 1.2);

  return new Promise<void>((resolve: () => void) => {
    oscillator.onended = (): void => resolve();
  });
}

type Direction = "up" | "down" | "both";

const INTERVAL_NAMES: Record<number, string> = {
  1: "Minor 2nd",
  2: "Major 2nd",
  3: "Minor 3rd",
  4: "Major 3rd",
  5: "Perfect 4th",
  6: "Tritone",
  7: "Perfect 5th",
  8: "Minor 6th",
  9: "Major 6th",
  10: "Minor 7th",
  11: "Major 7th",
  12: "Octave",
};

const DIRECTION_LABELS: Record<Direction, string> = {
  up: "Ascending",
  both: "Both",
  down: "Descending",
};

const DIRECTION_ICON_PATHS: Record<Direction, string> = {
  up: "M208.49 120.49a12 12 0 0 1-17 0L140 69v147a12 12 0 0 1-24 0V69l-51.51 51.49a12 12 0 0 1-17-17l72-72a12 12 0 0 1 17 0l72 72a12 12 0 0 1 0 17",
  down: "m208.49 152.49l-72 72a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L116 187V40a12 12 0 0 1 24 0v147l51.51-51.52a12 12 0 0 1 17 17Z",
  both: "M120.49 167.51a12 12 0 0 1 0 17l-32 32a12 12 0 0 1-17 0l-32-32a12 12 0 1 1 17-17L68 179V48a12 12 0 0 1 24 0v131l11.51-11.52a12 12 0 0 1 16.98.03m96-96l-32-32a12 12 0 0 0-17 0l-32 32a12 12 0 0 0 17 17L164 77v131a12 12 0 0 0 24 0V77l11.51 11.52a12 12 0 0 0 17-17Z",
};

function renderDirection(d: Direction): ReactNode {
  return (
    <span className="flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
        <path fill="currentColor" d={DIRECTION_ICON_PATHS[d]} />
      </svg>
      {DIRECTION_LABELS[d]}
    </span>
  );
}

function intervalLabel(semitones: number): string {
  return `${INTERVAL_NAMES[semitones] ?? "?"} (${semitones})`;
}

type Question = {
  readonly noteA: Note;
  readonly noteB: Note;
  readonly octaveA: number;
  readonly octaveB: number;
  readonly semitones: number;
};

type Phase =
  | { readonly kind: "idle" }
  | { readonly kind: "playing"; readonly question: Question }
  | { readonly kind: "answering"; readonly question: Question }
  | {
      readonly kind: "result";
      readonly question: Question;
      readonly chosen: number;
      readonly correct: boolean;
    };

function computeScaleIntervals(scale: Scale): readonly number[] {
  const notes: readonly Note[] = scale.notes.items;
  const root: Note = notes[0]!;
  const distances: Set<number> = new Set<number>();
  distances.add(12);
  for (let i = 1; i < notes.length; i++) {
    distances.add(semitonesBetween(root, notes[i]!));
  }
  return Array.from(distances).sort((a: number, b: number) => a - b);
}

function computeIntervalNoteMap(scale: Scale): Map<number, Note> {
  const notes: readonly Note[] = scale.notes.items;
  const root: Note = notes[0]!;
  const map: Map<number, Note> = new Map<number, Note>();
  map.set(12, root);
  for (let i = 1; i < notes.length; i++) {
    map.set(semitonesBetween(root, notes[i]!), notes[i]!);
  }
  return map;
}

function buildQuestion(scale: Scale, direction: Direction): Question {
  const notes: readonly Note[] = scale.notes.items;
  const root: Note = notes[0]!;
  const idx: number = Math.floor(Math.random() * notes.length);
  const other: Note = notes[idx]!;
  const octave = 3 + Math.floor(Math.random() * 3);
  const effectiveDir: "up" | "down" =
    direction === "both" ? (Math.random() < 0.5 ? "up" : "down") : direction;

  if (other === root) {
    if (effectiveDir === "up") {
      return { noteA: root, noteB: root, octaveA: octave, octaveB: octave + 1, semitones: 12 };
    }
    return { noteA: root, noteB: root, octaveA: octave + 1, octaveB: octave, semitones: 12 };
  }

  const posRoot: number = chromaticRing.indexOf(root);
  const posOther: number = chromaticRing.indexOf(other);
  const wraps = posOther < posRoot;
  const interval: number = semitonesBetween(root, other);
  const otherOctave: number = wraps ? octave + 1 : octave;

  if (effectiveDir === "up") {
    return {
      noteA: root,
      noteB: other,
      octaveA: octave,
      octaveB: otherOctave,
      semitones: interval,
    };
  }
  return { noteA: other, noteB: root, octaveA: otherOctave, octaveB: octave, semitones: interval };
}

type Score = { readonly correct: number; readonly total: number };

type IntervalQuizProps = {
  readonly scale: Scale;
};

export function IntervalQuiz({ scale }: IntervalQuizProps): JSX.Element {
  const [direction, setDirection] = useState<Direction>("up");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [score, setScore] = useState<Score>({ correct: 0, total: 0 });
  const [sessionRef] = useState<{ current: number }>(() => ({ current: 0 }));

  const scaleIntervals: readonly number[] = useMemo(() => computeScaleIntervals(scale), [scale]);
  const intervalNoteMap: Map<number, Note> = useMemo(() => computeIntervalNoteMap(scale), [scale]);

  useEffect(() => {
    sessionRef.current++;
    setPhase({ kind: "idle" });
    setScore({ correct: 0, total: 0 });
  }, [scale, sessionRef]);

  function doPlay(question: Question): void {
    const session: number = ++sessionRef.current;
    setPhase({ kind: "playing", question });

    void (async (): Promise<void> => {
      for (let i = 0; i < 2; i++) {
        await playNote(question.noteA, question.octaveA);
        if (sessionRef.current !== session) return;
        await playNote(question.noteB, question.octaveB);
        if (sessionRef.current !== session) return;
      }
      setPhase({ kind: "answering", question });
      return;
    })();

    return;
  }

  function doStart(s: Scale, d: Direction): void {
    doPlay(buildQuestion(s, d));
    return;
  }

  function handleDirectionChange(d: Direction): void {
    setDirection(d);
    if (phase.kind !== "idle") {
      doStart(scale, d);
      return;
    }
    return;
  }

  function handleAnswer(chosen: number): void {
    if (phase.kind !== "answering" && phase.kind !== "playing") return;
    const { question } = phase;
    const correct = chosen === question.semitones;
    const sessionAtAnswer: number = ++sessionRef.current;
    setPhase({ kind: "result", question, chosen, correct });
    setScore((prev: Score) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    if (!correct) {
      void (async (): Promise<void> => {
        await playNote(question.noteA, question.octaveA);
        if (sessionRef.current !== sessionAtAnswer) return;
        await playNote(question.noteB, question.octaveB);
        return;
      })();
    }
    setTimeout(() => {
      if (sessionRef.current !== sessionAtAnswer) return;
      doStart(scale, direction);
    }, 2000);
    return;
  }

  function renderPhaseStatus(): ReactNode {
    switch (phase.kind) {
      case "idle":
        return (
          <button className="btn btn-neutral" onClick={() => doStart(scale, direction)}>
            Start
          </button>
        );
      case "playing":
        return <p className="text-lg animate-pulse">Playing...</p>;
      case "answering":
        return (
          <div className="flex items-center gap-3">
            <p className="text-lg">What interval did you hear?</p>
            <button className="btn btn-outline btn-sm" onClick={() => doPlay(phase.question)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 256 256"
              >
                <path
                  fill="currentColor"
                  d="M228 128a100 100 0 0 1-98.66 100H128a99.4 99.4 0 0 1-68.62-27.29a12 12 0 0 1 16.48-17.45a76 76 0 1 0-1.57-109c-.13.13-.25.25-.39.37L54.89 92H72a12 12 0 0 1 0 24H24a12 12 0 0 1-12-12V56a12 12 0 0 1 24 0v20.72l21.48-19.66A100 100 0 0 1 228 128"
                />
              </svg>
              Replay
            </button>
          </div>
        );
      case "result":
        return (
          <p className={`text-lg font-bold ${phase.correct ? "text-success" : "text-error"}`}>
            {phase.correct
              ? `Correct! ${intervalLabel(phase.question.semitones)}`
              : `Not quite — it was ${intervalLabel(phase.question.semitones)}`}
          </p>
        );
      default:
        throw new Error(String(phase satisfies never as never));
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-3xl font-bold">Interval Ear Training</h2>
        {score.total > 0 && (
          <span className="text-lg font-mono">
            {score.correct} / {score.total}
          </span>
        )}
      </div>

      <ButtonToggle<Direction>
        items={["up", "both", "down"]}
        onClick={handleDirectionChange}
        activeItem={direction}
        keyOf={(d: Direction) => d}
        renderItem={renderDirection}
      />

      <div className="mb-6 min-h-12 flex items-center">{renderPhaseStatus()}</div>

      {phase.kind !== "idle" && (
        <div className="flex justify-center my-4">
          <div className="w-[190px] h-[190px]">
            {phase.kind === "result" && (
              <ScaleCircle
                scale={scale}
                radius={150}
                activeNote={scale.rootNote}
                secondaryNote={
                  phase.question.noteA === scale.rootNote
                    ? phase.question.noteB
                    : phase.question.noteA
                }
              />
            )}
          </div>
        </div>
      )}

      {phase.kind !== "idle" && (
        <ButtonToggle<number>
          items={scaleIntervals}
          onClick={handleAnswer}
          activeItem={0}
          renderItem={(s: number) =>
            `${intervalNoteMap.get(s) ?? "?"} — ${INTERVAL_NAMES[s] ?? "?"}`
          }
          keyOf={(s: number) => String(s)}
          disabled={phase.kind === "result"}
          classNameOf={(semitones: number): string => {
            if (phase.kind === "result") {
              if (semitones === phase.question.semitones) return "btn-outline btn-success";
              if (semitones === phase.chosen) return "btn-error";
            }
            return "btn-outline";
          }}
        />
      )}
    </section>
  );
}
