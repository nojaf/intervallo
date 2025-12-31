@react.component
let make: (
  ~scale: Music.Scale.t,
  ~radius: int=?,
  ~padding: int=?,
  ~className: string=?,
  ~onNoteClick: Music.note => unit,
  ~activeNote: Music.note=?,
) => React.element
