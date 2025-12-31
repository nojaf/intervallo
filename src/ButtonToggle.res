@react.component
let make = (
  ~items: array<'t>,
  ~onClick: 't => unit,
  ~activeItem: 't,
  ~renderItem: 't => React.element,
  ~keyOf: 't => string,
) => {
  let itemCount = items->Array.length

  <div className="flex flex-row justify-center py-4">
    {items
    ->Array.mapWithIndex((item, idx) => {
      let className =
        [
          item == activeItem ? "btn-neutral" : "btn-outline",
          idx > 0 ? "border-l-[0]" : "",
          idx == 0 ? "rounded-l-md" : "",
          idx == itemCount - 1 ? "rounded-r-md" : "",
        ]->Array.join(" ")

      <button
        key={keyOf(item)} onClick={_ => onClick(item)} className={`btn rounded-none ${className}`}
      >
        {renderItem(item)}
      </button>
    })
    ->React.array}
  </div>
}
