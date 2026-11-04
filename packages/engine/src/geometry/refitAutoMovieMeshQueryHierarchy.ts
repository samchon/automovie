import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";

/**
 * Refit an admitted hierarchy's fixed partition with fresh replacement entries.
 * The internal query owner supplies one replacement for every original leaf
 * entry, retaining its population and identity. Replacement bounds must enclose
 * the actual current geometry in one common metre frame. No entry is removed,
 * reordered or inspected for area; even a currently degenerate triangle keeps
 * its place for later snapshots. Boxes are recomputed from every replacement.
 *
 * The returned tree and leaf arrays are independent of the source tree. Entry
 * ownership belongs to replace; the crossing owner returns fresh triangle
 * records, so snapshots share only their immutable index layout. This primitive
 * neither mutates a resident tree nor caches a previous world placement.
 *
 * @evidence contracts/common.md#principled-implementation Bounding-volume refitting preserves the tree partition and replaces each leaf's geometry, then takes componentwise unions up to the root. These exact unions enclose all replacements independently of how the old partition was chosen, which keeps overlap and distance pruning sound.
 * @evidence contracts/common.md#clear-and-simple-design One internal refit owner separates fixed hierarchy topology from current entry bounds. The crossing geometry owner supplies ordinal-preserving replacements; indexing, admission, candidate sorting and narrow phase stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every leaf entry is replaced once without filtering, area tests, padding, transform approximations or actor policy. Original leaf order remains, and an empty leaf retains the existing infinity/-infinity empty-union bounds.
 * @evidence contracts/common.md#meaningful-documentation States admitted replacement premises, common metre frame, identity/population preservation, degenerate entries, independent tree/array ownership, callback entry ownership and empty semantics.
 * @evidence contracts/performance.md#efficient-algorithms Visits each node once and each of n leaf entries once, with three component unions per entry or branch: O(n) time and O(n) fresh retained tree storage. No sort or median repartition is repeated; an unsuitable old partition can cost more query traversal than a fresh build.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses only the source hierarchy's partition and leaf order, which remain valid for the same entry population. All current bounds come from replacements; no old bounds or point-dependent verdict survives.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers a new tree with two three-number bounds per node and one array per leaf. Recursion uses the existing balanced tree's logarithmic depth, and no source tree, callback or replacement history is retained by this function.
 */
export function refitAutoMovieMeshQueryHierarchy<
  T extends IAutoMovieMeshQueryHierarchy.IEntry,
  U extends IAutoMovieMeshQueryHierarchy.IEntry,
>(
  source: IAutoMovieMeshQueryHierarchy<T>,
  replace: (entry: T) => U,
): IAutoMovieMeshQueryHierarchy<U> {
  if ("triangles" in source) {
    const triangles: U[] = source.triangles.map(replace);
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (const entry of triangles)
      for (let axis: number = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis]!, entry.low[axis]!);
        high[axis] = Math.max(high[axis]!, entry.high[axis]!);
      }
    return { low, high, triangles };
  }

  const left: IAutoMovieMeshQueryHierarchy<U> =
    refitAutoMovieMeshQueryHierarchy(source.left, replace);
  const right: IAutoMovieMeshQueryHierarchy<U> =
    refitAutoMovieMeshQueryHierarchy(source.right, replace);
  const low: number[] = [0, 1, 2].map((axis: number): number =>
    Math.min(left.low[axis]!, right.low[axis]!),
  );
  const high: number[] = [0, 1, 2].map((axis: number): number =>
    Math.max(left.high[axis]!, right.high[axis]!),
  );
  return { low, high, left, right };
}
