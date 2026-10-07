/**
 * Enclosing XYZ extrema retained at every node.
 * @author Samchon
 */
interface Bounds {
  low: number[];
  high: number[];
}

/**
 * A resident entry's enclosure plus its partition-only centre.
 * @author Samchon
 */
interface Box extends Bounds {
  centre: number[];
}

/**
 * One terminal resident population; entries retain their original identity.
 * @author Samchon
 */
interface Leaf<T> extends Bounds {
  triangles: T[];
}

/**
 * Two disjoint resident populations enclosed by their parent's extrema.
 * @author Samchon
 */
interface Branch<T> extends Bounds {
  left: Node<T>;
  right: Node<T>;
}

type Node<T> = Leaf<T> | Branch<T>;

/**
 * Partition admitted resident geometry bounds into a median box hierarchy.
 * Signed, separation and crossing queries supply triangle boxes; lash contact
 * supplies actual capsule boxes. All carry finite XYZ extrema and centres in
 * their shared metre frame. Every node encloses every descendant, making its
 * distance a lower bound for nearest-feature traversal. This stage changes no
 * coordinates or identity; it sorts its owned input array in place and retains
 * original entries in leaves. Recompiling changed geometry rebuilds the tree.
 *
 * The widest box axis chooses the split, with XYZ order breaking equal widths.
 * Stable centre sorting preserves input order for ties. A twelve-entry leaf
 * bounds direct feature work; this threshold changes traversal cost, not the
 * query's result. Admission and geometric classification belong to the caller;
 * this owner partitions its admitted enclosures without reading geometry.
 * An empty input yields a leaf with positive/negative infinity extrema as
 * empty-union sentinels; it is not a finite spatial box and the signed query
 * refuses empty surfaces before calling this stage.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Builds a reusable spatial partition of resident geometry bounds without catalogue-specific geometry or coordinate changes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reorders owned resident references while retaining identities and coordinates and reconstructing enclosing bounds for geometry queries.
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
