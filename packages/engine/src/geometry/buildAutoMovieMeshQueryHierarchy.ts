interface Box {
  low: number[];
  high: number[];
  centre: number[];
}

type Node<T> = {
  low: number[];
  high: number[];
} & ({ triangles: T[] } | { left: Node<T>; right: Node<T> });

/**
 * Partition admitted mesh-query triangles into a median bounding-box hierarchy.
 * The signed mesh query supplies finite XYZ boxes and their cached centres in
 * mesh-local metres. Every node encloses every descendant, making its distance
 * a lower bound for nearest-feature traversal. This stage changes no triangle
 * coordinates or identity; it sorts its owned input array in place and retains
 * triangle references in leaves. Recompiling changed geometry rebuilds the tree.
 *
 * The widest box axis chooses the split, with XYZ order breaking equal widths.
 * Stable centre sorting preserves input order for ties. A twelve-triangle leaf
 * bounds direct feature work; this threshold changes traversal cost, not the
 * query's nearest-feature result. Admission and geometric distance belong to
 * createAutoMovieSignedMeshQuery, which calls this after validating topology.
 * An empty input yields a leaf with positive/negative infinity extrema as
 * empty-union sentinels; it is not a finite spatial box and the signed query
 * refuses empty surfaces before calling this stage.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Builds a reusable spatial partition of resident triangles without catalogue-specific geometry or coordinate changes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reorders owned triangle references while retaining their identities and coordinates and reconstructs enclosing bounds for the signed query.
 */
export function buildAutoMovieMeshQueryHierarchy<T extends Box>(
  triangles: T[],
): Node<T> {
  const low = [Infinity, Infinity, Infinity],
    high = [-Infinity, -Infinity, -Infinity];
  for (const triangle of triangles)
    for (let axis = 0; axis < 3; axis++) {
      low[axis] = Math.min(low[axis], triangle.low[axis]);
      high[axis] = Math.max(high[axis], triangle.high[axis]);
    }
  if (triangles.length <= 12) return { low, high, triangles };
  const sizes = high.map((value, axis) => value - low[axis]),
    axis = sizes.indexOf(Math.max(...sizes));
  triangles.sort((a, b) => a.centre[axis] - b.centre[axis]);
  const middle = Math.floor(triangles.length / 2);
  return {
    low,
    high,
    left: buildAutoMovieMeshQueryHierarchy(triangles.slice(0, middle)),
    right: buildAutoMovieMeshQueryHierarchy(triangles.slice(middle)),
  };
}
