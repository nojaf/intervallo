let px = (v: int) => String.make(v) ++ "px"
let pxf = (v: float) => String.make(v) ++ "px"

@react.component
let make = (~scale: Music.Scale.t, ~radius=300, ~padding=20, ~className="") => {
  let size = radius + padding * 2
  let center = Int.toFloat(size) / 2.
  let orbitRadius = Int.toFloat(radius) / 2.
  let degreesPerSemitone = 30. // 360° / 12 semitones

  let rootNote = scale.rootNote

  <div className={`relative border ${className}`} style={{width: px(size), height: px(size)}}>
    {scale.notes.items
    ->Array.mapWithIndex((note, idx) => {
      let semitones = Music.semitonesBetween(rootNote, note)
      let degrees = Int.toFloat(semitones) * degreesPerSemitone
      let angleInRadians = (degrees - 90.) * Math.Constants.pi / 180.
      let x = orbitRadius * Math.cos(angleInRadians) + center
      let y = orbitRadius * Math.sin(angleInRadians) + center
      <div
        key={String.make(idx)}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{left: pxf(x), top: pxf(y)}}
      >
        {Music.displayNote(note)}
      </div>
    })
    ->React.array}
  </div>
}
