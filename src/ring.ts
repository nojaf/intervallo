/** A circular buffer that wraps around, useful for modeling cycles like the chromatic scale. */
export class Ring<T> {
  readonly items: readonly T[];

  constructor(source: readonly T[]) {
    this.items = source;
  }

  get length(): number {
    return this.items.length;
  }

  /** Circular index access — negative indices and overflow wrap around. */
  at(index: number): T {
    const normalizedIdx: number = index % this.length;
    const finalIdx: number = normalizedIdx < 0 ? normalizedIdx + this.length : normalizedIdx;
    return this.items[finalIdx]!;
  }

  contains(node: T): boolean {
    return this.items.includes(node);
  }

  indexOf(node: T): number {
    return this.items.indexOf(node);
  }

  /** Forward distance (in slots) from one item to another, wrapping around if needed. */
  distanceBetween(from: T, to: T): number {
    const fromIdx: number = this.indexOf(from);
    const toIdx: number = this.indexOf(to);
    return toIdx >= fromIdx ? toIdx - fromIdx : this.length - fromIdx + toIdx;
  }

  /** Returns the set of items in this ring that are not in the target ring. */
  subtract(target: Ring<T>): Set<T> {
    const sourceItems: Set<T> = new Set(this.items);
    const targetItems: Set<T> = new Set(target.items);
    return sourceItems.difference(targetItems);
  }
}
