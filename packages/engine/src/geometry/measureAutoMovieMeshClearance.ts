import { IAutoMovieMeshClearanceWitness } from "./IAutoMovieMeshClearanceWitness";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Measure front-minus-back depth over the complete projected overlap of two
 * triangle meshes. Each returned entry belongs to a front triangle and gives
 * its smallest signed separation from any back triangle, in mesh-local metres.
 * Positive is clear, zero is contact, negative violates the declared ordering.
 * An unreported triangle has no projected overlap. Neither input is changed.
 *
 * The depth difference is affine on each triangle-pair intersection polygon,
 * so its minimum occurs at a polygon vertex. Checking only mesh vertices misses
 * crossing edges and a curved resident surface inside a larger front triangle.
 * Coordinates for X/Y/Z depth are YZ/ZX/XY. Ray-parallel triangles are skipped:
 * this is directional surface ordering, not a closed-volume collision test.
 * Inputs must already share a frame; callers own transforms and contact pairs.
 * An optional visitor receives every overlap vertex, including already-clear
 * witnesses. A later coupled displacement must preserve those inequalities too.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Measures resident triangle separation for subsequent rigid placement or shared-surface contact without subject-specific geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains front triangle ordinals while evaluating their complete projected overlap with the supporting mesh.
 */
export function measureAutoMovieMeshClearance(
  front: IAutoMovieMesh,
  back: IAutoMovieMesh,
  axis: "x" | "y" | "z",
  visit?: (witness: IAutoMovieMeshClearanceWitness) => void,
): { triangle: number; minimum: number }[] {
  const axes = depthAxes(axis);
  const fronts = triangles(front, axes),
    backs = triangles(back, axes);
  // A hierarchy rejects disjoint projected regions before polygon clipping.
  // Touching bounds survive: an edge or point can own the minimum depth.
  const tree = triangleTree(backs.filter((t) => t.area !== 0));
  const result: { triangle: number; minimum: number }[] = [];
  for (const [triangle, a] of fronts.entries()) {
    if (a.area === 0) continue;
    let minimum = Infinity;
    for (const b of overlappingTriangles(tree, a.bounds)) {
      const overlap = clip(a.points, b);
      for (const point of overlap) {
        const weights = barycentric(a, point);
        const gap = depth(a, weights) - depth(b, barycentric(b, point));
        if (!Number.isFinite(gap))
          throw new Error("Mesh clearance arithmetic must remain finite.");
        minimum = Math.min(minimum, gap);
        visit?.({
          triangle,
          backTriangle: b.ordinal,
          vertices: [...a.vertices],
          weights,
          gap,
        });
      }
    }
    if (minimum !== Infinity) result.push({ triangle, minimum });
  }
  return result;
}

/**
 * Build a balanced immutable index over already validated projected triangles.
 * The widest-axis median avoids the quadratic prefix scan of an X-only list.
 * Eight triangles per leaf is a traversal cost choice, never a geometry sample
 * count: every leaf triangle still receives its own inclusive bounds test.
 * Halved spans and quarter-coordinate centre differences keep ordering
 * arithmetic finite even when the full coordinate range would overflow.
 */
function triangleTree(triangles: Triangle[]): TriangleTree | null {
  if (triangles.length === 0) return null;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const triangle of triangles)
    for (let axis = 0; axis < 2; axis++) {
      bounds[axis] = Math.min(bounds[axis], triangle.bounds[axis]);
      bounds[axis + 2] = Math.max(bounds[axis + 2], triangle.bounds[axis + 2]);
    }
  if (triangles.length <= 8) return { bounds, triangles };
  const axis =
    bounds[2] / 2 - bounds[0] / 2 >= bounds[3] / 2 - bounds[1] / 2 ? 0 : 1;
  const ordered = [...triangles].sort(
    (a, b) =>
      a.bounds[axis] / 4 +
      a.bounds[axis + 2] / 4 -
      (b.bounds[axis] / 4 + b.bounds[axis + 2] / 4),
  );
  const middle = Math.floor(ordered.length / 2);
  // Both nonempty children follow from length > 8 and the interior median.
  return {
    bounds,
    children: [
      triangleTree(ordered.slice(0, middle))!,
      triangleTree(ordered.slice(middle))!,
    ],
  };
}

/** Inclusive overlap preserves boundary contacts and rejects only proven gaps. */
function overlaps(a: number[], b: number[]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function* overlappingTriangles(
  tree: TriangleTree | null,
  bounds: number[],
): Generator<Triangle> {
  if (tree === null || !overlaps(tree.bounds, bounds)) return;
  if ("triangles" in tree) {
    for (const triangle of tree.triangles)
      if (overlaps(triangle.bounds, bounds)) yield triangle;
  } else
    for (const child of tree.children)
      yield* overlappingTriangles(child, bounds);
}

  points: number[][];
  vertices: number[];
  ordinal: number;
  area: number;
  bounds: number[];
};
type TriangleTree = {
  bounds: number[];
} & ({ triangles: Triangle[] } | { children: [TriangleTree, TriangleTree] });

/**
 * Build a balanced immutable index over already validated projected triangles.
 * The widest-axis median avoids the quadratic prefix scan of an X-only list.
 * Eight triangles per leaf is a traversal cost choice, never a geometry sample
 * count: every leaf triangle still receives its own inclusive bounds test.
 * Halved spans and quarter-coordinate centre differences keep ordering
 * arithmetic finite even when the full coordinate range would overflow.
 */
function triangleTree(triangles: Triangle[]): TriangleTree | null {
  if (triangles.length === 0) return null;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const triangle of triangles)
    for (let axis = 0; axis < 2; axis++) {
      bounds[axis] = Math.min(bounds[axis], triangle.bounds[axis]);
      bounds[axis + 2] = Math.max(bounds[axis + 2], triangle.bounds[axis + 2]);
    }
  if (triangles.length <= 8) return { bounds, triangles };
  const axis =
    bounds[2] / 2 - bounds[0] / 2 >= bounds[3] / 2 - bounds[1] / 2 ? 0 : 1;
  const ordered = [...triangles].sort(
    (a, b) =>
      a.bounds[axis] / 4 +
      a.bounds[axis + 2] / 4 -
      (b.bounds[axis] / 4 + b.bounds[axis + 2] / 4),
  );
  const middle = Math.floor(ordered.length / 2);
  // Both nonempty children follow from length > 8 and the interior median.
  return {
    bounds,
    children: [
      triangleTree(ordered.slice(0, middle))!,
      triangleTree(ordered.slice(middle))!,
    ],
  };
}

/** Inclusive overlap preserves boundary contacts and rejects only proven gaps. */
function overlaps(a: number[], b: number[]): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function* overlappingTriangles(
  tree: TriangleTree | null,
  bounds: number[],
): Generator<Triangle> {
  if (tree === null || !overlaps(tree.bounds, bounds)) return;
  if ("triangles" in tree) {
    for (const triangle of tree.triangles)
      if (overlaps(triangle.bounds, bounds)) yield triangle;
  } else
    for (const child of tree.children)
      yield* overlappingTriangles(child, bounds);
}
