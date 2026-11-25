import type { IAutoMovieMeshQueryHierarchy } from "@automovie/interface";

/**
 * Partition resident entry boxes into a median box hierarchy.
 *
 * The signed, separation and crossing queries supply triangle boxes, lash
 * contact supplies capsule boxes and the body envelope supplies point boxes,
 * all with finite XYZ extrema and centres in one metre frame. Every node
 * encloses every descendant, so its box distance is a lower bound for any
 * nearest-feature walk. No coordinate or identity changes; the stage sorts the
 * caller's array in place and keeps the original entries in its leaves, and an
 * input of at most twelve entries is returned as one leaf holding that same
 * array. Changing any entry's geometry requires rebuilding the tree.
 *
 * The widest node axis chooses each split, with X before Y before Z on equal
 * widths, and the stable centre sort keeps input order among equal centres. The
 * twelve-entry leaf size bounds direct entry work per leaf; it changes
 * traversal cost, never a query's answer. An empty input yields one leaf with
 * positive and negative infinity extrema, the empty union's sentinels rather
 * than a finite box; the signed query refuses empty surfaces before this
 * stage.
 *
 * @param entries Caller-owned entries, reordered in place.
 * @returns The hierarchy's root node.
 */
export function buildAutoMovieMeshQueryHierarchy<
  T extends IAutoMovieMeshQueryHierarchy.IEntry,
>(entries: T[]): IAutoMovieMeshQueryHierarchy<T> {
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (const entry of entries)
    for (let axis: number = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis]!, entry.low[axis]!);
      high[axis] = Math.max(high[axis]!, entry.high[axis]!);
    }
  if (entries.length <= 12) return { low, high, triangles: entries };
  let axis: number = 0;
  for (let candidate: number = 1; candidate < 3; candidate++)
    if (high[candidate]! - low[candidate]! > high[axis]! - low[axis]!)
      axis = candidate;
  entries.sort((a: T, b: T): number => a.centre[axis]! - b.centre[axis]!);
  const middle: number = Math.floor(entries.length / 2);
  return {
    low,
    high,
    left: buildAutoMovieMeshQueryHierarchy(entries.slice(0, middle)),
    right: buildAutoMovieMeshQueryHierarchy(entries.slice(middle)),
  };
}
