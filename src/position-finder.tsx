import { useMemo, useState, type ChangeEvent, type JSX, type ReactNode } from "react";
import {
  type Chord,
  type Note,
  type Scale,
  chordForNote,
  chordName,
  chordShortName,
  chromaticRing,
} from "./music.ts";
import {
  type ChordVoicing,
  type PositionSolution,
  STANDARD_TUNING,
  type StringFret,
  type Voicing,
  defaultPositionFinderConfig,
  findPositionSolutions,
} from "./voicings.ts";

type MultiButtonToggleProps<T> = {
  readonly items: readonly T[];
  readonly isSelected: (item: T) => boolean;
  readonly onToggle: (item: T) => void;
  readonly renderItem: (item: T) => ReactNode;
  readonly keyOf: (item: T) => string;
};

function MultiButtonToggle<T>({
  items,
  isSelected,
  onToggle,
  renderItem,
  keyOf,
}: MultiButtonToggleProps<T>): JSX.Element {
  return (
    <div className="flex flex-row flex-wrap justify-center py-4 gap-2">
      {items.map((item: T) => (
        <button
          key={keyOf(item)}
          onClick={() => onToggle(item)}
          className={`btn ${isSelected(item) ? "btn-neutral" : "btn-outline"}`}
        >
          {renderItem(item)}
        </button>
      ))}
    </div>
  );
}

function noteRoleColor(role: "root" | "third" | "fifth"): string {
  if (role === "root") return "bg-yellow-400 text-black";
  if (role === "third") return "bg-orange-500 text-white";
  return "bg-zinc-600 text-white";
}

function getNoteRole(note: Note, chord: Chord): "root" | "third" | "fifth" {
  if (note === chord.root) return "root";
  if (note === chord.third) return "third";
  return "fifth";
}

type VoicingDiagramProps = {
  readonly voicing: Voicing;
  readonly chord: Chord;
  readonly openStrings: readonly Note[];
  readonly windowStart: number;
  readonly windowEnd: number;
};

