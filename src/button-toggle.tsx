import type { JSX, ReactNode } from "react";

type ButtonToggleProps<T> = {
  readonly items: readonly T[];
  readonly onClick: (item: T) => void;
  readonly activeItem: T;
  readonly renderItem: (item: T) => ReactNode;
  readonly keyOf: (item: T) => string;
};

export function ButtonToggle<T>({
  items,
  onClick,
  activeItem,
  renderItem,
  keyOf,
}: ButtonToggleProps<T>): JSX.Element {
  const itemCount: number = items.length;

  return (
    <div className="flex flex-row justify-center py-4">
      {items.map((item: T, idx: number) => {
        const className: string = [
          item === activeItem ? "btn-neutral" : "btn-outline",
          idx > 0 ? "border-l-[0]" : "",
          idx === 0 ? "rounded-l-md" : "",
          idx === itemCount - 1 ? "rounded-r-md" : "",
        ].join(" ");

        return (
          <button
            key={keyOf(item)}
            onClick={() => onClick(item)}
            className={`btn rounded-none ${className}`}
          >
            {renderItem(item)}
          </button>
        );
      })}
    </div>
  );
}
