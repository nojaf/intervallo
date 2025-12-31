open Music

@react.component
let make = () => {
  let (rootNote, setRootNote) = React.useState(_ => C)
  let (scalePattern, setScalePattern) = React.useState(_ => majorScalePattern)
  let majorScale = Scale.make(scalePattern, rootNote)
  let unusedNotes = chromaticRing->Ring.subtract(majorScale.notes)
  let (activeNote, setActiveNote) = React.useState(_ => None)

  <div className="w-full h-full p-8">
    <h1 className="font-title text-2xl md:text-3xl lg:text-4xl font-bold">
      {React.string("Intervallo")}
    </h1>
    <ButtonToggle
      items={chromaticRing.items}
      onClick={note => {
        setRootNote(_ => note)
        setActiveNote(_ => None)
      }}
      activeItem={rootNote}
      renderItem={noteElement}
      keyOf={note => (note :> string)}
    />
    <ButtonToggle
      items={["Major", "Minor"]}
      onClick={pattern => {
        setScalePattern(_ => pattern == "Major" ? majorScalePattern : minorScalePattern)
        setActiveNote(_ => None)
      }}
      activeItem={scalePattern == majorScalePattern ? "Major" : "Minor"}
      renderItem={React.string}
      keyOf={id => id}
    />

    <h2 className="text-3xl font-bold"> {React.string("Scale")} </h2>
    <Fretboard
      openStrings=[E, B, G, D, A, E]
      className="my-6 mx-auto"
      primary={majorScale.rootNote}
      grayedOut={unusedNotes}
    />
    <div className="flex flex-col items-center justify-center gap-4">
      <ScaleCircle
        scale={majorScale}
        radius={300}
        activeNote=?activeNote
        onNoteClick={note => setActiveNote(_ => Some(note))}
      />
      {switch activeNote {
      | None => React.null
      | Some(_) =>
        <button onClick={_ => setActiveNote(_ => None)} className="btn btn-outline">
          {React.string("reset")}
        </button>
      }}
    </div>
    {switch activeNote {
    | None => React.null
    | Some(activeNote) => {
        let chord = majorScale->Scale.chordForNote(activeNote)
        let grayedOut =
          allNotes->Set.difference(Set.fromArray([chord.root, chord.third, chord.fifth]))
        <>
          <h2 className="text-3xl font-bold"> {React.string(Music.chordName(chord))} </h2>
          <Fretboard
            openStrings=[E, B, G, D, A, E]
            className="my-6 mx-auto"
            primary={activeNote}
            secondary={Set.fromArray([chord.third, chord.fifth])}
            grayedOut={grayedOut}
          />
        </>
      }
    }}
    // <code className="mt-4 block"> {jsonStringifyAny(majorScale)} </code>
    // <code className="mt-4 block"> {jsonStringifyAny(cMajorChord)} </code>
  </div>
}