function VoicingDiagram({
  voicing,
  chord,
  openStrings,
  windowStart,
  windowEnd,
}: VoicingDiagramProps): JSX.Element {
  const sfByString: Map<number, StringFret> = new Map(
    voicing.stringFrets.map((sf: StringFret) => [sf.stringIdx, sf]),
  );
  const voicingStringSet: Set<number> = new Set(
    voicing.stringFrets.map((sf: StringFret) => sf.stringIdx),
  );
  const hasOpenStrings: boolean = voicing.stringFrets.some((sf: StringFret) => sf.fret === 0);
  const windowFrets: number[] = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_: undefined, i: number) => windowStart + i,
  );
  const showOpenCol: boolean = hasOpenStrings && windowStart > 0;

  return (
    <div className="overflow-auto border border-zinc-200 rounded p-3 bg-zinc-50">
      {/* Header row */}
      <div className="flex items-center text-xs text-zinc-400 mb-1">
        <div className="w-6 shrink-0" />
        {showOpenCol && (
          <>
            <div className="w-10 shrink-0 text-center">open</div>
            <div className="w-4 shrink-0 text-center text-zinc-700">···</div>
          </>
        )}
        {windowFrets.map((f: number) => (
          <div key={f} className="w-10 shrink-0 text-center">
            {f === 0 ? "open" : f}
          </div>
        ))}
      </div>

      {/* String rows */}
      {openStrings.map((openNote: Note, stringIdx: number) => {
        const sf: StringFret | undefined = sfByString.get(stringIdx);
        const inVoicing: boolean = voicingStringSet.has(stringIdx);

        return (
          <div key={stringIdx} className="flex items-center my-0.5">
            <div className="w-6 shrink-0 text-right text-xs text-zinc-400 pr-1">{openNote}</div>

            {showOpenCol && (
              <>
                <div className="w-10 shrink-0 h-8 flex items-center justify-center">
                  {sf?.fret === 0 ? (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${noteRoleColor(getNoteRole(sf.note, chord))}`}
                    >
                      {sf.note}
                    </div>
                  ) : null}
                </div>
                <div className="w-4 shrink-0" />
              </>
            )}

            {windowFrets.map((fret: number) => {
              const isPlayed: boolean = sf?.fret === fret;
              return (
                <div
                  key={fret}
                  className={`w-10 shrink-0 h-8 flex items-center justify-center ${inVoicing ? "border-b-2 border-zinc-300" : ""}`}
                >
                  {isPlayed ? (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${noteRoleColor(getNoteRole(sf!.note, chord))}`}
                    >
                      {sf!.note}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
          root
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
          third
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-zinc-600" />
          fifth
        </span>
      </div>
    </div>
  );
}

type ChordBarsProps = {
  readonly chordVoicings: readonly ChordVoicing[];
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly activeChordVoicing: ChordVoicing | null;
  readonly onHoverChordVoicing: (cv: ChordVoicing | null) => void;
};

function ChordBars({
  chordVoicings,
  windowStart,
  windowEnd,
  activeChordVoicing,
  onHoverChordVoicing,
}: ChordBarsProps): JSX.Element {
  const windowSize: number = windowEnd - windowStart + 1;

  const fretCenterPct: (fret: number) => number = (fret: number): number =>
    ((fret - windowStart + 0.5) / windowSize) * 100;

  return (
    <div>
      {/* Fret number ruler */}
      <div className="flex items-center mb-4">
        <div className="w-28 shrink-0" />
        <div className="flex-1 flex">
          {Array.from({ length: windowSize }, (_: undefined, i: number) => (
            <div key={i} className="flex-1 text-center text-xs text-zinc-600">
              {windowStart + i === 0 ? "nut" : windowStart + i}
            </div>
          ))}
        </div>
      </div>

      {chordVoicings.map((cv: ChordVoicing) => {
        const { chord, voicing } = cv;
        const isActive: boolean =
          activeChordVoicing?.chord.root === chord.root &&
          activeChordVoicing.chord.quality === chord.quality;

        const uniqueFrets: number[] = [
          ...new Set(
            voicing.stringFrets
              .filter((sf: StringFret) => sf.fret > 0)
              .map((sf: StringFret) => sf.fret),
          ),
        ].sort((a: number, b: number) => a - b);

        const hasOpen: boolean = voicing.stringFrets.some((sf: StringFret) => sf.fret === 0);
        const minFret: number | undefined = uniqueFrets[0];
        const maxFret: number | undefined = uniqueFrets[uniqueFrets.length - 1];

        return (
          <div
            key={`${chord.root}-${chord.quality}`}
            className={`flex items-center my-1 cursor-pointer rounded-md px-1 py-2 transition-colors ${isActive ? "bg-zinc-200" : "hover:bg-zinc-100"}`}
            onMouseEnter={() => onHoverChordVoicing(cv)}
            onMouseLeave={() => onHoverChordVoicing(null)}
          >
            <div className="w-28 shrink-0 flex items-center justify-end gap-1.5 pr-3">
              {hasOpen && (
                <div
                  className={`w-2.5 h-2.5 shrink-0 rounded-full border-2 transition-colors ${isActive ? "border-zinc-700" : "border-zinc-400"}`}
                />
              )}
              <span
                className={`text-sm font-semibold transition-colors ${isActive ? "text-zinc-900" : "text-zinc-500"}`}
              >
                {chordShortName(chord)}
              </span>
            </div>

            <div className="flex-1 relative h-5">
              {/* Background track */}
              <div
                className={`absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 transition-colors ${isActive ? "bg-zinc-400" : "bg-zinc-300"}`}
              />

              {/* Span line between outermost dots */}
              {minFret !== undefined && maxFret !== undefined && minFret !== maxFret && (
                <div
                  className={`absolute top-1/2 h-0.5 -translate-y-1/2 transition-colors ${isActive ? "bg-zinc-700" : "bg-zinc-400"}`}
                  style={{
                    left: `${fretCenterPct(minFret)}%`,
                    width: `${fretCenterPct(maxFret) - fretCenterPct(minFret)}%`,
                  }}
                />
              )}

              {/* Fret position dots */}
              {uniqueFrets.map((fret: number) => (
                <div
                  key={fret}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all ${isActive ? "w-5 h-5 bg-zinc-900" : "w-4 h-4 bg-zinc-400"}`}
                  style={{ left: `${fretCenterPct(fret)}%` }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function solutionCopyText(solution: PositionSolution, openStrings: readonly Note[]): string {
  const lines: string[] = [
    `Position: frets ${solution.windowStart}–${solution.windowEnd} (window size: ${solution.windowEnd - solution.windowStart + 1})`,
    "",
  ];

  for (const { chord, voicing } of solution.chordVoicings) {
    lines.push(`${chord.root} ${chord.quality}:`);
    for (const sf of voicing.stringFrets) {
      const stringLabel: Note | "?" = openStrings[sf.stringIdx] ?? "?";
      const fretLabel: string = sf.fret === 0 ? "open" : `fret ${sf.fret}`;
      const role: "root" | "third" | "fifth" = getNoteRole(sf.note, chord);
      lines.push(`  String ${sf.stringIdx} (${stringLabel}): ${fretLabel} → ${sf.note} [${role}]`);
    }
    const frettedFrets: number[] = voicing.stringFrets
      .filter((sf: StringFret) => sf.fret > 0)
      .map((sf: StringFret) => sf.fret);
    if (frettedFrets.length > 0) {
      lines.push(`  Fretted range: ${Math.min(...frettedFrets)}–${Math.max(...frettedFrets)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

type PositionSolutionCardProps = {
  readonly solution: PositionSolution;
  readonly openStrings: readonly Note[];
};

function PositionSolutionCard({ solution, openStrings }: PositionSolutionCardProps): JSX.Element {
  const [hidden, setHidden] = useState(false);
  const [hoveredCV, setHoveredCV] = useState<ChordVoicing | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy: () => void = (): void => {
    void navigator.clipboard.writeText(solutionCopyText(solution, openStrings)).then((): void => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return;
    });
    return;
  };

  const label: string =
    solution.windowStart === 0
      ? `Open position (frets 0–${solution.windowEnd})`
      : `Frets ${solution.windowStart}–${solution.windowEnd}`;

  return (
    <div className="border border-zinc-200 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-zinc-900">{label}</h3>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="btn btn-sm btn-outline">
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={() => setHidden((h: boolean) => !h)} className="btn btn-sm btn-outline">
            {hidden ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {!hidden && (
        <div className="flex gap-6" onMouseLeave={() => setHoveredCV(null)}>
          <div className="w-1/2">
            <ChordBars
              chordVoicings={solution.chordVoicings}
              windowStart={solution.windowStart}
              windowEnd={solution.windowEnd}
              activeChordVoicing={hoveredCV}
              onHoverChordVoicing={setHoveredCV}
            />
          </div>
          <div className="w-1/2 flex flex-col gap-2">
            <p className="text-sm font-semibold text-zinc-900 h-5">
              {chordName(hoveredCV?.chord ?? solution.chordVoicings[0]!.chord)}
            </p>
            <VoicingDiagram
              voicing={(hoveredCV ?? solution.chordVoicings[0]!).voicing}
              chord={(hoveredCV ?? solution.chordVoicings[0]!).chord}
              openStrings={openStrings}
              windowStart={solution.windowStart}
              windowEnd={solution.windowEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function chordKey(chord: Chord): string {
  return `${chord.root}-${chord.quality}`;
}

function buildBorrowedIV(scale: Scale): Chord {
  const root: Note = scale.notes.at(3);
  const rootIdx: number = chromaticRing.indexOf(root);
  const third: Note = chromaticRing.at(rootIdx + 4);
  const fifth: Note = chromaticRing.at(rootIdx + 7);
  return { root, third, fifth, quality: "major" };
}

function buildDorianVI(scale: Scale): Chord {
  const raisedSixthIdx: number = chromaticRing.indexOf(scale.notes.at(5)) + 1;
  const root: Note = chromaticRing.at(raisedSixthIdx);
  const third: Note = chromaticRing.at(raisedSixthIdx + 3);
  const fifth: Note = chromaticRing.at(raisedSixthIdx + 7);
  return { root, third, fifth, quality: "minor" };
}

type PositionFinderProps = {
  readonly scale: Scale;
};

export function PositionFinder({ scale }: PositionFinderProps): JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(new Set());
  const [windowSize, setWindowSize] = useState(defaultPositionFinderConfig.windowSize);

  const chords: readonly Chord[] = useMemo(
    () => scale.notes.items.map((note: Note) => chordForNote(scale, note)),
    [scale],
  );

  const borrowedIV: Chord = useMemo(() => buildBorrowedIV(scale), [scale]);
  const dorianVI: Chord = useMemo(() => buildDorianVI(scale), [scale]);

  const selectedChords: readonly Chord[] = useMemo(() => {
    const seen: Map<string, Chord> = new Map<string, Chord>();
    for (const chord of [...chords, borrowedIV, dorianVI]) {
      const key: string = chordKey(chord);
      if (selectedKeys.has(key) && !seen.has(key)) {
        seen.set(key, chord);
      }
    }
    return [...seen.values()];
  }, [chords, borrowedIV, dorianVI, selectedKeys]);

  const scaleNotes: ReadonlySet<Note> = useMemo(() => new Set(scale.notes.items), [scale]);

  const solutions: PositionSolution[] = useMemo(() => {
    if (selectedChords.length === 0) return [];
    return findPositionSolutions(selectedChords, scaleNotes, {
      ...defaultPositionFinderConfig,
      windowSize,
    });
  }, [selectedChords, scaleNotes, windowSize]);

  const toggleChord: (chord: Chord) => void = (chord: Chord): void => {
    setSelectedKeys((prev: ReadonlySet<string>) => {
      const next: Set<string> = new Set(prev);
      const key: string = chordKey(chord);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    return;
  };

  const dorianChords: readonly { chord: Chord; degree: string }[] = useMemo(() => {
    const candidates: Array<{ chord: Chord; degree: string }> = [
      { chord: borrowedIV, degree: "IV" },
      { chord: dorianVI, degree: "vi" },
    ];
    return candidates.filter(
      ({ chord }: { chord: Chord; degree: string }) =>
        !chords.some((c: Chord) => c.root === chord.root && c.quality === chord.quality),
    );
  }, [chords, borrowedIV, dorianVI]);

  return (
    <div className="mt-10">
      <h2 className="text-3xl font-bold mb-2">Position Finder</h2>
      <p className="text-zinc-700 mb-2">
        Select the chords used in your song to find positions on the neck where they all fit.
      </p>

      <MultiButtonToggle
        items={chords}
        isSelected={(chord: Chord) => selectedKeys.has(chordKey(chord))}
        onToggle={toggleChord}
        renderItem={(chord: Chord) => chordShortName(chord)}
        keyOf={chordKey}
      />

      {dorianChords.length > 0 && (
        <div className="flex items-center gap-3 justify-center pb-4 -mt-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium shrink-0">
            Dorian
          </span>
          {dorianChords.map(({ chord, degree }: { chord: Chord; degree: string }) => (
            <button
              key={chordKey(chord)}
              onClick={() => toggleChord(chord)}
              className={`btn btn-sm border-dashed ${selectedKeys.has(chordKey(chord)) ? "btn-neutral" : "btn-outline"}`}
            >
              {chordShortName(chord)}
              <span className="ml-1 text-xs opacity-60">{degree}</span>
            </button>
          ))}
          <span className="text-xs text-zinc-500 shrink-0">raised 6th — modal mixture</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <label className="text-sm text-zinc-700 shrink-0">
          Window size: <span className="text-zinc-900 font-medium">{windowSize} frets</span>
        </label>
        <input
          type="range"
          min={3}
          max={10}
          value={windowSize}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setWindowSize(Number(e.target.value))}
          className="range range-sm w-48"
        />
      </div>

      {selectedChords.length === 0 ? (
        <p className="text-zinc-700 italic">Select at least one chord above to find positions.</p>
      ) : solutions.length === 0 ? (
        <p className="text-zinc-700 italic">
          No positions found for a {windowSize}-fret window. Try increasing the window size.
        </p>
      ) : (
        <div>
          <p className="text-zinc-700 text-sm mb-4">
            {solutions.length} position{solutions.length !== 1 ? "s" : ""} found — hover a chord bar
            to see its voicing.
          </p>
          {solutions.map((solution: PositionSolution) => (
            <PositionSolutionCard
              key={`${solution.windowStart}-${solution.windowEnd}`}
              solution={solution}
              openStrings={STANDARD_TUNING}
            />
          ))}
        </div>
      )}
    </div>
  );
}
