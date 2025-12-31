open Music

module Note = {
  @react.component
  let make = (~note: note, ~highlight=false) => {
    let colors = highlight ? "bg-sky-800 text-white" : "bg-zinc-950 text-white"
    <div
      className={`rounded-full ${colors} flex items-center justify-center h-[30px] w-[30px] text-sm`}
    >
      {noteElement(note)}
    </div>
  }
}

module Fret = {
  @react.component
  let make = (~note: note) => {
    <div className="border-r-4 border-neutral-400 w-[100px] p-2 flex items-center justify-end">
      <Note note={note} highlight={note == FSharp} />
    </div>
  }
}

module OpenString = {
  @react.component
  let make = (~openNote: note) => {
    <Note note={openNote} />
  }
}

module GuitarString = {
  @react.component
  let make = (~openNote: note, ~maxFrets: int=15, ~addFretMarker: bool=false) => {
    let openNoteIdx = chromaticRing->Ring.indexOf(openNote)
    <div className="flex gap-4 items-center">
      <OpenString openNote={openNote} />
      <div className="border border-zinc-950 flex">
        {Array.fromInitializer(~length=maxFrets, i => {
          let fret = i + 1
          let note = chromaticRing->Ring.at(openNoteIdx + fret)
          <Fret key={String.make(i)} note />
        })->React.array}
      </div>
    </div>
  }
}

module FretMarkers = {
  type fretMarkers = SingleDot | DoubleDot | NoDots

  @react.component
  let make = (~maxFrets: int) => {
    Array.fromInitializer(~length=maxFrets, i => {
      let fret = i + 1
      let marker = if mod(fret, 12) == 0 {
        DoubleDot
      } else if {
        let positionInOctave = mod(fret, 12)
        [3, 5, 7, 9]->Array.includes(positionInOctave)
      } {
        SingleDot
      } else {
        NoDots
      }

      let leftOffset = 48 // open string width
      let fretWidthOffset = 50
      let left = px(leftOffset + i * 100 + fretWidthOffset)

      switch marker {
      | NoDots => React.null
      | SingleDot =>
        <div
          key={Int.toString(i)}
          style={{left: left}}
          className="absolute top-1/2 z-[-1] -translate-y-1/2 -translate-x-1/2 bg-amber-100 w-[25px] h-[25px] rounded-full"
        >
        </div>
      | DoubleDot =>
        <>
          <div
            key={Int.toString(i)}
            style={{left: left}}
            className="absolute top-1/3 z-[-1] -translate-y-1/2 -translate-x-1/2 bg-amber-100 w-[25px] h-[25px] rounded-full"
          >
          </div>
          <div
            key={Int.toString(i)}
            style={{left: left}}
            className="absolute top-2/3 z-[-1] -translate-y-1/2 -translate-x-1/2 bg-amber-100 w-[25px] h-[25px] rounded-full"
          >
          </div>
        </>
      }
    })->React.array
  }
}

@react.component
let make = (~openStrings: array<note>, ~maxFrets: int=15, ~className="") => {
  <div className={`overflow-auto select-none relative isolate bg-transparent ${className}`}>
    <FretMarkers maxFrets={maxFrets} />
    {openStrings
    ->Array.map(openNote => {
      <GuitarString key={displayNote(openNote)} openNote={openNote} maxFrets={maxFrets} />
    })
    ->React.array}
  </div>
}
