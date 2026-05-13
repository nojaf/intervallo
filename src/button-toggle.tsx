import type { JSX, ReactNode } from "react";

type ButtonToggleProps<T> = {
  readonly items: readonly T[];
  readonly onClick: (item: T) => void;
  readonly activeItem: T;
  readonly renderItem: (item: T) => ReactNode;
  readonly keyOf: (item: T) => string;
  readonly classNameOf?: (item: T) => string;
  readonly disabled?: boolean;
};

export function ButtonToggle<T>({
  items,
  onClick,
  activeItem,
  renderItem,
  keyOf,
  classNameOf,
  disabled,
}: ButtonToggleProps<T>): JSX.Element {
  const itemCount: number = items.length;

  return (
    <div className="flex flex-row justify-center py-4">
      {items.map((item: T, idx: number) => {
        const colorClass: string =
          classNameOf !== undefined
            ? classNameOf(item)
            : item === activeItem
              ? "btn-neutral"
              : "btn-outline";

        const className: string = [
          colorClass,
          idx > 0 ? "border-l-[0]" : "",
          idx === 0 ? "rounded-l-md" : "",
          idx === itemCount - 1 ? "rounded-r-md" : "",
        ].join(" ");

        return (
          <button
            key={keyOf(item)}
            onClick={() => onClick(item)}
            disabled={disabled}
            className={`btn rounded-none ${className}`}
          >
            {renderItem(item)}
          </button>
        );
      })}
    </div>
  );
}
