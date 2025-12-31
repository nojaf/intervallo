let describeArc = (
  ~centerX: float,
  ~centerY: float,
  ~radius: float,
  ~startAngle: float,
  ~endAngle: float,
) => {
  let startRad = startAngle * Math.Constants.pi / 180.
  let endRad = endAngle * Math.Constants.pi / 180.

  let startX = centerX + radius * Math.cos(startRad)
  let startY = centerY + radius * Math.sin(startRad)
  let endX = centerX + radius * Math.cos(endRad)
  let endY = centerY + radius * Math.sin(endRad)

  // Determine if arc spans more than 180 degrees
  let angleDiff = endAngle - startAngle
  let largeArcFlag = angleDiff > 180. ? "1" : "0"

  `M ${Float.toString(startX)} ${Float.toString(startY)} A ${Float.toString(
      radius,
    )} ${Float.toString(radius)} 0 ${largeArcFlag} 1 ${Float.toString(endX)} ${Float.toString(
      endY,
    )}`
}

let strokeColorForSemitones = (semitones: int): string => {
  switch semitones {
  | 1 => "stroke-neutral-300" // half step
  | 2 => "stroke-neutral-600" // whole step
  | 3 => "stroke-red-500" // minor third
  | _ => "stroke-base-content" // fallback
  }
}

@react.component
let make = (
  ~scale: Music.Scale.t,
  ~radius=300,
  ~padding=20,
  ~className="",
  ~onNoteClick: Music.note => unit,
  ~activeNote: option<Music.note>=?,
) => {
  let size = radius + padding * 2
  let center = Int.toFloat(size) / 2.
  let orbitRadius = Int.toFloat(radius) / 2.
  let degreesPerSemitone = 30. // 360° / 12 semitones
  let arcPadding = 6. // degrees of padding on each side of the arc

  let rootNote = scale.rootNote
  let notes = scale.notes.items

  // Calculate angle for each note
  let noteAngles = notes->Array.map(note => {
    let semitones = Music.semitonesBetween(rootNote, note)
    Int.toFloat(semitones) * degreesPerSemitone - 90. // -90 to start at top
  })

  // Generate arcs between consecutive notes
  let arcs = notes->Array.mapWithIndex((note, idx) => {
    let nextIdx = mod(idx + 1, notes->Array.length)
    let nextNote = notes->Array.getUnsafe(nextIdx)

    let startAngle = noteAngles->Array.getUnsafe(idx)
    let endAngle = noteAngles->Array.getUnsafe(nextIdx)

    // Handle wrap-around (e.g., from 330° to 0°)
    let endAngle = endAngle <= startAngle ? endAngle + 360. : endAngle

    let semitones = Music.semitonesBetween(note, nextNote)
    let strokeColor = strokeColorForSemitones(semitones)

    let arcPath = describeArc(
      ~centerX=center,
      ~centerY=center,
      ~radius=orbitRadius,
      ~startAngle=startAngle + arcPadding,
      ~endAngle=endAngle - arcPadding,
    )

    <path
      key={`arc-${String.make(idx)}`} d={arcPath} className={`${strokeColor} fill-none stroke-3`}
    />
  })

  <div className={`relative ${className}`} style={{width: px(size), height: px(size)}}>
    // SVG layer for arcs
    <svg
      className="absolute inset-0 pointer-events-none"
      width={String.make(size)}
      height={String.make(size)}
    >
      {arcs->React.array}
    </svg>
    // Chord
    {switch activeNote {
    | None => React.null
    | Some(activeNote) => {
        let chord = Music.Scale.chordForNote(scale, activeNote)
        let chordName = Music.chordName(chord)
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-white p-4 rounded-full"
        >
          {React.string(chordName)}
        </div>
      }
    }}
    // Notes layer
    {notes
    ->Array.mapWithIndex((note, idx) => {
      let semitones = Music.semitonesBetween(rootNote, note)
      let degrees = Int.toFloat(semitones) * degreesPerSemitone
      let angleInRadians = (degrees - 90.) * Math.Constants.pi / 180.
      let x = orbitRadius * Math.cos(angleInRadians) + center
      let y = orbitRadius * Math.sin(angleInRadians) + center
      let onClick = _ => {
        onNoteClick(note)
      }
      let isActive = activeNote == Some(note)
      let isThirdOrFifth = {
        switch activeNote {
        | None => false
        | Some(activeNote) => {
            let rootIdx = Ring.indexOf(scale.notes, activeNote)
            let third = Ring.at(scale.notes, rootIdx + 2)
            let fifth = Ring.at(scale.notes, rootIdx + 4)
            note == third || note == fifth
          }
        }
      }
      let btnStyle = if isActive {
        "bg-yellow-400 text-white"
      } else if isThirdOrFifth {
        "bg-orange-500 text-white"
      } else {
        "bg-zinc-950 text-white hover:bg-zinc-700"
      }
      <button
        key={String.make(idx)}
        className={`btn btn-circle btn-sm absolute -translate-x-1/2 -translate-y-1/2 ${btnStyle}`}
        style={{left: pxf(x), top: pxf(y)}}
        onClick
      >
        {Music.noteElement(note)}
      </button>
    })
    ->React.array}
  </div>
}
