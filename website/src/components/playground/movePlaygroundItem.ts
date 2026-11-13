/**
 * A list with one item moved one place.
 *
 * @param list The list.
 * @param index The item's place.
 * @param by One place earlier (-1) or later (1).
 * @returns The reordered list; the same order when the item is at that end.
 */
export function movePlaygroundItem<T>(
  list: readonly T[],
  index: number,
  by: -1 | 1,
): T[] {
  const target: number = index + by;
  const next: T[] = [...list];
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
