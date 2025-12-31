type t<'node> = {items: array<'node>}

let make = (source: array<'node>) => {
  {
    items: source,
  }
}

@send
external atUnSafe: (array<'t>, int) => 't = "at"

let length = (ring: t<'node>) => ring.items->Array.length

// Circular index access
let at = (ring: t<'node>, index: int) => {
  let len = ring->length
  let normalizedIdx = mod(index, len)
  let finalIdx = normalizedIdx < 0 ? normalizedIdx + len : normalizedIdx
  ring.items->Array.getUnsafe(finalIdx)
}

let contains = (ring: t<'node>, node: 'node) => ring.items->Array.some(item => item == node)

let indexOf = (ring: t<'node>, node: 'node) => ring.items->Array.indexOf(node)

// Forward distance between two items
let distanceBetween = (ring: t<'node>, from: 'node, to: 'node) => {
  let fromIdx = indexOf(ring, from)
  let toIdx = indexOf(ring, to)
  let len = ring->length
  if toIdx >= fromIdx {
    toIdx - fromIdx
  } else {
    len - fromIdx + toIdx
  }
}

let subtract = (source: t<'node>, target: t<'node>) => {
  let sourceItems = source.items->Set.fromArray
  let targetItems = target.items->Set.fromArray
  sourceItems->Set.difference(targetItems)
}
