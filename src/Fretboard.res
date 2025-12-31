open Music

type noteHighlight = PrimaryNote | SecondaryNote | GrayedOutNote | RegularNote

module Note = {
  @react.component
  let make = (~note: note, ~highlight) => {
    let colors = switch highlight {
    | RegularNote => "bg-zinc-950 text-white"
    | PrimaryNote => "bg-yellow-400 text-white"
    | SecondaryNote => "bg-sky-500 text-white"
    | GrayedOutNote => "bg-zinc-950 opacity-10 text-white"
    }

    <div
      className={`rounded-full ${colors} flex items-center justify-center h-[30px] w-[30px] text-sm`}
    >
      {noteElement(note)}
    </div>
  }
}

module Fret = {
  @react.component
  let make = (~note: note, ~highlight) => {
    <div
      className="border-r-4 border-neutral-400 flex-1 min-w-[40px] p-2 flex items-center justify-end"
    >
      <Note note={note} highlight />
    </div>
  }
}

module OpenString = {
  @react.component
  let make = (~openNote: note, ~highlight) => {
    <div className="shrink-0">
      <Note note={openNote} highlight />
    </div>
  }
}

module GuitarString = {
  @react.component
  let make = (
    ~openNote: note,
    ~maxFrets: int=15,
    ~addFretMarker: bool=false,
    ~highlighter: note => noteHighlight,
  ) => {
    let openNoteIdx = chromaticRing->Ring.indexOf(openNote)
    <div className="flex gap-4 items-center w-full">
      <OpenString openNote={openNote} highlight={highlighter(openNote)} />
      <div className="border border-zinc-950 flex flex-1">
        {Array.fromInitializer(~length=maxFrets, i => {
          let fret = i + 1
          let note = chromaticRing->Ring.at(openNoteIdx + fret)
          <Fret key={String.make(i)} note highlight={highlighter(note)} />
        })->React.array}
      </div>
    </div>
  }
}

module FretMarker = {
  @react.component
  let make = (~fret: int) => {
    let hasSingleDot = {
      let positionInOctave = mod(fret, 12)
      [3, 5, 7, 9]->Array.includes(positionInOctave)
    }
    let hasDoubleDot = mod(fret, 12) == 0

    <div className="flex-1 min-w-[40px] h-full flex flex-col items-center justify-center">
      {if hasDoubleDot {
        <div className="h-1/2 flex flex-col justify-evenly items-center">
          <div className="bg-amber-100 w-[20px] h-[20px] rounded-full" />
          <div className="bg-amber-100 w-[20px] h-[20px] rounded-full" />
        </div>
      } else if hasSingleDot {
        <div className="bg-amber-100 w-[20px] h-[20px] rounded-full" />
      } else {
        React.null
      }}
    </div>
  }
}

module FretMarkers = {
  @react.component
  let make = (~maxFrets: int) => {
    <div className="absolute inset-0 flex gap-4 z-[-1] pointer-events-none">
      <div className="shrink-0 w-[30px]" /> // spacer for open string
      <div className="flex flex-1 h-full">
        {Array.fromInitializer(~length=maxFrets, i => {
          <FretMarker key={Int.toString(i)} fret={i + 1} />
        })->React.array}
      </div>
    </div>
  }
}

@react.component
let make = (
  ~openStrings: array<note>,
  ~maxFrets: int=15,
  ~className="",
  ~grayedOut=Set.make(),
  ~primary=?,
  ~secondary=Set.make(),
) => {
  let highlighter = note => {
    switch primary {
    | Some(p) if note == p => PrimaryNote
    | _ =>
      if secondary->Set.has(note) {
        SecondaryNote
      } else if grayedOut->Set.has(note) {
        GrayedOutNote
      } else {
        RegularNote
      }
    }
  }

  <div className={`overflow-auto select-none relative isolate ${className}`}>
    <FretMarkers maxFrets={maxFrets} />
    {openStrings
    ->Array.map(openNote => {
      <GuitarString
        key={displayNote(openNote)} openNote={openNote} maxFrets={maxFrets} highlighter
      />
    })
    ->React.array}
  </div>
}
