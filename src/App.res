open Music

let cMajor = Scale.make(majorScalePattern, D)
let cMajorChord = Scale.chordForNote(cMajor, A)

@scope("JSON")
external jsonStringifyAny: 't => React.element = "stringify"

@react.component
let make = () => {
  let (rootNote, setRootNote) = React.useState(_ => C)
  let majorScale = Scale.make(majorScalePattern, rootNote)
  let unusedNotes = chromaticRing->Ring.subtract(majorScale.notes)

  <div className="w-full h-full p-8">
    <h1 className="font-title text-2xl md:text-3xl lg:text-4xl font-bold">
      {React.string("Intervallo")}
    </h1>
    <div className="flex flex-row justify-center py-4">
      {chromaticRing.items
      ->Array.mapWithIndex((note, idx) => {
        let className = [
          //
          note == rootNote ? "btn-neutral" : "btn-outline",
          idx > 0 ? "border-l-[0]" : "",
          idx == 0 ? "rounded-l-md" : "",
          idx == chromaticRing.items->Array.length - 1 ? "rounded-r-md" : "",
        ]->Array.join(" ")

        <button
          key={(note :> string)}
          onClick={_ => setRootNote(_ => note)}
          className={`btn rounded-none ${className}`}
        >
          {noteElement(note)}
        </button>
      })
      ->React.array}
    </div>
    <ScaleCircle scale={majorScale} radius={300} />
    <Fretboard
      openStrings=[E, B, G, D, A, E]
      className="mt-6 mx-auto"
      primary={majorScale.rootNote}
      grayedOut={unusedNotes}
    />
    <code className="mt-4 block"> {jsonStringifyAny(majorScale)} </code>
    <code className="mt-4 block"> {jsonStringifyAny(cMajorChord)} </code>
  </div>
}
