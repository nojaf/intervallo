import { type JSX, useEffect, useState } from "react";
import { ButtonToggle } from "./button-toggle.tsx";
import { ChordsInScale } from "./chords-in-scale.tsx";
import { Fretboard } from "./fretboard.tsx";
import {
  type Chord,
  type Note,
  type Scale,
  type Step,
  allNotes,
  chordForNote,
  chordName,
  chromaticRing,
  majorScalePattern,
  makeScale,
  minorScalePattern,
  urlEncodeNote,
  urlEncodeScalePattern,
} from "./music.ts";
import { PositionFinder } from "./position-finder.tsx";
import { ScaleCircle } from "./scale-circle.tsx";

type ChordDetailProps = {
  readonly scale: Scale;
  readonly activeNote: Note;
};

function ChordDetail({ scale, activeNote }: ChordDetailProps): JSX.Element {
  const chord: Chord = chordForNote(scale, activeNote);
  const grayedOut: Set<Note> = allNotes.difference(new Set([chord.root, chord.third, chord.fifth]));
  return (
    <>
      <h2 className="text-3xl font-bold">{chordName(chord)}</h2>
      <Fretboard
        openStrings={["E", "B", "G", "D", "A", "E"]}
        className="my-6 mx-auto"
        primary={activeNote}
        secondary={new Set([chord.third, chord.fifth])}
        grayedOut={grayedOut}
      />
    </>
  );
}

type AppProps = {
  readonly root: Note;
  readonly scale: readonly Step[];
  readonly note?: Note | undefined;
};

export function App({ root, scale, note }: AppProps): JSX.Element {
  const [rootNote, setRootNote] = useState<Note>(root);
  const [scalePattern, setScalePattern] = useState<readonly Step[]>(scale);
  const currentScale: Scale = makeScale(scalePattern, rootNote);
  const unusedNotes: Set<Note> = chromaticRing.subtract(currentScale.notes);
  const [activeNote, setActiveNote] = useState<Note | undefined>(note);

  useEffect(() => {
    const params: URLSearchParams = new URLSearchParams(location.search);

    params.set("root", urlEncodeNote(rootNote));
    params.set("scale", urlEncodeScalePattern(scalePattern));
    if (activeNote === undefined) {
      params.delete("note");
    } else {
      params.set("note", urlEncodeNote(activeNote));
    }

    const newUrl: string = `${location.origin}${location.pathname}?${params.toString()}`;
    history.replaceState({}, "", newUrl);
  }, [rootNote, scalePattern, activeNote]);

  return (
    <div className="max-w-7/12 mx-auto h-full p-8">
      <h1 className="font-title text-2xl md:text-3xl lg:text-4xl font-bold">Intervallo</h1>
      <ButtonToggle
        items={chromaticRing.items}
        onClick={(clickedNote: Note) => {
          setRootNote(clickedNote);
          setActiveNote(undefined);
        }}
        activeItem={rootNote}
        renderItem={(item: Note) => item}
        keyOf={(item: Note) => item}
      />
      <ButtonToggle<string>
        items={["Major", "Minor"]}
        onClick={(pattern: string) => {
          setScalePattern(pattern === "Major" ? majorScalePattern : minorScalePattern);
          setActiveNote(undefined);
        }}
        activeItem={scalePattern === majorScalePattern ? "Major" : "Minor"}
        renderItem={(item: string) => item}
        keyOf={(item: string) => item}
      />

      <h2 className="text-3xl font-bold">Scale</h2>
      <Fretboard
        openStrings={["E", "B", "G", "D", "A", "E"]}
        className="my-6 mx-auto"
        primary={currentScale.rootNote}
        grayedOut={unusedNotes}
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-6 items-center">
          <ScaleCircle
            scale={currentScale}
            radius={300}
            activeNote={activeNote}
            onNoteClick={(clickedNote: Note) => setActiveNote(clickedNote)}
          />
          <ChordsInScale scale={currentScale} />
        </div>
        {activeNote !== undefined && (
          <button onClick={() => setActiveNote(undefined)} className="btn btn-outline">
            Reset
          </button>
        )}
      </div>
      {activeNote !== undefined && <ChordDetail scale={currentScale} activeNote={activeNote} />}
      <PositionFinder
        key={`${currentScale.rootNote}-${urlEncodeScalePattern(scalePattern)}`}
        scale={currentScale}
      />
    </div>
  );
}
