open Music

@react.component
let make = (~scale: Scale.t) => {
  <ul>
    {scale.notes.items
    ->Array.map(note => {
      <li key={displayNote(note)} className="text-lg py-1 text-zinc-600">
        {Scale.chordForNote(scale, note)->chordName->React.string}
      </li>
    })
    ->React.array}
  </ul>
}
