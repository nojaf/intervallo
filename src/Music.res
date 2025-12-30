type step = HalfStep | WholeStep

let majorScalePattern = [WholeStep, WholeStep, HalfStep, WholeStep, WholeStep, WholeStep, HalfStep]

type note = C | CSharp | D | DSharp | E | F | FSharp | G | GSharp | A | ASharp | B

let displayNote = (note: note): React.element => {
  let note = switch note {
  | C => "C"
  | CSharp => "C#"
  | D => "D"
  | DSharp => "D#"
  | E => "E"
  | F => "F"
  | FSharp => "F#"
  | G => "G"
  | GSharp => "G#"
  | A => "A"
  | ASharp => "A#"
  | B => "B"
  }
  React.string(note)
}

type chordQuality = Major | Minor | Diminished

type chord = {
  root: note,
  third: note,
  fifth: note,
  quality: chordQuality,
}

let chromaticRing = Ring.make([C, CSharp, D, DSharp, E, F, FSharp, G, GSharp, A, ASharp, B])

/** Absolute semitones (distance) between two notes */
let semitonesBetween = (from: note, to: note): int => {
  Ring.distanceBetween(chromaticRing, from, to)
}

module Scale = {
  type t = {
    rootNote: note,
    intervals: array<step>,
    notes: Ring.t<note>,
  }

  let make = (intervals: array<step>, rootNote: note): t => {
    let rootIdx = Ring.indexOf(chromaticRing, rootNote)

    // Build notes by walking through intervals
    let (notes, _) = intervals->Array.reduce(([], rootIdx), ((notes, currentIdx), interval) => {
      let note = Ring.at(chromaticRing, currentIdx)
      let distanceToNextNote = interval == WholeStep ? 2 : 1
      ([...notes, note], currentIdx + distanceToNextNote)
    })

    {rootNote, intervals, notes: Ring.make(notes)}
  }

  let chordAtIndex = (scale: t, degree: int): chord => {
    let root = Ring.at(scale.notes, degree)
    let third = Ring.at(scale.notes, degree + 2) // skip 2nd
    let fifth = Ring.at(scale.notes, degree + 4) // skip 4th

    let rootToThird = semitonesBetween(root, third)
    let thirdToFifth = semitonesBetween(third, fifth)

    let quality = if rootToThird == 4 {
      Major
    } else if rootToThird == 3 && thirdToFifth == 3 {
      Diminished
    } else {
      Minor // 3 half steps root to third, more than 3 to fifth
    }

    {root, third, fifth, quality}
  }

  let chordForNote = (scale, note) => {
    if !Ring.contains(scale.notes, note) {
      throw(JsExn.throw("Note not in scale"))
    }
    let degree = Ring.indexOf(scale.notes, note)
    chordAtIndex(scale, degree)
  }
}
