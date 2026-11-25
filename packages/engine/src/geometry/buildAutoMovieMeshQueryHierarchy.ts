import type { IAutoMovieMeshQueryHierarchy } from "@automovie/interface";

/**
 * Partition resident entry boxes into a median box hierarchy.
 *
 * The signed and separation queries supply triangle boxes, lash contact
 * supplies capsule boxes and the body envelope supplies point boxes,
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
  const { low, high } = bounds(entries, 0, entries.length);
  if (entries.length <= 12) return { low, high, triangles: entries };
  const axis: number = widest(low, high);
  entries.sort((a: T, b: T): number => a.centre[axis]! - b.centre[axis]!);
  const middle: number = Math.floor(entries.length / 2);
  return {
    low,
    high,
    left: buildAutoMovieMeshQueryHierarchy(entries.slice(0, middle)),
    right: buildAutoMovieMeshQueryHierarchy(entries.slice(middle)),
  };
}

/** Median hierarchy preparation for queries with their own candidate order. */
export namespace buildAutoMovieMeshQueryHierarchy {
  /**
   * Partition a caller-owned scratch array by median rank. Child ranges share
   * that array during preparation. Leaves retain their own entry lists.
   * The crossing query supplies finite world boxes and orders its candidates
   * independently. Equal centres may be distributed on either side of the split.
   *
   * @param entries World boxes in an array the builder can reorder.
   * @returns The hierarchy with exact descendant bounds.
   *
   * @see https://www.pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies Equal-count hierarchy partition.
   */
  export function partition<T extends IAutoMovieMeshQueryHierarchy.IEntry>(
    entries: T[],
  ): IAutoMovieMeshQueryHierarchy<T> {
    const walk = (first: number, end: number): IAutoMovieMeshQueryHierarchy<T> => {
      const { low, high } = bounds(entries, first, end);
      if (end - first <= 12)
        return { low, high, triangles: entries.slice(first, end) };
      const middle = first + Math.floor((end - first) / 2);
      select(entries, first, end, middle, widest(low, high));
      return { low, high, left: walk(first, middle), right: walk(middle, end) };
    };
    return walk(0, entries.length);
  }
}

/** Every node encloses all the entries in its source range. */
function bounds<T extends IAutoMovieMeshQueryHierarchy.IEntry>(
  entries: readonly T[],
  first: number,
  end: number,
): { low: number[]; high: number[] } {
  const low: number[] = [Infinity, Infinity, Infinity];
  const high: number[] = [-Infinity, -Infinity, -Infinity];
  for (let i = first; i < end; ++i) {
    const entry: T = entries[i]!;
    for (let axis = 0; axis < 3; ++axis) {
      low[axis] = Math.min(low[axis]!, entry.low[axis]!);
      high[axis] = Math.max(high[axis]!, entry.high[axis]!);
    }
  }
  return { low, high };
}

/** The first axis wins equal world extents. */
function widest(low: number[], high: number[]): number {
  let axis = 0;
  for (let candidate = 1; candidate < 3; ++candidate)
    if (high[candidate]! - low[candidate]! > high[axis]! - low[axis]!)
      axis = candidate;
  return axis;
}

/** Select the median centre by a three-way partition, including equal centres. */
function select<T extends IAutoMovieMeshQueryHierarchy.IEntry>(
  entries: T[],
  first: number,
  end: number,
  nth: number,
  axis: number,
): void {
  // Halving each trial costs less than 2n visits in total. Fall back to the
  // old sort on the active range when a sequence of pivots exceeds that work.
  let budget = 2 * (end - first);
  while (end - first > 1) {
    budget -= end - first;
    if (budget < 0) {
      const sorted = entries.slice(first, end).sort(
        (a, b) => a.centre[axis]! - b.centre[axis]!,
      );
      for (let i = 0; i < sorted.length; ++i) entries[first + i] = sorted[i]!;
      return;
    }
    const a = entries[first]!.centre[axis]!;
    const b = entries[first + Math.floor((end - first) / 2)]!.centre[axis]!;
    const c = entries[end - 1]!.centre[axis]!;
    const pivot = Math.max(Math.min(a, b), Math.min(Math.max(a, b), c));
    let lower = first;
    let upper = end;
    for (let i = first; i < upper; ) {
      const entry = entries[i]!;
      const centre = entry.centre[axis]!;
      if (centre < pivot) {
        entries[i] = entries[lower]!;
        entries[lower] = entry;
        ++i;
        ++lower;
      } else if (centre > pivot) {
        --upper;
        entries[i] = entries[upper]!;
        entries[upper] = entry;
      } else ++i;
    }
    if (nth < lower) end = lower;
    else if (nth >= upper) first = upper;
    else return;
  }
}
