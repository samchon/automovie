import type { IAutoMovieMeshQueryHierarchy } from "@automovie/interface";

/*
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
 */
export function refitMeshQueryHierarchy<
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
    refitMeshQueryHierarchy(source.left, replace);
  const right: IAutoMovieMeshQueryHierarchy<U> =
    refitMeshQueryHierarchy(source.right, replace);
  const low: number[] = [0, 1, 2].map((axis: number): number =>
    Math.min(left.low[axis]!, right.low[axis]!),
  );
  const high: number[] = [0, 1, 2].map((axis: number): number =>
    Math.max(left.high[axis]!, right.high[axis]!),
  );
  return { low, high, left, right };
}
