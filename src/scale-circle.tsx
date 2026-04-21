import type { JSX } from "react";
import { type Note, type Scale, chordForNote, chordName, semitonesBetween } from "./music.ts";

function isThirdOrFifth(scale: Scale, activeNote: Note | undefined, note: Note): boolean {
  if (activeNote === undefined) return false;
  const rootIdx: number = scale.notes.indexOf(activeNote);
  const third: Note = scale.notes.at(rootIdx + 2);
  const fifth: Note = scale.notes.at(rootIdx + 4);
  return note === third || note === fifth;
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startRad: number = (startAngle * Math.PI) / 180;
  const endRad: number = (endAngle * Math.PI) / 180;

  const startX: number = centerX + radius * Math.cos(startRad);
  const startY: number = centerY + radius * Math.sin(startRad);
  const endX: number = centerX + radius * Math.cos(endRad);
  const endY: number = centerY + radius * Math.sin(endRad);

  const angleDiff: number = endAngle - startAngle;
  const largeArcFlag: string = angleDiff > 180 ? "1" : "0";

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
}

function strokeColorForSemitones(semitones: number): string {
  switch (semitones) {
    case 1:
      return "stroke-neutral-300";
    case 2:
      return "stroke-neutral-600";
    case 3:
      return "stroke-red-500";
    default:
      return "stroke-base-content";
  }
}

type ScaleCircleProps = {
  readonly scale: Scale;
  readonly radius?: number;
  readonly padding?: number;
  readonly className?: string;
  readonly onNoteClick: (note: Note) => void;
  readonly activeNote?: Note | undefined;
};

export function ScaleCircle({
  scale,
  radius = 300,
  padding = 20,
  className = "",
  onNoteClick,
  activeNote,
}: ScaleCircleProps): JSX.Element {
  const size: number = radius + padding * 2;
  const center: number = size / 2;
  const orbitRadius: number = radius / 2;
  const degreesPerSemitone: number = 30; // 360 / 12 semitones
  const arcPadding: number = 6;

  const rootNote: Note = scale.rootNote;
  const notes: readonly Note[] = scale.notes.items;

  const noteAngles: number[] = notes.map((note: Note): number => {
    const semitones: number = semitonesBetween(rootNote, note);
    return semitones * degreesPerSemitone - 90; // -90 to start at top
  });

  const arcs: JSX.Element[] = notes.map((note: Note, idx: number): JSX.Element => {
    const nextIdx: number = (idx + 1) % notes.length;
    const nextNote: Note = notes[nextIdx]!;

    const startAngle: number = noteAngles[idx]!;
    let endAngle: number = noteAngles[nextIdx]!;
    if (endAngle <= startAngle) endAngle += 360;

    const semitones: number = semitonesBetween(note, nextNote);
    const strokeColor: string = strokeColorForSemitones(semitones);

    const arcPath: string = describeArc(
      center,
      center,
      orbitRadius,
      startAngle + arcPadding,
      endAngle - arcPadding,
    );

    return <path key={`arc-${idx}`} d={arcPath} className={`${strokeColor} fill-none stroke-3`} />;
  });

  return (
    <div className={`relative ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={String(size)}
        height={String(size)}
      >
        {arcs}
      </svg>

      {activeNote !== undefined && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-white p-4 rounded-full">
          {chordName(chordForNote(scale, activeNote))}
        </div>
      )}

      {notes.map((note: Note, idx: number) => {
        const semitones: number = semitonesBetween(rootNote, note);
        const degrees: number = semitones * degreesPerSemitone;
        const angleInRadians: number = ((degrees - 90) * Math.PI) / 180;
        const x: number = orbitRadius * Math.cos(angleInRadians) + center;
        const y: number = orbitRadius * Math.sin(angleInRadians) + center;

        const isActive: boolean = activeNote === note;

        const buttonStyle: string = isActive
          ? "bg-yellow-400 text-white"
          : isThirdOrFifth(scale, activeNote, note)
            ? "bg-orange-500 text-white"
            : "bg-zinc-950 text-white hover:bg-zinc-700";

        return (
          <button
            key={idx}
            className={`btn btn-circle btn-sm absolute -translate-x-1/2 -translate-y-1/2 ${buttonStyle}`}
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={() => onNoteClick(note)}
          >
            {note}
          </button>
        );
      })}
    </div>
  );
}
