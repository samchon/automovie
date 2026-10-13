import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";

/**
 * Partition resident entry boxes into a median box hierarchy.
 *
 * The signed, separation and crossing queries supply triangle boxes, lash
 * contact supplies capsule boxes and the body envelope supplies point boxes,
 * all with finite XYZ extrema and centres in one metre frame. Every node
 * encloses every descendant, so its box distance is a lower bound for any
 * nearest-feature walk. No coordinate or identity changes; the stage sorts
 * the caller's array in place and keeps the original entries in its leaves,
 * and an input of at most twelve entries is returned as one leaf holding that
 * same array. Changing any entry's geometry requires rebuilding the tree.
 *
 * The widest node axis chooses each split, with X before Y before Z on equal
 * widths, and the stable centre sort keeps input order among equal centres.
 * The twelve-entry leaf size bounds direct entry work per leaf; it changes
 * traversal cost, never a query's answer. An empty input yields one leaf with
 * positive and negative infinity extrema, the empty union's sentinels rather
 * than a finite box; the signed query refuses empty surfaces before this
 * stage.
 *
 * @param entries Caller-owned entries, reordered in place.
 * @returns The hierarchy's root node.
 *
 * @evidence contracts/common.md#principled-implementation A median-split bounding-volume hierarchy: node extrema are the componentwise union of entry boxes, so enclosure holds by construction whatever split is chosen, and the median keeps depth logarithmic in the entry count.
 * @evidence contracts/common.md#clear-and-simple-design The builder only partitions boxes; admitting entries, reading their geometry and walking the tree belong to the queries, which share this one builder and its `IAutoMovieMeshQueryHierarchy` node type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No box is padded and no entry is dropped or merged, and the leaf size only trades traversal cost; the infinite sentinels of an empty leaf are stated instead of being replaced by a fake box.
 * @evidence contracts/common.md#meaningful-documentation States the suppliers and frame, the enclosure guarantee, the in-place sort and the shared small-input array, the split and tie rules, what the leaf size changes, and the empty sentinels.
 * @evidence contracts/performance.md#efficient-algorithms For n entries each level sorts its span once, O(n log n) per level over O(log n) levels, so O(n log^2 n) time and O(n log n) transient allocation from the per-level slices; a selection-based median would save a log factor but would lose the stable tie order the queries' deterministic witnesses rely on.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per compiled query or envelope; the tree is the reused artifact and is answered on its owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the returned tree, at most n/3 nodes for n above twelve with two three-number arrays each and leaf arrays of entry references; the per-level slices of internal nodes are garbage once their children are built.
 * @author Samchon
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
    if (
      high[candidate]! - low[candidate]! >
      high[axis]! - low[axis]!
    )
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
